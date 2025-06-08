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
    if "image" not in request.files:
        return jsonify({"error": "沒有上傳圖片檔"}), 400

    image_file = request.files["image"]

    temp_dir = tempfile.mkdtemp()
    try:
        # 1. 儲存圖片
        img_path = os.path.join(temp_dir, "input.png")
        image_file.save(img_path)

        # 2. 執行格線切割
        outdir = os.path.join(temp_dir, "outputs")
        segment_grid(img_path, outdir, tol=10, max_skew=20.0, ang_thr=5.0)

        # 3. OCR 辨識切割後的圖片資料夾
        cells_dir = os.path.join(outdir, "cells")

        # 4. 呼叫 ocr_predict，傳入切割後的資料夾路徑
        # 請依實際路徑調整模型權重和字典路徑，路徑是以 Backend 為跟目錄的路徑
        ckpt_path = "./checkpoints/resnet18_ft_100epoch.pth"
        cls_path = "./checkpoints/class_to_idx.json"
        

        result_text = ocr_predict(cells_dir, ckpt_path, cls_path)
        
        # ------------------------------------------------------
        # # 4. 永久存檔切割結果
        # permanent_dir = os.path.abspath("./static/outputs")
        # os.makedirs(permanent_dir, exist_ok=True)

        # # 產生唯一資料夾名稱，可用時間戳或 UUID
        # import datetime, uuid
        # unique_folder_name = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_") + str(uuid.uuid4())[:8]
        # save_path = os.path.join(permanent_dir, unique_folder_name)

        # # 將臨時切割結果複製過去
        # shutil.copytree(outdir, save_path)
        # ------------------------------------------------------

        # 5. 回傳結果
        return jsonify({
            "message": "切割並辨識成功",
            "result_text": result_text,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # 視需要刪除暫存資料夾
        shutil.rmtree(temp_dir)
        pass