from pathlib import Path
import json, torch, torchvision.transforms as T
from PIL import Image
from torch import nn
from torchvision.models import resnet18
import numpy as np
import re
from typing import List, Tuple

# 將圖片轉換成黑白
class BinarizeFixed:
    def __init__(self, thresh: int = 128):
        self.thresh = thresh
    def __call__(self, img: Image.Image) -> Image.Image:
        arr = np.array(img.convert("L"))
        bin_img = (arr >= self.thresh).astype(np.uint8) * 255
        return Image.fromarray(bin_img, mode="L")

# 正規表達式，抓 row 與 col 編號
PATTERN = re.compile(r"r(\d+)_c(\d+)\.", re.IGNORECASE)

def reorder_imgs(all_imgs: List[Path]) -> List[Path]:
    ordered = []
    for p in all_imgs:
        m = PATTERN.search(p.name)
        if not m:
            print(f"⚠️ 檔名不符格式：{p.name}")
            continue
        row, col = map(int, m.groups())
        ordered.append((p, row, col))
    ordered.sort(key=lambda t: (-t[2], t[1]))  # 依 col 由大到小、row 由小到大
    return [p for p, _, _ in ordered]



def ocr_predict(root_dir: str,
                ckpt_path: str,
                cls_path: str,
                topk: int = 3,
                device: str = None) -> str:
    """
    傳入根目錄路徑(含文字格子圖片的資料夾)
    輸出辨識後字串
    """
    # 設備判斷
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    # 載入 class_to_idx
    # class_to_idx = json.loads(Path(cls_path).read_text())
    class_to_idx = json.loads(Path(cls_path).read_text(encoding="utf-8"))
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    num_class = len(idx_to_class)

    # 建立模型
    model = resnet18(weights=None)
    model.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
    model.fc = nn.Linear(model.fc.in_features, num_class)

    # 載入權重
    state = torch.load(ckpt_path, map_location="cpu", weights_only=False)
    model.load_state_dict(state, strict=False)
    model.to(device).eval()

    # 影像前處理
    mean = std = 0.5
    transform = T.Compose([
        T.Grayscale(),
        BinarizeFixed(),
        T.Resize((96, 96), antialias=True),
        T.ToTensor(),
        T.Normalize([mean], [std]),
    ])

    @torch.inference_mode()
    def predict(img_path: Path):
        img = Image.open(img_path).convert("L")
        x = transform(img).unsqueeze(0).to(device)
        prob = torch.softmax(model(x), dim=1)[0]
        topk_prob, topk_idx = prob.topk(topk)
        out = []
        for p, idx in zip(topk_prob, topk_idx):
            cls_name = idx_to_class[idx.item()]
            char = chr(int(cls_name[2:], 16)) if cls_name.startswith("U+") else cls_name
            out.append((idx.item(), float(p), char))
        return out

    root = Path(root_dir)
    all_imgs = list(root.rglob("*.png"))
    total = len(all_imgs)
    sorted_imgs = reorder_imgs(all_imgs)

    out = []

    for i, img_path in enumerate(sorted_imgs, 1):
        top_preds = predict(img_path)

        best_idx, best_prob, best_char = top_preds[0]

        if best_char != "空白格":
            out.append(best_char)

        # 即時列印可視需求開啟
        # rel_path = img_path.relative_to(root)
        # top3_str = " | ".join(f"{ch}({prob:.2%})" for _, prob, ch in top_preds)
        # print(f"[{i:>5}/{total}]  {rel_path}\t{top3_str}", flush=True)

    return "".join(out)

