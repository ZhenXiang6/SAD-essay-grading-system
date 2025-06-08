// App.jsx - 使用 React Router 管理頁面
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Welcome from "./components/Welcome/Welcome";
import OcrResult from "./components/OcrResult/OcrResult";
import Layout from "./components/Layout/Layout";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/ocr" element={<OcrResultWrapper />} />
      {/* 其他不需要認證的公共路由可以在這裡添加 */}
    </Routes>
  );
}

function OcrResultWrapper() {
  const location = useLocation();
  const ocrText = location.state?.ocrText || "";

  return (
    <OcrResult
      ocrText={ocrText}
    />
  );
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
