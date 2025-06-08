import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import "./Layout.css";

function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    // 監聽登入狀態變化
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm("確定要登出嗎？");
    if (!confirmed) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("登出失敗，請稍後再試");
      return;
    }
    navigate("/login");
  };

  return (
    <div className="layout-wrapper">
      <header className="ocr-navbar">
        <div className="ocr-logo">
          <Link to="/welcome" className="ocr-logo-link">
            作文批改
          </Link>
        </div>
        <nav>
          {user && (
            <>
              <Link to="/welcome">首頁</Link>
              <Link to="/history">歷史紀錄</Link>
            </>
          )}

          {user ? (
            <>
              <Link to="/profile" className="profile-link">
                <img
                  src="/avatar.png"
                  alt="User avatar"
                  className="profile-avatar"
                />
              </Link>
              <button className="logout-button" onClick={handleLogout}>
                登出
              </button>
            </>
          ) : (
            <Link to="/login">登入</Link>
          )}
        </nav>
      </header>

      <main className="layout-content">{children}</main>
      {/* <footer className="footer">
        <div className="footer-container">
          <a
            href="https://forms.gle/6Ti7nYmHgnCePhhF7"
            target="_blank"
            rel="noopener noreferrer"
            className="feedback-link"
          >
            意見回饋表單
          </a>
        </div>
      </footer> */}
    </div>
  );
}

export default Layout;