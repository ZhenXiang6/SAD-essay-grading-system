# 系統分析與設計期末報告：學測國文寫作AI批改系統

## 專案簡介
一款 AI 評分國寫作文的系統，透過拍照上傳作文來取得分數，大幅減少批改所需等待的時間，並能針對學生表現進行弱點分析，提供具體建議，協助學生針對弱點進行學習與改進。

建議至我們的github網址: https://github.com/ZhenXiang6/SAD-essay-grading-system 閱讀 README 以獲取良好的閱讀體驗。

## 🎯 系統特色

- **🔍 自訓練ResNet OCR模型**：專門針對中文手寫文字優化的神經網路模型
- **🤖 Gemini AI文字優化**：使用Google Gemini API進行智能文字後處理
- **🌐 React前端界面**：現代化響應式設計，支援移動端
- **📐 智能格線切割**：自動識別稿紙格線並進行精確切割
- **🐳 Docker容器化**：一鍵部署，環境隔離
- **⚡ 高效處理**：端到端的作文處理流程

## 📋 主要功能

### OCR文字識別
- **格線切割**：自動識別稿紙格線並切割成單個字符區域
- **ResNet模型**：使用自訓練的ResNet18模型進行中文手寫文字識別
- **高準確率**：針對中文手寫文字特別優化

### AI文字優化
- **Gemini API**：使用Google Gemini AI進行文字後處理
- **語意修正**：自動修正OCR識別錯誤，保持原意
- **語法優化**：提升文字流暢度和可讀性

### 前端界面
- **拖拽上傳**：支援上傳圖片文件
- **實時預覽**：即時顯示處理進度和結果
- **響應式設計**：適配各種設備尺寸
- **現代化UI**：使用React和現代CSS設計

### RAG 作文小家教
* 透過向量資料庫，可以讓 LLM 閱讀寫作技巧等資料來獲取相關知識，以成為作文小家教
* 使用者可以和RAG小家教對話，透過交流來學習作文撰寫的技巧

### 使用者管理

* 用戶登入/註冊與信箱驗證，並將使用者資料存進supabase
* 儲存上傳作文與評分結果進supabase，保障使用流程完整


## 🏗️ 系統架構

```mermaid
graph TD
    A[用戶瀏覽器] -->|訪問 http://localhost:3000| B(Nginx 反向代理)
    B -->|靜態文件服務| C(React 前端)
    C -->|API 請求 /api/...| B
    B -->|代理到 http://backend:5000| D(Flask 後端)
    D -->|調用 OCR 模型| E(ResNet OCR 模型)
    D -->|調用 Gemini API| F(Google Gemini API)
    E -->|識別結果| D
    F -->|優化結果| D
    D -->|處理結果| C
    C -->|顯示結果| A
```
## User Stories Mapping

請參照**其餘文件**資料夾中的 **User_Stories_Mapping.png**

## Figma 介面設計

經過使用者訪談後，我們對 MVP 所需具備的功能與介面進行迭代，設計了全新wireframe，請參照**其餘文件**資料夾中的 **figma_design.png**

## 測試說明

為驗證系統功能正確性，本次專案特別請我們的組員，**萬里雲 QA 實習生陳奕廷** 負責測試的部分，撰寫的測試報告請參照測試報告請參照**其餘文件**資料夾中的 **SAD測試報告.pdf**

## 🔧 API文檔

### OCR識別端點
```http
POST /api/upload_segment_ocr
Content-Type: multipart/form-data

參數：
- image: 圖片文件（支援PNG, JPG, JPEG等格式）

回應：
{
  "message": "切割並辨識成功",
  "result_text": "識別後的文字結果"
}
```

### 文字優化端點
```http
POST /api/refine_ocr_text
Content-Type: application/json

參數：
{
  "text": "需要優化的文字"
}

回應：
{
  "refined_text": "優化後的文字"
}
```

## 影像辨識技術說明

