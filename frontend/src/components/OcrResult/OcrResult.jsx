import "./OcrResult.css";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { rubricMap } from "../../data/rubricMap";
import { generatePrompt } from "../../utils/generatePrompt";
import { supabase } from "../../utils/supabaseClient";

function OcrResult() {
  const location = useLocation();
  const navigate = useNavigate();

  // 初始值來自 location.state 或 localStorage
  const initialOcrText = location.state?.ocrText || "";
  const initialPromptTitle = location.state?.promptTitle || "";
  const initialEssayId = location.state?.essayId || localStorage.getItem("currentEssayId") || null;
  const initialRubricId = location.state?.rubricId || localStorage.getItem("currentRubricId") || null;

  const [editedText, setEditedText] = useState("");
  const [promptTitle, setPromptTitle] = useState(initialPromptTitle);
  const [essayId, setEssayId] = useState(initialEssayId);
  const [rubricId, setRubricId] = useState(initialRubricId);
  const [isLoading, setIsLoading] = useState(false);

  // 為了讓頁面重新整理時可以自動從資料庫抓取 EASSAY.content 的內容
  useEffect(() => {
    const loadEssayContent = async () => {
      if (!essayId) return;

      const { data, error } = await supabase
        .from("ESSAYS")
        .select("content")
        .eq("id", essayId)
        .single();

      if (error || !data) {
        console.error("❌ 載入 content 失敗", error);
        return;
      }

      setEditedText(data.content || "");
    };

    loadEssayContent();
  }, [essayId]);

  // 讓更改的內容可以儲存到資料庫
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (essayId && editedText.trim()) {
        const { data, error } = await supabase
          .from("ESSAYS")
          .update({ content: editedText })
          .eq("id", essayId);

        if (error) {
          console.error("❌ 自動儲存失敗", error);
        } else {
          console.log("✅ 自動儲存成功", data);
        }
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [editedText]);

  useEffect(() => {
    if (essayId && rubricId) {
      localStorage.setItem("currentEssayId", essayId);
      localStorage.setItem("currentRubricId", rubricId);
    } else {
      alert("⚠️ 缺少必要資訊，請重新從上一頁操作");
      navigate("/upload");
    }
  }, [essayId, rubricId, navigate]);

  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  };

  const handleRefineText = async () => {
    if (!editedText.trim()) {
      alert("目前內容為空，無法改善！");
      return;
    }

    console.log("▶️ 發送給後端的文字內容:", editedText);

    setIsLoading(true);
    const API_URL = import.meta.env.VITE_API_URL;

    try {
      const res = await fetch(`${API_URL}/api/refine_ocr_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editedText }),
      });

      console.log("⬅️ HTTP狀態碼:", res.status);

      const data = await res.json();
      console.log("⬅️ 後端回傳資料:", data);

      if (!data || !data.refined_text) throw new Error("回傳內容錯誤！");

      const refined = data.refined_text;
      setEditedText(refined);

      const { error: updateError } = await supabase
        .from("ESSAYS")
        .update({ content: refined })
        .eq("id", essayId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error("改善 OCR 錯誤：", err);
      alert("❌ 改善失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!promptTitle || !essayId || !rubricId) {
      alert("缺少必要資料，無法儲存分數");
      return;
    }

    setIsLoading(true);

    try {
      const { data: essayData, error: fetchError } = await supabase
        .from("ESSAYS")
        .select("content")
        .eq("id", essayId)
        .single();

      if (fetchError || !essayData) throw new Error("找不到文章內容！");

      const finalContent = essayData.content;
      if (!finalContent || !finalContent.trim()) {
        alert("文章內容為空，請先輸入或改善文字");
        setIsLoading(false);
        return;
      }

      const rubric = rubricMap[promptTitle];
      if (!rubric) {
        alert(`⚠️ 題目「${promptTitle}」尚未定義評分標準`);
        setIsLoading(false);
        return;
      }

      const prompt = generatePrompt(promptTitle, rubric, finalContent);
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      const API_URL = import.meta.env.VITE_GEMINI_API_URL;
      const endpoint = `${API_URL}?key=${API_KEY}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini 回傳內容為空或格式錯誤！");

      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);

      const userId = await getUserId();
      if (!userId) {
        alert("請先登入！");
        setIsLoading(false);
        return;
      }

      const { data: insertedScore, error: insertError } = await supabase.from("SCORES").insert([
        {
          essay_id: essayId,
          user_id: userId,
          rubric_id: rubricId,
          total_score: String(parsed.total),
          feedback_json: parsed,
          grammar_analysis: parsed.grammar_analysis || null,
          vocabulary_usage: parsed.vocabulary_usage || null,
          structure_issues: parsed.structure_issues || null,
        },
      ])
      .select()
      .single();

      if (insertError) throw insertError;

      navigate("/result", {
        state: {
          feedbackResult: {
            ...parsed,
            text: finalContent,
            title: promptTitle,
            essayId,     // ✅ 傳入
            rubricId 
          },
          scoreId: insertedScore.id
        },
      });
    } catch (err) {
      console.error("[handleSubmit] 發生錯誤：", err);
      alert("❌ 評分失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ocr-result-page">
      <main className="ocr-content">
        <h1>OCR 辨識結果</h1>
        <label htmlFor="recognizedText">請確認內容是否正確，若有錯誤請於下方修改</label>
        <textarea
          id="recognizedText"
          className="ocr-textarea"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
        <div>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "評分中..." : "提交並評分"}
          </button>
          <button
            className="refine-button"
            onClick={handleRefineText}
            disabled={isLoading}
          >
            {isLoading ? "優化中..." : "改善辨識內容"}
          </button>
          {/* <button onClick={async () => {
            const { data, error } = await supabase
              .from("ESSAYS")
              .update({ content: editedText })
              .eq("id", essayId);

            if (error) {
              console.error("❌ 儲存失敗", error);
            } else {
              alert("✅ 儲存成功！");
              console.log(data);
            }
          }}>
            強制儲存測試
          </button> */}
        </div>
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