import "./FeedbackResult.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

function FeedbackResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // 從 location.state 取得 scoreId
  const scoreId = location.state?.scoreId;

  function getGradeFromScore(score) {
    const s = Number(score);
    if (s >= 22) return "A+";
    if (s >= 18) return "A";
    if (s >= 14) return "B+";
    if (s >= 10) return "B";
    if (s >= 6) return "C+";
    if (s >= 1) return "C";
    return "0";
  }


  useEffect(() => {
    const fetchScore = async () => {
      if (!scoreId) {
        alert("未提供評分 ID");
        navigate("/history");
        return;
      }

      // 取得當前 user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("請先登入");
        navigate("/login");
        return;
      }

      // 根據 scoreId 與 userId 查詢 SCORES + ESSAYS 資料
      const { data, error } = await supabase
        .from("SCORES")
        .select(
          `
          id,
          total_score,
          feedback_json,
          created_at,
          grammar_analysis,
          vocabulary_usage,
          structure_issues,
          ESSAYS (
            title,
            content
          )
        `
        )
        .eq("id", scoreId)
        .eq("user_id", user.id)
        .single(); // 只查一筆

      if (error || !data) {
        alert("查無此評分紀錄");
        navigate("/history");
        return;
      }

      setScore(data);
      setLoading(false);
    };

    fetchScore();
  }, [scoreId, navigate]);

  if (loading) {
    return <div>載入中...</div>;
  }

  if (!score) {
    return <div>找不到該筆評分紀錄。</div>;
  }

  const feedback = score.feedback_json;

  return (
    <div className="feedback-wrapper" style={{ marginBottom: "2rem" }}>
      <h2>批改結果</h2>
      <p className="subtitle">
        標題： <strong>{score.ESSAYS?.title || "未命名主題"}</strong>
      </p>

      <section className="overall-score">
        <div className="score-box">
          總分：<strong>{score.total_score}</strong> （等第：{getGradeFromScore(score.total_score)}）
        </div>
      </section>

      <section className="detailed-feedback">
        <h3>詳細回饋</h3>
        {feedback?.parts?.map((part, index) => (
          <div key={index} className="feedback-part">
            <h4>{part.part}</h4>
            <p>
              <strong>等第：</strong>
              {part.grade}　<strong>分數：</strong>
              {part.score}
            </p>
            <p className="feedback-reason">{part.reason}</p>
          </div>
        ))}
      </section>

      <section className="summary">
        <h3>Feedback Summary</h3>
        <p>{feedback?.summary}</p>
      </section>

      {/* 詳細回饋結束後，新增這個 */}
      <section className="additional-scores">
        <h3>文法分析</h3>
        <p className="score-box">
          分數：<strong>{(score.grammar_analysis?.score ?? "待定") + "/10"}</strong><br />
          建議：{score.grammar_analysis?.comment ?? "無建議"}
        </p>

        <h3>詞彙使用</h3>
        <p className="score-box">
          分數：<strong>{(score.vocabulary_usage?.score ?? "待定") + "/10"}</strong><br />
          建議：{score.vocabulary_usage?.comment ?? "無建議"}
        </p>

        <h3>結構問題</h3>
        <p className="score-box">
          分數：<strong>{(score.structure_issues?.score ?? "待定") + "/10"}</strong><br />
          建議：{score.structure_issues?.comment ?? "無建議"}
        </p>
      </section>

      <section className="original-essay">
        <h3>原始文章</h3>
        <textarea
          className="essay-textarea"
          value={score.ESSAYS?.content || "（無原始內容）"}
          readOnly
        />
      </section>

      <section className="RAG-Chatbox">
        <h3>國寫作文小家教</h3>
        <a
          href="http://localhost:8501" // 這邊改連結
          target="_blank" // 開新分頁
          rel="noopener noreferrer" // noopener:防止新頁面可以控制你的網頁（提升安全性）、noreferrer:防止目標網站看到你的來源網址（隱私考量）
        >
          {score.feedback_json?.reference_text || "點此與作文小家教互動"}
        </a>
      </section>

      <section className="reference-link">
        <h3>參考資料</h3>
        <a
          href="https://flipedu.parenting.com.tw/article/003531" // 這邊改連結
          target="_blank" // 開新分頁
          rel="noopener noreferrer" // noopener:防止新頁面可以控制你的網頁（提升安全性）、noreferrer:防止目標網站看到你的來源網址（隱私考量）
        >
          {score.feedback_json?.reference_text || "點此查看參考資料"}
        </a>
      </section>
    </div>
  );
}

export default FeedbackResult;
