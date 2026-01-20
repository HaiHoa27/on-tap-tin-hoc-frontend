import React, { useEffect, useState } from "react";

const BackToTopButton = ({ theme }) => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    const scrolled = window.scrollY;
    setVisible(scrolled > 200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  // Đổi màu theo theme
  const isDark = theme === "dark";
  const background = isDark
    ? "linear-gradient(135deg, #444, #000)" // Tối
    : "linear-gradient(135deg, #00c6ff, #0072ff)"; // Sáng

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: "fixed",
        bottom: "80px",
        right: "30px",
        display: visible ? "inline-flex" : "none",
        alignItems: "center",
        gap: "8px",
        padding: "10px 18px",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#fff",
        background: background,
        border: "none",
        borderRadius: "30px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        cursor: "pointer",
        zIndex: 1000,
        transition: "all 0.3s ease"
      }}
      title="Lên đầu trang"
    >
      ⬆️ Lên đầu trang
    </button>
  );
};

export default BackToTopButton;