因正確辨識作文中的字為本次專題中最重要的一部分，因此我們特別說明相關技術的實作細節。

### 稿紙格線切割

在手寫作文辨識任務中，準確分割每一個字格是整體系統成效的關鍵。若格線切割不精確，將直接影響後續 OCR 模型的辨識表現。因此，本專案開發了一套基於 OpenCV 的自動稿紙格線切割流程，核心特色如下：

#### 核心技術

- 採用 `HoughLinesP` 偵測水平方向與垂直方向的格線。
- 自動進行圖像「去斜（deskew）」處理，校正掃描時產生的傾斜。
- 利用線段群聚與交點計算方式，自動判定各格子區塊並裁切。

#### 實作流程

1. **預處理**
   - 將輸入圖像轉為灰階並二值化，以強化格線對比。
2. **去斜處理**
   - 使用 `HoughLinesP` 或垂直投影法估算傾斜角度，進行旋轉校正。
3. **格線偵測**
   - 偵測出所有直線後，依據角度分類為水平線／垂直線。
   - 相近線條進行分群平均，以補足斷裂或重複格線。
4. **格子裁切**
   - 計算所有交點後，即可切割出完整格子。
   - 輸出每格影像與對應的座標中繼資料。

### OCR模型訓練

因為市面上較少針對手寫繁體字的 OCR 模組，本專案選擇採用自行訓練模型的方式，以達到更高的辨識準確度。

#### 使用資料集

