import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
  const [inputMode, setInputMode] = useState("image");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      alert("請上傳圖片檔案（JPG/PNG）");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("尚未選擇圖片！");
      console.error("沒有選擇檔案就點擊上傳");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    // API_URL 應該由 Nginx 處理，所以這裡直接使用相對路徑
    const API_ENDPOINT = "/api/upload_segment_ocr"; 

    try {
      console.log("開始呼叫 API：", API_ENDPOINT);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      console.log("API 回應狀態：", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API 非正常回應，內容：", errorText);
        throw new Error("後端回應錯誤");
      }

      const result = await response.json();
      console.log("API 回傳結果：", result);

      // 導頁並帶入辨識結果
      navigate("/ocr", {
        state: {
          ocrText: result.result_text,
        },
      });
    } catch (error) {
      console.error("圖片上傳失敗：", error);
      alert("圖片上傳失敗或後端錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      alert("請輸入文字！");
      return;
    }

    // 直接導頁並帶入文字結果，不經過 OCR API
    navigate("/ocr", {
      state: {
        ocrText: inputText,
      },
    });
  };

  return (
    <div className="welcome-wrapper">
      <main className="welcome-content">
        <h1>AI 作文文字化與優化</h1>
        <p className="subtext">您可以選擇上傳作文圖片進行 OCR 識別，或直接輸入文字進行優化。</p>

        <div className="input-mode-selector">
          <label>
            <input
              type="radio"
              value="image"
              checked={inputMode === "image"}
              onChange={() => setInputMode("image")}
            />
            上傳圖片 (OCR 識別)
          </label>
          <label>
            <input
              type="radio"
              value="text"
              checked={inputMode === "text"}
              onChange={() => setInputMode("text")}
            />
            直接輸入文字 (文字優化)
          </label>
        </div>

        {inputMode === "image" && (
          <>
            <div className="upload-box">
              <label htmlFor="upload-input" className="upload-browse">
                點擊選擇圖片
                <input
                  type="file"
                  id="upload-input"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </label>

              {previewUrl && (
                <div className="preview-container">
                  <img src={previewUrl} alt="預覽圖" className="preview-image" />
                </div>
              )}
            </div>
            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading ? "辨識中..." : "上傳並辨識"}
            </button>
          </>
        )}

        {inputMode === "text" && (
          <>
            <textarea
              className="text-input"
              placeholder="請輸入或貼上您的作文內容，將會進行文字優化..."
              rows={10}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="upload-button"
              onClick={handleTextSubmit}
              disabled={isLoading}
            >
              送出文字
            </button>
          </>
        )}

        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>處理中...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Welcome;
