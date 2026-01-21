import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll tự động xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gửi tin nhắn chat
  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage = { id: Date.now(), role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("https://on-tap-tin-hoc-ai.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      let replyText = data.reply || "AI chưa trả lời";

      // ===== Xử lý xuống dòng + gạch đầu dòng =====
      replyText = replyText.replace(/\. /g, ".\n"); // xuống dòng sau mỗi câu
      replyText = replyText.replace(/- /g, "\n- "); // xuống dòng cho các item liệt kê

      const aiMessage = { id: Date.now() + 1, role: "assistant", content: replyText };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, role: "assistant", content: "Có lỗi, thử lại sau!" },
      ]);
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

  return (
    <div className="chatbot-wrapper">
      <h3>🤖 Trợ giảng Tin học</h3>

      <div className="chatbot-box">
        {/* Chat messages */}
        <div className="chatbot-messages">
          {messages.map(m => (
            <div key={m.id} className={m.role === "user" ? "msg user" : "msg ai"}>
              <b>{m.role === "user" ? "Bạn:" : "AI:"}</b>{" "}
              {m.content.split("\n").map((line, i) => (
                <p key={i} style={{ margin: "4px 0", paddingLeft: line.startsWith("- ") ? 10 : 0 }}>
                  {line}
                </p>
              ))}
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
          <button onClick={sendMessage} disabled={chatLoading}>
            {chatLoading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
