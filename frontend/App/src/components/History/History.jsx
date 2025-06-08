import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import "./History.css";

function History() {
  const [historyList, setHistoryList] = useState([]);
  const navigate = useNavigate();

  // 取得當前用戶 ID
  const getUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  };

  // 從 SCORES 與 ESSAYS 連接撈出分數與作文標題
  const fetchHistory = async () => {
    const userId = await getUserId();
    if (!userId) {
      alert("請先登入");
      navigate("/login");
      return;
    }

    // 用 Supabase 連接兩張表（ESSAYS 與 SCORES）一起撈
    // 這裡假設 ESSAYS.id = SCORES.essay_id
    const { data, error } = await supabase
      .from("SCORES")
      .select(
        `
        id,
        total_score,
        feedback_json,
        created_at,
        ESSAYS (
          title,
          id,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .is("ESSAYS.deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("撈取歷史紀錄失敗", error);
      alert("無法取得歷史紀錄");
      return;
    }

    setHistoryList(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (scoreId, essayId) => {
    if (!essayId) {
      alert("找不到對應的作文 ID，無法刪除");
      return;
    }

    const confirmDelete = window.confirm(
      "確定要刪除此評分紀錄？此動作無法還原。"
    );
    if (!confirmDelete) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("ESSAYS")
      .update({ deleted_at: now })
      .eq("id", essayId);

    if (error) {
      alert("刪除失敗，請稍後再試");
      console.error("刪除錯誤", error);
      return;
    }

    setHistoryList((prev) => prev.filter((item) => item.id !== scoreId));
  };

  return (
    <div className="history-wrapper">
      <h2 className="history-title">批改紀錄</h2>
      <p className="history-subtext">查看過往的評分！</p>

      {historyList.length === 0 ? (
        <p className="no-history">目前尚無紀錄。</p>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>標題</th>
                <th>上傳日期</th>
                <th>分數</th>
                <th>回饋</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item) => (
                <tr key={item.id}>
                  <td>{item.ESSAYS?.title || "Untitled Essay"}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>{item.total_score}</td>
                  <td>
                    <button
                      className="view-button"
                      onClick={() =>
                        navigate("/result", {
                          state: {
                            feedbackResult: item.feedback_json,
                            scoreId: item.id,
                          },
                        })
                      }
                    >
                      查看
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(item.id, item.ESSAYS?.id)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
