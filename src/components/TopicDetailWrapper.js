import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {doc, getDoc} from "firebase/firestore";
import TopicDetail from "./TopicDetail";

function TopicDetailWrapper() {
  const { maDe } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeThi = async () => {
      try {
        // 1️⃣ Ưu tiên load từ localStorage (GV vừa tạo, xem trước)
        const localDe = localStorage.getItem("KT_" + maDe);
        if (localDe) {
          setTopic(JSON.parse(localDe));
          setLoading(false);
          return;
        }

        // 2️⃣ Load từ Firestore (HS mở link làm bài)
        const ref = doc(db, "de_on_tap", maDe);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setTopic({
            maDe,
            ...snap.data(),
          });
        } else {
          setTopic(null);
        }
      } catch (err) {
        console.error("Lỗi load đề:", err);
        setTopic(null);
      } finally {
        setLoading(false);
      }
    };

    loadDeThi();
  }, [maDe]);

  // ⏳ Loading
  if (loading) {
    return <h3 style={{ textAlign: "center" }}>⏳ Đang tải đề...</h3>;
  }

  // ❌ Không tìm thấy đề
  if (!topic) {
    return (
      <h2 style={{ textAlign: "center", color: "red" }}>
        ❌ Không tìm thấy đề thi
      </h2>
    );
  }

  /*
    GẮN CỜ QUAN TRỌNG:
    - id = "DE_THI" → TopicDetail hiểu đây là đề thi thật
    - thoiGian (phút) → ExamTimer dùng
  */
  const topicForDetail = {
    ...topic,
    thoiGian: topic.thoiGian || 45, // fallback an toàn
  };

  return <TopicDetail topic={topicForDetail} maDe={maDe} />;
}

export default TopicDetailWrapper;
