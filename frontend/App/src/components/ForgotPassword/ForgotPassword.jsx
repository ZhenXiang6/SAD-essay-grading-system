import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("請輸入電子郵件");
      return;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError("發送密碼重設信失敗，請稍後再試");
      console.error("忘記密碼錯誤:", error);
    } else {
      setMessage("已寄出密碼重設信，請至信箱查看");
    }
  };

  return (
    <div>
      <h2>忘記密碼</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="請輸入註冊電子郵件"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">送出</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default ForgotPassword;