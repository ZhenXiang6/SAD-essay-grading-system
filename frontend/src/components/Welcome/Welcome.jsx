import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import "./Welcome.css";

function Welcome() {
  const [inputMode, setInputMode] = useState("image");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [inputText, setInputText] = useState("");
  const [selectedRubricId, setSelectedRubricId] = useState(""); // 選擇的 rubric ID
  const [rubrics, setRubrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 載入所有 rubric，給下拉選單用
  useEffect(() => {
    const fetchRubrics = async () => {
      const { data, error } = await supabase
        .from("RUBRICS")
        .select("id, title, name")
        .order("name", { ascending: true });

      if (error) {
        alert("無法取得題目清單");
        console.error(error);
        return;
      }
      setRubrics(data);
    };
    fetchRubrics();
  }, []);

  // 取得登入者 user id
  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  };

  // 儲存作文資料到 ESSAYS，回傳 essay id
  const saveEssayToDb = async (
    userId,
    rubricId,
    content,
    ocrRawText = "",
    imagePath = ""
  ) => {
    const rubric = rubrics.find((r) => r.id === rubricId);
    if (!rubric) {
      alert("無效的題目");
      return null;
    }

    const { data, error } = await supabase
      .from("ESSAYS")
      .insert([
        {
          user_id: userId,
          title: rubric.title,
          content,
          ocr_raw_text: ocrRawText,
          image_path: imagePath,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("儲存作文失敗：", error);
      alert("儲存作文失敗，請稍後再試");
      return null;
    }
    return data.id;
  };

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
    if (!selectedRubricId) {
      alert("請先選擇一個作文題目！");
      console.error("沒有選擇作文題目就點擊上傳");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      console.log("開始呼叫 API：", `${API_URL}/api/upload_segment_ocr`);

      const response = await fetch(`${API_URL}/api/upload_segment_ocr`, {
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

      const userId = await getUserId();
      if (!userId) {
        alert("請先登入！");
        console.error("尚未登入，無法儲存作文");
        setIsLoading(false);
        return;
      }

      const essayId = await saveEssayToDb(
        userId,
        selectedRubricId,
        result.result_text, // 確認使用正確欄位
        result.result_text,
        ""
      );

      if (!essayId) {
        console.error("儲存作文失敗，essayId 不存在");
        setIsLoading(false);
        return;
      }

      console.log("儲存作文成功，essayId：", essayId);

      // 導頁並帶入辨識結果與其他狀態
      navigate("/ocr", {
        state: {
          ocrText: result.result_text,
          promptTitle: rubrics.find((r) => r.id === selectedRubricId)?.title || "",
          essayId,
          rubricId: selectedRubricId,
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
    if (!selectedRubricId) {
      alert("請先選擇一個作文題目！");
      return;
    }

    const userId = await getUserId();
    if (!userId) {
      alert("請先登入！");
      return;
    }

    const essayId = await saveEssayToDb(userId, selectedRubricId, inputText, "", "");
    if (!essayId) return;

    navigate("/ocr", {
      state: {
        ocrText: inputText,
        promptTitle: rubrics.find((r) => r.id === selectedRubricId)?.title || "",
        essayId,
        rubricId: selectedRubricId,
      },
    });
  };

  return (
    <div className="welcome-wrapper">
      <main className="welcome-content">
        <h1>上傳您的學測國文作文</h1>
        <p className="subtext">您可以選擇上傳圖片或直接輸入文字。</p>

        <div className="prompt-select">
          <label htmlFor="prompt">請先選擇作文題目：</label>
          <select
            id="prompt"
            value={selectedRubricId}
            onChange={(e) => setSelectedRubricId(e.target.value)}
          >
            <option value="">-- 請選擇題目 --</option>
            {rubrics.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name ? `${r.name} - ${r.title}` : r.title}
              </option>
            ))}
          </select>
        </div>

        <div className="input-mode-selector">
          <label>
            <input
              type="radio"
              value="image"
              checked={inputMode === "image"}
              onChange={() => setInputMode("image")}
            />
            上傳圖片
          </label>
          <label>
            <input
              type="radio"
              value="text"
              checked={inputMode === "text"}
              onChange={() => setInputMode("text")}
            />
            直接輸入文字
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
              placeholder="請輸入或貼上您的國文作文..."
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