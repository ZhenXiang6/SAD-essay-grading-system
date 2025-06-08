"""grid_segmentation_hough.py — v1.3

Grid‑cell cutter for Chinese composition manuscript paper (作文稿紙)
==================================================================

> **完全改用 `HoughLinesP` 偵測格線 → 直接切格**
>
> * Deskew（去斜）沿用 v1.2：HoughLinesP / 投影法找全圖傾斜角。 
> * **切格核心改為：「在已校正影像上跑 HoughLinesP → 分群水平／垂直線 → 取線集中心 → 以相鄰線分割格子」。**
> * 不再依賴形態學侵蝕╱膨脹，一步到位；若格線印刷清晰，速度更快、偵測更準。

📂 **輸出**
-----------------
* `grid_mask.png`     — 以偵測到線段重繪的二值格線（白）
* `intersections.png` — 交點可視化（白點）
* `deskewed_preview.png`, `skew_debug.txt` — 與 v1.2 相同
* `cells/ rXX_cYY.png`, `cells.json`        — 切圖與中繼資料

💻 **使用**
----------
```bash
pip install opencv-python numpy pillow tqdm
python grid_segmentation_hough.py \
  --image IMG.png --outdir outputs \
  --tol 10 --max_skew 20 --ang_thr 5
```
可選參數（預設值）：
```
--tol 10       # 交點群聚容忍度
--ang_thr 5    # 判定水平／垂直線的角度門檻 (deg)
--max_skew 20  # 去斜最大搜尋角度
```
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
from tqdm import tqdm

# --------------------------- Utils --------------------------- #

def _binarize(gray: np.ndarray) -> np.ndarray:
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    return cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                 cv2.THRESH_BINARY_INV, 19, 8)


# --------------------------- Deskew (same as v1.2) --------------------------- #

def _angle_from_points(x1: int, y1: int, x2: int, y2: int) -> float:
    ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
    while ang <= -90:
        ang += 180
    while ang > 90:
        ang -= 180
    return ang


def _estimate_skew(gray: np.ndarray, bin_img: np.ndarray, *, max_skew: float = 20.0) -> Tuple[float, str]:
    # --- Hough coarse --- #
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    min_len = int(min(gray.shape) * 0.25)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=80,
                            minLineLength=min_len, maxLineGap=15)
    if lines is not None and len(lines) >= 10:
        angs = []
        for x1, y1, x2, y2 in lines[:, 0]:
            a = _angle_from_points(x1, y1, x2, y2)
            if abs(a) > 85:  # ignore nearly vertical
                continue
            if abs(a) <= max_skew:
                angs.append(a)
        if len(angs) >= 10 and np.std(angs) >= 0.3:
            return float(np.median(angs)), "hough"
    # --- Projection fallback --- #
    white = 255
    variances = []
    h, w = bin_img.shape
    for deg in range(-int(max_skew), int(max_skew) + 1):
        M = cv2.getRotationMatrix2D((w // 2, h // 2), deg, 1)
        rot = cv2.warpAffine(bin_img, M, (w, h), flags=cv2.INTER_NEAREST,
                             borderValue=white)
        proj = np.sum(rot == 0, axis=1)
        variances.append((float(np.var(proj)), float(deg)))
    _, best = max(variances, key=lambda t: t[0])
    return best, "projection"


def _rotate(image: np.ndarray, angle: float) -> np.ndarray:
    if abs(angle) < 1e-2:
        return image
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1)
    cos, sin = abs(M[0, 0]), abs(M[0, 1])
    nW, nH = int(h * sin + w * cos), int(h * cos + w * sin)
    M[0, 2] += (nW / 2) - center[0]
    M[1, 2] += (nH / 2) - center[1]
    return cv2.warpAffine(image, M, (nW, nH), flags=cv2.INTER_LINEAR,
                          borderValue=255)


# --------------------------- Grid detection via Hough --------------------------- #

def _cluster(vals: List[int], tol: int) -> List[int]:
    if not vals:
        return []
    vals.sort()
    groups = [[vals[0]]]
    for v in vals[1:]:
        if abs(v - groups[-1][-1]) <= tol:
            groups[-1].append(v)
        else:
            groups.append([v])
    return [int(np.mean(g)) for g in groups]


def _grid_coords_hough(gray: np.ndarray, *, tol: int, ang_thr: float) -> Tuple[List[int], List[int]]:
    """Detect grid‑line coordinates purely via HoughLinesP."""
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    min_len = int(min(gray.shape) * 0.2)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=120,
                            minLineLength=min_len, maxLineGap=10)
    if lines is None or len(lines) < 10:
        raise RuntimeError("Insufficient Hough lines; image too noisy or faint.")

    xs, ys = [], []
    for x1, y1, x2, y2 in lines[:, 0]:
        angle = abs(_angle_from_points(x1, y1, x2, y2))
        if angle <= ang_thr:  # horizontal
            ys.append(int((y1 + y2) / 2))
        elif angle >= 90 - ang_thr:  # vertical
            xs.append(int((x1 + x2) / 2))
    xs_c = _cluster(xs, tol)
    ys_c = _cluster(ys, tol)
    if len(xs_c) < 2 or len(ys_c) < 2:
        raise RuntimeError("Failed to find enough horizontal/vertical lines.")
    return xs_c, ys_c


def _draw_grid_mask(shape: Tuple[int, int], xs: List[int], ys: List[int]) -> np.ndarray:
    mask = np.zeros(shape, np.uint8)
    for x in xs:
        cv2.line(mask, (x, 0), (x, shape[0] - 1), 255, 1)
    for y in ys:
        cv2.line(mask, (0, y), (shape[1] - 1, y), 255, 1)
    return mask


# --------------------------- Main segmentation --------------------------- #

def segment_grid(image_path: str | Path, outdir: str | Path = "outputs", *,
                 tol: int = 10, max_skew: float = 20.0, ang_thr: float = 5.0):
    out = Path(outdir)
    (out / "cells").mkdir(parents=True, exist_ok=True)

    gray0 = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if gray0 is None:
        raise FileNotFoundError(image_path)
    bin0 = _binarize(gray0)

    angle, method = _estimate_skew(gray0, bin0, max_skew=max_skew)
    gray = _rotate(gray0, angle)
    cv2.imwrite(str(out / "deskewed_preview.png"), gray)
    with open(out / "skew_debug.txt", "w") as fp:
        fp.write(f"angle={angle:.3f}\nmethod={method}\n")

    # ---- Hough for grid lines ---- #
    xs, ys = _grid_coords_hough(gray, tol=tol, ang_thr=ang_thr)

    # ---- Save masks & intersections ---- #
    mask = _draw_grid_mask(gray.shape, xs, ys)
    cv2.imwrite(str(out / "grid_mask.png"), mask)

    inter_vis = np.zeros_like(gray)
    for x in xs:
        for y in ys:
            cv2.circle(inter_vis, (x, y), 2, 255, -1)
    cv2.imwrite(str(out / "intersections.png"), inter_vis)

    # ---- Crop cells ---- #
    meta = []
    cells_dir = out / "cells"
    for r in range(len(ys) - 1):
        for c in range(len(xs) - 1):
            x1, x2 = xs[c], xs[c + 1]
            y1, y2 = ys[r], ys[r + 1]
            crop = gray[y1:y2, x1:x2]
            fname = f"r{r+1:02d}_c{c+1:02d}.png"
            cv2.imwrite(str(cells_dir / fname), crop)
            meta.append({
                "row": r + 1, "col": c + 1,
                "x": int(x1), "y": int(y1),
                "w": int(x2 - x1), "h": int(y2 - y1),
                "file": str(cells_dir / fname),
                "deskew_angle": angle, "deskew_method": method,
            })

    with open(out / "cells.json", "w", encoding="utf-8") as fp:
        json.dump(meta, fp, ensure_ascii=False, indent=2)
    return meta


# --------------------------- CLI --------------------------- #

# if __name__ == "__main__":
#     p = argparse.ArgumentParser(description="Segment manuscript grid with pure HoughLinesP.")
#     p.add_argument("--image", required=True)
#     p.add_argument("--outdir", default="outputs")
#     p.add_argument("--tol", type=int, default=10)
#     p.add_argument("--max_skew", type=float, default=20.0)
#     p.add_argument("--ang_thr", type=float, default=5.0,
#                    help="Angle threshold (deg) to classify horizontal / vertical lines")
#     args = p.parse_args()

#     segment_grid(args.image, args.outdir,
#                  tol=args.tol, max_skew=args.max_skew, ang_thr=args.ang_thr)
#     print(f"✅ Finished. Outputs in {args.outdir}")
