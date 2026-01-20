import React, { useEffect, useState } from "react";

function ExamTimer({ duration, onTimeUp }) {
  const safeDuration =
  typeof duration === "number" && !isNaN(duration) && duration > 0
    ? duration
    : 0;

const [timeLeft, setTimeLeft] = useState(safeDuration);


  // ✅ RESET khi duration thay đổi
  useEffect(() => {
    if (typeof duration === "number" && !isNaN(duration)) {
      setTimeLeft(duration);
    }
  }, [duration]);


  useEffect(() => {
    if (typeof timeLeft !== "number") return;

    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  if (typeof timeLeft !== "number") return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div
      style={{
        background: "#1e203bff",
        color: "white",
        padding: "8px 15px",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: "8px", // cách ra nút Lên đầu trang
      }}
    >
      ⏰ {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
    </div>
  );
}

export default ExamTimer;
