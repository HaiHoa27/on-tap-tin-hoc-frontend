import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
function TopicList({ data }) {
  const navigate = useNavigate();
  const [expandedChuyenDe, setExpandedChuyenDe] = useState(null); // ✅ trạng thái

  // Nhóm theo chuyên đề
  const chuyenDeMap = {};

  data.forEach((topic) => {
    const chuyenDe = topic.chuyenDe || "Khác";
    if (!chuyenDeMap[chuyenDe]) {
      chuyenDeMap[chuyenDe] = [];
    }
    chuyenDeMap[chuyenDe].push(topic);
  });

  const toggleChuyenDe = (chuyenDe) => {
    setExpandedChuyenDe((prev) => (prev === chuyenDe ? null : chuyenDe));
  };

  return (
    <div className="topic-list">
      {Object.entries(chuyenDeMap).map(([chuyenDe, topics]) => (
        <div key={chuyenDe}>
          <h3
            className="chuyen-de-title"
            onClick={() => toggleChuyenDe(chuyenDe)}
            style={{ cursor: "pointer" }}
          >
            {expandedChuyenDe === chuyenDe ? "📂" : "📁"} {chuyenDe}
          </h3>

          {/* ✅ Nếu đang mở thì hiển thị danh sách topic */}
          {expandedChuyenDe === chuyenDe && (
            <div className="chuyen-de-group">
              {topics.map((topic, idx) => (
                <div
                  key={idx}
                  className="topic-item"
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  {topic.ten}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TopicList;
