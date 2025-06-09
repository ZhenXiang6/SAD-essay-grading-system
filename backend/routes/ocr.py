"""
POST /api/upload_segment_ocr
--------------------------------
描述：
  接收前端上傳的圖片檔案，先進行格線切割，再對切割後的每個格子圖片進行 OCR 辨識，
  最後回傳切割資訊與文字辨識結果。

請求：
  Content-Type: multipart/form-data
  form-data:
    image: 需上傳的圖片檔案（如掃描的作文稿紙）

回應：
  200 OK
  {
    "message": "切割並辨識成功",
    "result_text": "辨識後的文字結果字串"
  }

錯誤：
  400 缺少圖片檔案，或欄位名稱錯誤
  500 內部錯誤，含詳細錯誤訊息
"""


import os
import shutil
import tempfile
from flask import Blueprint, request, jsonify
from pathlib import Path

# 匯入你的 segment_grid 函式
from utils.grid_segmentation_intersections_2 import segment_grid
# 匯入你的 ocr_predict 函式
from utils.infer import ocr_predict

bp = Blueprint("process", __name__, url_prefix="/api")

@bp.route("/upload_segment_ocr", methods=["POST"])
def upload_segment_ocr():
    try:
        # 檢查是否有圖片檔案
        if "image" not in request.files:
            return jsonify({"error": "沒有上傳圖片檔"}), 400

        image_file = request.files["image"]
        
        # 檢查檔案是否有效
        if image_file.filename == '':
            return jsonify({"error": "沒有選擇檔案"}), 400
            
        # 檢查檔案類型
        if not image_file.content_type.startswith('image/'):
            return jsonify({"error": "請上傳圖片檔案"}), 400

        print(f"[DEBUG] 接收到圖片檔案: {image_file.filename}, 大小: {image_file.content_length}")

        temp_dir = tempfile.mkdtemp()
        print(f"[DEBUG] 建立暫存目錄: {temp_dir}")
        
        try:
            # 1. 儲存圖片
            img_path = os.path.join(temp_dir, "input.png")
            image_file.save(img_path)
            print(f"[DEBUG] 圖片已儲存到: {img_path}")

            # 檢查圖片是否成功儲存
            if not os.path.exists(img_path):
                raise Exception("圖片儲存失敗")

            # 2. 嘗試執行格線切割，如果失敗則使用簡單的OCR
            outdir = os.path.join(temp_dir, "outputs")
            result_text = ""
            
            try:
                print(f"[DEBUG] 開始格線切割...")
                # 使用更寬鬆的參數進行格線切割
                segment_grid(img_path, outdir, tol=15, max_skew=30.0, ang_thr=8.0)
                print(f"[DEBUG] 格線切割完成")

                # 3. OCR 辨識切割後的圖片資料夾
                cells_dir = os.path.join(outdir, "cells")
                
                # 檢查cells目錄是否存在
                if not os.path.exists(cells_dir):
                    raise Exception("格線切割失敗，沒有產生切割結果")
                    
                # 檢查是否有切割的圖片
                cell_files = list(Path(cells_dir).glob("*.png"))
                print(f"[DEBUG] 找到 {len(cell_files)} 個切割的格子")
                
                if len(cell_files) == 0:
                    raise Exception("格線切割沒有產生任何格子圖片")

                # 4. 呼叫 ocr_predict，傳入切割後的資料夾路徑
                ckpt_path = os.environ.get("OCR_MODEL_PATH", "./checkpoints/resnet18_ft_100epoch.pth")
                cls_path = os.environ.get("OCR_CLASS_PATH", "./checkpoints/class_to_idx.json")
                
                # 檢查模型檔案是否存在
                if not os.path.exists(ckpt_path):
                    raise Exception(f"OCR模型檔案不存在: {ckpt_path}")
                if not os.path.exists(cls_path):
                    raise Exception(f"OCR類別檔案不存在: {cls_path}")
                    
                print(f"[DEBUG] 開始OCR辨識...")
                result_text = ocr_predict(cells_dir, ckpt_path, cls_path)
                print(f"[DEBUG] OCR辨識完成，結果: {result_text[:50]}...")
                
            except Exception as grid_error:
                print(f"[WARNING] 格線切割失敗: {str(grid_error)}")
                print(f"[DEBUG] 嘗試使用fallback OCR方法...")
                
                # Fallback: 使用簡單的OCR方法
                try:
                    import cv2
                    import pytesseract
                    
                    # 讀取圖片並進行簡單的OCR
                    img = cv2.imread(img_path)
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    
                    # 使用pytesseract進行OCR，設定中文
                    result_text = pytesseract.image_to_string(gray, lang='chi_tra+chi_sim')
                    
                    # 清理結果
                    result_text = result_text.strip()
                    if not result_text:
                        result_text = "無法辨識圖片中的文字，請確保圖片清晰且包含中文文字。"
                    
                    print(f"[DEBUG] Fallback OCR完成，結果: {result_text[:50]}...")
                    
                except Exception as ocr_error:
                    print(f"[ERROR] Fallback OCR也失敗: {str(ocr_error)}")
                    result_text = "OCR辨識失敗。請確保上傳的是清晰的作文稿紙圖片，或嘗試使用文字輸入模式。"

            # 5. 回傳結果
            return jsonify({
                "message": "切割並辨識成功",
                "result_text": result_text,
                "debug_info": {
                    "cells_count": len(cell_files),
                    "temp_dir": temp_dir
                }
            })
            
        except Exception as e:
            print(f"[ERROR] 處理過程中發生錯誤: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"處理失敗: {str(e)}",
                "debug_info": {
                    "temp_dir": temp_dir,
                    "step": "processing"
                }
            }), 500
        finally:
            # 清理暫存資料夾
            try:
                shutil.rmtree(temp_dir)
                print(f"[DEBUG] 清理暫存目錄: {temp_dir}")
            except Exception as cleanup_error:
                print(f"[WARNING] 清理暫存目錄失敗: {cleanup_error}")
                
    except Exception as e:
        print(f"[ERROR] API請求處理失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"API請求處理失敗: {str(e)}",
            "debug_info": {
                "step": "request_handling"
            }
        }), 500