- 資料來源：[AI-FREE-Team / Traditional-Chinese-Handwriting-Dataset](https://github.com/AI-FREE-Team/Traditional-Chinese-Handwriting-Dataset)

#### 訓練流程

1. **資料預處理**
   - 參考教育部《常用字字表》，過濾掉資料集中約 2/3 的生僻字，專注於常用字的辨識。
2. **自定義擴充**
   - 額外加入常見的手寫標點符號及空白格以提升實務應用表現。
3. **訓練前處理**
   - 將訓練資料進行二值化操作，並透過隨機縮放、旋轉等步驟來模擬實際預測可能會遇到的不同手寫風格。
3. **模型架構**
   - 採用 **ResNet-18** 作為主幹網路（Backbone）。
   - 對已經預訓練好的**ResNet-18**模型進行 Fine-tuning。
   - 共訓練 **100 個 epoch**。
4. **訓練成果**
   - 模型於驗證集達成 **99% 的準確率（Validation Accuracy）**。
5. **實測結果**
   - 模型實際應用於手寫範文測試，平均辨識準確率達 **95%**，**表現優於多數現成 OCR 解決方案**。



## 🚀 快速開始

### 前置需求

- Docker
- Docker Compose
- Gemini API Key

### 安裝步驟

1. **克隆項目**
```bash
git clone https://github.com/ZhenXiang6/SAD-essay-grading-system.git
cd SAD-essay-grading-system
```

2. **設置環境變數**
```bash
cp .env.example .env
# 編輯 .env 文件，填入您的 Gemini API Key
```

3. **獲取Gemini API Key**
- 訪問：https://makersuite.google.com/app/apikey
- 創建API Key並複製到.env文件中

4. **一鍵啟動**
```bash
./start.sh
```

5. **訪問應用**
- 前端界面：http://localhost:3000
- 後端API：http://localhost:5000


## 📁 項目結構

```
SAD-essay-grading-system/
├── frontend/                   # React前端應用
│   ├── src/                    # 源代碼
│   └── package.json            # 前端依賴
├── backend/                    # Flask後端應用
│   ├── app.py                  # 主應用文件
│   ├── routes/                 # API路由
│   │   ├── ocr.py              # OCR識別路由
│   │   └── refined_ocr_text.py # 文字優化路由
│   ├── utils/                  # 工具函數
│   │   ├── grid_segmentation_intersections_2.py  # 格線切割
│   │   └── infer.py            # OCR推理
│   ├── checkpoints/            # 模型文件
│   │   ├── resnet18_ft_100epoch.pth  # ResNet模型
│   │   └── class_to_idx.json   # 類別映射
│   └── requirements.txt        # 後端依賴
├── docker-compose.yml          # Docker Compose配置
├── Dockerfile.frontend         # 前端Docker配置
├── Dockerfile.backend          # 後端Docker配置
├── nginx.conf                  # Nginx配置
├── start.sh                    # 啟動腳本
├── .env.example                # 環境變數範例
└── README.md                   # 項目說明
```

## ⚙️ 配置說明

### 環境變數

| 變數名 | 說明 | 預設值 |
|--------|------|--------|
| GEMINI_API_KEY | Gemini API密鑰 | 必填 |
| GEMINI_API_URL | Gemini API端點 | https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent |
| FLASK_ENV | Flask環境 | production |
| UPLOAD_FOLDER | 上傳文件目錄 | static/uploads |
| OUTPUT_FOLDER | 輸出文件目錄 | static/outputs |

### OCR模型配置

- **模型架構**：ResNet18
- **訓練數據**：中文手寫文字數據集
- **輸入尺寸**：32x32像素
- **字符類別**：支援中文字符、數字、標點符號

### 格線切割參數

- **容差值**：10像素
- **最大傾斜角**：20度
- **角度閾值**：5度

## 🔍 使用說明

### 基本流程

1. **打開應用**：訪問 http://localhost:3000
2. **上傳圖片**：拖拽或點擊上傳作文圖片
3. **自動處理**：系統自動進行格線切割和OCR識別
4. **文字優化**：使用Gemini AI優化識別結果
5. **獲取結果**：下載或複製最終的文字結果

### 支援的圖片格式

- PNG
- JPG/JPEG
- GIF
- BMP
- TIFF

### 最佳實踐

- **圖片清晰度**：確保圖片清晰，文字可辨識
- **光線充足**：避免陰影和反光
- **格線完整**：確保稿紙格線清晰可見
- **文字大小**：建議文字大小適中，不要過小

## 🛠️ 開發指南

### 本地開發

1. **後端開發**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

2. **前端開發**
```bash
cd frontend
npm install
npm run dev
```

### 模型訓練

如需重新訓練OCR模型：

1. 準備訓練數據
2. 使用 `train_ocr/` 目錄中的訓練腳本
3. 更新模型文件路徑

### 添加新功能

1. **後端API**：在 `backend/routes/` 中添加新路由
2. **前端組件**：在 `frontend/src/components/` 中添加新組件
3. **更新Docker**：修改相應的Dockerfile

## 🐛 故障排除

### 常見問題

1. **OCR模型加載失敗**
   - 檢查模型文件是否存在
   - 確認文件路徑正確
   - 檢查PyTorch版本兼容性

2. **Gemini API調用失敗**
   - 檢查API Key是否正確
   - 確認網路連接正常
   - 檢查API配額是否用完

3. **Docker啟動失敗**
   - 檢查端口是否被占用
   - 確認Docker服務正常運行
   - 查看容器日誌

### 日誌查看

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看容器狀態
docker-compose ps
```

## 📊 性能指標

- **OCR準確率**：>95%（中文手寫文字）
- **處理速度**：<5秒（標準A4稿紙）
- **支援並發**：10個用戶同時使用
- **記憶體使用**：<2GB（包含模型）

## 🔒 安全考量

- **文件上傳**：限制文件大小和格式
- **API限流**：防止API濫用
- **數據隱私**：不保存用戶上傳的圖片
- **環境隔離**：使用Docker容器隔離

## 📈 未來規劃

- [ ] 支援更多語言的OCR識別
- [ ] 添加作文評分功能
- [ ] 整合更多AI模型
- [ ] 支援批量處理
- [ ] 添加用戶管理系統
- [ ] 提供API文檔界面

---
