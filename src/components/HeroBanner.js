import React from "react";
import "./HeroBanner.css"; // nếu muốn tách style riêng

export default function HeroBanner() {
  return (
    <div className="hello-banner">
      <h2>✨ ÔN TẬP TIN HỌC – NHANH, GỌN, HIỆU QUẢ ✨</h2>
      <ul>
        <li>📌 12 chủ đề bám sát chương trình Tin học THPT 2018, với lý thuyết cô đọng & bài tập trắc nghiệm phong phú.</li>
        <li>📌 Nhiều đề thi mẫu theo cấu trúc của Bộ GD&ĐT.</li>
      </ul>
      <p>
        📝Giúp học sinh tự ôn luyện, đánh giá năng lực và tự tin bước vào kỳ thi Tốt nghiệp THPT.
      </p>
      <p>📱 Học sinh học được trên điện thoại thông minh, máy tính bảng hoặc máy tính.</p>
    </div>
  );
}
