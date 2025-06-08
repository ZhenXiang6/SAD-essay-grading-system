import os
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

bp = Blueprint("refine", __name__, url_prefix="/api")

API_KEY = os.getenv("GEMINI_API_KEY")
API_URL = os.getenv("GEMINI_API_URL")

@bp.route("/refine_ocr_text", methods=["POST"])
def refine_ocr_text():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "請提供 text 欄位"}), 400
        
        original_text = data.get("text", "").strip()
        if not original_text:
            return jsonify({"error": "text 內容為空"}), 400

        if not API_KEY or not API_URL:
            return jsonify({"error": "API_KEY 或 API_URL 尚未設定或讀取失敗"}), 500

        prompt = f"""請協助我改善以下從圖片辨識出來的文字，使其更通順、符合語意但不改變原本內容意思。
請僅回傳修正後的段落，不需要解釋與格式說明。

原始文字：
{original_text}
"""

        # 呼叫 Gemini API
        response = requests.post(
            f"{API_URL}?key={API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ]
            }
        )

        response.raise_for_status()
        result = response.json()

        # 根據官方格式，取 candidates 裡第一筆的 content 物件內的 parts 第一筆的 text
        refined_text = None
        candidates = result.get("candidates")
        if candidates and len(candidates) > 0:
            content = candidates[0].get("content")
            if content:
                parts = content.get("parts")
                if parts and len(parts) > 0:
                    refined_text = parts[0].get("text")

        if not refined_text:
            return jsonify({"error": "無法取得回傳的 refined_text"}), 500

        return jsonify({"refined_text": refined_text.strip()})

    except Exception as e:
        # 印出完整錯誤，方便除錯
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500