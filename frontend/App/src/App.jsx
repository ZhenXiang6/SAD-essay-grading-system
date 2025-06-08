// App.jsx - 使用 React Router 管理頁面
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Welcome from "./components/Welcome/Welcome";
import OcrResult from "./components/OcrResult/OcrResult";
import FeedbackResult from "./components/FeedbackResult/FeedbackResult";
import Layout from "./components/Layout/Layout";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import History from "./components/History/History";
import Profile from "./components/Profile/Profile";
import Login from "./components/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ocr"
        element={
          <ProtectedRoute>
            <OcrResultWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result"
        element={
          <ProtectedRoute>
            <FeedbackResultWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

function OcrResultWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const ocrText = location.state?.ocrText || "";

  return (
    <OcrResult
      ocrText={ocrText}
      onGradingComplete={(result) => {
        console.log("[Router] 切換到 FeedbackResult 頁面");
        navigate("/result", { state: { feedbackResult: result } });
      }}
    />
  );
}

function FeedbackResultWrapper() {
  const location = useLocation();
  const result = location.state?.feedbackResult;
  return <FeedbackResult result={result} />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
}

export default App;
