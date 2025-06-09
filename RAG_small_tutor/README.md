# RAG‑Chatbot

> 以 **FastAPI + LangChain + Google Gemini** 打造的文件檢索問答（RAG）系統，並用 **Streamlit** 提供 Chat UI。專案適合部署在本機或雲端，支援大型 PDF（財報、技術手冊等）離線向量化。

---

## 📂 目錄結構

```text
rag-app/
├── backend/                 # FastAPI 伺服器與 RAG 核心
│   ├── RAG.py              # 主程式（REST API）
│   ├── build_index.py      # ✨ 第一次離線建索引用
│   ├── faiss_index/        # 向量庫快取（首次建立後自動生成）
│   └── requirements.txt    # 後端依賴
├── frontend/                # Streamlit 前端
│   ├── app.py              # Chat UI
│   └── requirements.txt    # 前端依賴
└── doc/                     # 放置原始 PDF 文件
```

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
# 後端
cd backend
pip install -r requirements.txt

# 前端（另開終端機）
cd ../frontend
pip install -r requirements.txt
```

### 2. 放置 PDF

將要檢索的文件放入 **`doc/`** 資料夾。(在本次實作中，我將2024年修金融產業專題的上課簡報放入資料夾中)

### 3. 第一次：生成 FAISS 向量索引

```bash
cd backend
python build_index.py        # 解析 PDF → 切片 → 嵌入 → faiss_index/
```

*執行時間取決於檔案大小與網路速度，只需跑一次。*

### 4. 啟動後端 API

```bash
uvicorn RAG:app --reload --port 8000
```

* 若要公開到遠端： `--host 0.0.0.0` 並確保防火牆放行 8000 連接埠。

### 5. 啟動前端 Chat UI

```bash
cd ../frontend
streamlit run app.py         # 預設 http://localhost:8501
```

開啟瀏覽器(http://localhost:8501) → 提問，即可開始與文件對話。

---

## ⚙️ 主要技術

| 模組                                           | 用途                                              |
| -------------------------------------------- | ----------------------------------------------- |
| **FastAPI**                                  | REST API 伺服器                                    |
| **LangChain** `ConversationalRetrievalChain` | RAG 邏輯（檢索 + 生成）                                 |
| **FAISS**                                    | 本地向量資料庫，支援億級向量檢索                                |
| **Google Generative AI**                     | 文字嵌入（`embedding-001`）＆ 生成模型（`gemini‑1.5‑flash`） |
| **Streamlit**                                | 簡易 Web 前端，含聊天元件                                 |

---

## 🛠️ build\_index.py 亮點

* **lazy loading**：解析 PDF 時一次只讀一頁，降低記憶體佔用。
* **save\_local / load\_local**：向量庫落地為 `faiss_index/`，FastAPI 啟動秒級完成。
* **可切換 Loader**：預設 `PyPDFLoader`；如需更快解析可改 `PyMuPDFLoader`。

---


## 🧹 清理 / 重新索引

```bash
rm -rf backend/faiss_index
python backend/build_index.py
```
