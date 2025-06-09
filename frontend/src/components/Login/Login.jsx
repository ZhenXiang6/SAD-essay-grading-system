import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import "./Login.css";

function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (
      !trimmedEmail ||
      !trimmedPassword ||
      (mode === "register" && !trimmedName)
    ) {
      triggerError("請完整填寫所有欄位。");
      console.error("表單驗證錯誤：請完整填寫所有欄位。");
      return;
    }

    if (mode === "register" && trimmedPassword.length < 6) {
      triggerError("密碼長度至少要6個字元。");
      console.error("表單驗證錯誤：密碼長度不足6個字元。");
      return;
    }

    console.log("送出 email：", `"${trimmedEmail}"`);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        let msg = "登入失敗，請稍後再試。";
        if (error.message.includes("Invalid login credentials")) {
          msg = "帳號或密碼錯誤，請重新輸入。";
        } else if (error.message.includes("User not found")) {
          msg = "查無此帳號，請先註冊。";
        }
        triggerError(msg);
        console.error("登入錯誤：", error);
        return;
      }

      // 登入成功
      console.log("登入成功，使用者資訊：", data.user);
      navigate("/welcome");
    } else {
      // 註冊 Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        let msg = "註冊失敗，請稍後再試。";
        if (error.message.includes("duplicate key")) {
          msg = "此電子郵件已被註冊，請直接登入。";
        }
        triggerError(msg);
        console.error("註冊錯誤：", error);
        return;
      }

      // 註冊成功後，把額外資料寫入 USER 資料表
      const { data: userData, error: userError } = await supabase
        .from("USER")
        .insert([
          {
            id: data.user.id,       // Supabase Auth 自動產生的 user id
            email: trimmedEmail,
            username: trimmedName, // USER 表的名稱欄位
          },
        ]);

      if (userError) {
        triggerError("使用者資料寫入失敗，請稍後再試。");
        console.error("USER 表寫入錯誤：", userError);
        return;
      }

      alert("註冊成功，請至信箱驗證帳號。");
      setMode("login");
    }
  };

  return (
    <div className="auth-container">
      <h2>{mode === "login" ? "歡迎回來" : "建立帳戶"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="電子郵件地址"
          className={`auth-input ${errorMessage ? "input-error" : ""}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === "register" && (
          <input
            type="text"
            placeholder="您的名稱"
            className={`auth-input ${errorMessage ? "input-error" : ""}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          type="password"
          placeholder="密碼"
          className={`auth-input ${errorMessage ? "input-error" : ""}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <button type="submit" className="auth-button">
          繼續
        </button>
      </form>

      <p className="switch-mode">
        {mode === "login" ? (
          <>
            還沒有帳戶嗎？
            <span onClick={() => setMode("register")} className="link">
              註冊
            </span>
          </>
        ) : (
          <>
            已經有帳戶了？
            <span onClick={() => setMode("login")} className="link">
              登入
            </span>
          </>
        )}
      </p>
    </div>
  );
}

export default Login;