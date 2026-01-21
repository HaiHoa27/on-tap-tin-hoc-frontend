import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [questionType, setQuestionType] = useState("mcq");
  const [count, setCount] = useState(5);

  // Scroll tự động xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, questions]);

  // Gửi tin nhắn chat
  const sendMessage = async () => {
    if (!input.trim() || chatLoading || genLoading) return;

    const userMessage = { id: Date.now(), role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setQuestions([]);
    setChatLoading(true);

    try {
      const res = await fetch("https://on-tap-tin-hoc-ai.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();
      const aiMessage = { id: Date.now() + 1, role: "assistant", content: data.reply || "AI chưa trả lời" };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 2, role: "assistant", content: "Có lỗi, thử lại sau!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Nhấn Enter để gửi
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Tạo câu hỏi MCQ + True/False
  const generateQuestions = async () => {
  if (count < 1) {
    alert("Vui lòng nhập số câu hỏi lớn hơn 0");
    return;
  }

  setQuestions([]);
  setGenLoading(true);

  try {
    const res = await fetch("https://on-tap-tin-hoc-ai.onrender.com/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: questionType,
        topic: input || "Tin học THPT",
        count: count,
      }),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const text = await res.text();
    console.log("RAW:", text);

    const data = JSON.parse(text);

    if (!data || data.length === 0) {
      alert("AI chưa tạo được câu hỏi, thử lại!");
      setGenLoading(false);
      return;
    }

    console.log("AI RETURN:", data);

    const questionArray = Array.isArray(data) ? data : [data];

    const normalized = questionArray.map((q) => {
      // ===== MCQ =====
      if (questionType === "mcq") {
        return {
          ...q,
          type: "mcq",
          question: q.question?.trim() || "",
          options: q.options || [],
          answer: q.answer || "",
        };
      }

      // ===== TRUE / FALSE =====
      if (questionType === "tf") {
        let qText = (q.question || "").trim().replace(/^Câu\s*\d+:\s*/i, "");
        let ans = (q.answer || "").trim();

        // bỏ dấu ?
        if (qText.endsWith("?")) {
          qText = qText.slice(0, -1);
        }

        if (!qText.endsWith(".")) qText += ".";

        if (!["Đúng", "Sai"].includes(ans)) {
          ans = Math.random() > 0.5 ? "Đúng" : "Sai";
        }

        return {
          ...q,
          type: "tf",
          question: qText,
          answer: ans,
        };
      }

      return q;
    });

    setQuestions(normalized.slice(0, count));
  } catch (err) {
    console.error("GEN ERROR:", err);
    alert("Lỗi khi tạo câu hỏi!");
  } finally {
    setGenLoading(false);
  }
};

  return (
    <div className="chatbot-wrapper">
      <h3>🤖 Trợ giảng Tin học</h3>

      <div className="chatbot-box">
        {/* Chat messages */}
        <div className="chatbot-messages">
          {messages.map(m => (
            <div key={m.id} className={m.role === "user" ? "msg user" : "msg ai"}>
              <b>{m.role === "user" ? "Bạn:" : "AI:"}</b> {m.content}
            </div>
          ))}
          {chatLoading && <div className="msg ai">AI đang trả lời...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input + button */}
        <div className="chatbot-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi trợ giảng Tin học..."
          />
          <button onClick={sendMessage} disabled={chatLoading || genLoading}>
            {chatLoading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, justifyContent: "center" }}>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="mcq">Trắc nghiệm</option>
            <option value="tf">Đúng / Sai</option>
          </select>

          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value || 1))}
            style={{ width: 60 }}
          />
        </div>

        {/* Button tạo câu hỏi */}
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button onClick={generateQuestions} disabled={genLoading || chatLoading}>
            {genLoading ? "Đang tạo..." : "Tạo câu hỏi cho HS"}
          </button>
        </div>

        {/* Hiển thị câu hỏi AI tạo */}
        <div className="questions-wrapper">
          {questions.map((q, idx) => (
            <div key={idx} className="question-box">
              <p><b>Câu {idx + 1}:</b> {q.question}</p>

              {q.type === "mcq" && (
                <>
                  {q.options && q.options.length > 0 ? (
                    <ul>{q.options.map((opt, i) => <li key={i}>{opt}</li>)}</ul>
                  ) : (
                    <p>(Chưa có lựa chọn, vui lòng kiểm tra backend)</p>
                  )}
                </>
              )}
              {q.type === "tf" && questionType === "tf" && (
                <p>Đáp án: {q.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
