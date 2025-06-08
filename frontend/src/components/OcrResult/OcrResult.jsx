import "./OcrResult.css";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // 移除 useNavigate

function OcrResult() {
  const location = useLocation();

  // 初始值來自 location.state
  const initialOcrText = location.state?.ocrText || "";

  const [editedText, setEditedText] = useState(initialOcrText);
  const [isLoading, setIsLoading] = useState(false);
  const [refinedResult, setRefinedResult] = useState(null); // 用於儲存優化後的結果

  // 確保頁面載入時顯示 OCR 文本
  useEffect(() => {
    if (initialOcrText) {
      setEditedText(initialOcrText);
    }
  }, [initialOcrText]);

  const handleRefineText = async () => {
    if (!editedText.trim()) {
      alert("目前內容為空，無法優化！");
      return;
    }

    console.log("▶️ 發送給後端的文字內容:", editedText);

    setIsLoading(true);
    // API_URL 應該由 Nginx 處理，所以這裡直接使用相對路徑
    const API_ENDPOINT = "/api/refine_ocr_text"; 

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedText }),
      });

      console.log("⬅️ HTTP狀態碼:", res.status);

      const data = await res.json();
      console.log("⬅️ 後端回傳資料:", data);

      if (!data || !data.refined_text) throw new Error("回傳內容錯誤！");

      const refined = data.refined_text;
      setEditedText(refined); // 更新文本框內容為優化後的文字
      setRefinedResult(refined); // 儲存優化後的結果

    } catch (err) {
      console.error("優化文字錯誤：", err);
      alert("❌ 優化失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ocr-result-page">
      <main className="ocr-content">
        <h1>OCR 識別與文字優化</h1>
        <label htmlFor="recognizedText">請確認內容是否正確，若有錯誤請於下方修改</label>
        <textarea
          id="recognizedText"
          className="ocr-textarea"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
        <div>
          <button
            className="refine-button"
            onClick={handleRefineText}
            disabled={isLoading}
          >
            {isLoading ? "優化中..." : "使用 AI 優化文字"}
          </button>
        </div>
        {refinedResult && (
          <div className="refined-text-display">
            <h2>優化後的文字結果：</h2>
            <pre>{refinedResult}</pre>
            <button onClick={() => navigator.clipboard.writeText(refinedResult)}>複製文字</button>
          </div>
        )}
        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>處理中，請稍候...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default OcrResult;
