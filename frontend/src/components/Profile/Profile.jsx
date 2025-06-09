import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        navigate("/login");
        return;
      }
      setUser(authData.user);

      // 從 USER 資料表抓資料
      const { data: userData, error } = await supabase
        .from("USER")
        .select("username, created_at")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        console.error("讀取 USER 資料錯誤", error);
      } else {
        setUsername(userData.username || "");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    // 更新 USER 表 username
    const { error: updateError } = await supabase
      .from("USER")
      .update({ username })
      .eq("id", user.id);

    if (updateError) {
      alert("更新暱稱失敗");
      console.error("更新 username 失敗", updateError);
      return;
    }

    // 若密碼有輸入，更新 Supabase Auth 密碼
    if (password.trim()) {
      const { error: passError } = await supabase.auth.updateUser({
        password,
      });

      if (passError) {
        alert("更新密碼失敗：" + passError.message);
        console.error("更新密碼錯誤", passError);
        return;
      }
    }

    alert("資料更新成功！");
    setPassword("");
  };

  if (!user) return <div>載入中...</div>;

  return (
    <div className="profile-container">
      <h2>使用者資料</h2>

      <p><strong>帳號：</strong> {user.email}</p>
      <p><strong>註冊時間：</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : "未知"}</p>

      <label>暱稱：</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="輸入暱稱"
      />

      <label>密碼（不填則不修改）：</label>
      <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="輸入新密碼"
        />
        <span
          onClick={() => setShowPassword(!showPassword)}
          className="toggle-icon"
          style={{ cursor: "pointer" }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </span>
      </div>

      <button onClick={handleUpdateProfile}>更新資料</button>
    </div>
  );
}

export default Profile;