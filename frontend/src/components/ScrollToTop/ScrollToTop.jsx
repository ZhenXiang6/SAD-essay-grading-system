// 讓每次頁面更新的時候都可以捲動到最上方
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathName } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathName]);
  return null;
}

export default ScrollToTop;
