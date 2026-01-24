import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import BackToTopButton from "./BackToTopButton";
import ExamTimer from "./ExamTimer";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function TopicDetail({topic}) {
  // ✅ HOOKS LUÔN Ở ĐẦU
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [subAnswers, setSubAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [answerResults, setAnswerResults] = useState({});
  const [startTime] = useState(Date.now());
  const [aiLoadingMap, setAiLoadingMap] = useState({});
  const [aiExplainMap, setAiExplainMap] = useState({});
  const isDeThiCoDinh = topic?.id === "DE_THI";
  const isGVDe = topic?.id?.startsWith("KT_");
  const isDeThi = isDeThiCoDinh || isGVDe;
  const isOnTap = !isDeThi;

  // ================= RANDOM + GIỮ THỨ TỰ GIỐNG QUIZIZZ =================
useEffect(() => {
  if (!topic) return;

  const loadQuestions = async () => {
    try {
      setLoading(true);

      const maDe = topic.id || topic.maDe;
      const isKT = maDe && maDe.startsWith("KT_");

      console.log("👉 maDe:", maDe, "isKT:", isKT);

      let rawQuestions = [];

      // ===== LOAD DATA =====
      if (isKT) {
        const deRef = doc(db, "de_on_tap", maDe);
        const deSnap = await getDoc(deRef);

        if (!deSnap.exists()) {
          console.log("❌ Không tồn tại đề:", maDe);
          setQuestions([]);
          setLoading(false);
          return;
        }

        const deData = deSnap.data();

        // 🔥 FIX QUAN TRỌNG
        if (Array.isArray(deData.cauHoi)) {
          rawQuestions = deData.cauHoi;
        } else if (typeof deData.cauHoi === "object") {
          rawQuestions = Object.values(deData.cauHoi);
        } else {
          rawQuestions = [];
        }

      } else {
        rawQuestions = topic.cauHoi || topic.questions || [];
      }

      console.log("👉 rawQuestions:", rawQuestions);

      if (!rawQuestions.length) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // ===== RANDOM CHỈ CHO KT_ =====
      let finalQuestions = rawQuestions;

      // ❌ KHÔNG TRỘN OPTIONS LẠI NỮA
      if (isKT) {
        finalQuestions = shuffleArray(rawQuestions);
      }


      setQuestions(finalQuestions);
      setLoading(false);

    } catch (err) {
      console.error("🔥 Lỗi loadQuestions:", err);
      setQuestions([]);
      setLoading(false);
    }
  };

  loadQuestions();
}, [topic]);

// ====================================================================


  // ==== Các hàm xử lý đáp án và nộp bài ====
  const handleAnswer = (index, value) => {
    setSelectedAnswers({ ...selectedAnswers, [index]: value });
  };

  const handleSubAnswer = (qIdx, subIdx, value) => {
    setSubAnswers((prev) => ({ ...prev, [`${qIdx}-${subIdx}`]: value }));
  };
  
  // ==== NỘP BÀI ÔN TẬP ====
  const handleSubmitOnTap = async () => {
    if (!questions.length) return;
    let tongCau = 0;
    let dung = 0;
    const saiChiTiet = [];
    const perQuestion = {};

    questions.forEach((q, qIdx) => {
      if (q.subQuestions) {
        q.subQuestions.forEach((sq, subIdx) => {
          const key = `${qIdx}-${subIdx}`;
          tongCau++;

          const isCorrect = subAnswers[key] === sq.answer;

          // ✅ GHI KẾT QUẢ TỪNG Ý
          perQuestion[key] = {
            correct: isCorrect,
            correctAnswer: sq.answer,
          };

          if (isCorrect) {
            dung++;
          } else {
            saiChiTiet.push(
              `❌ Câu ${qIdx + 1}${sq.label}: bạn chọn "${
                subAnswers[key] || "Không chọn"
              }", đúng là "${sq.answer}"`
            );
          }
        });
      } else {
        tongCau++;

        const isCorrect = selectedAnswers[qIdx] === q.answer;

        // ✅ GHI KẾT QUẢ TỪNG CÂU
        perQuestion[qIdx] = {
          correct: isCorrect,
          correctAnswer: q.answer,
        };

        if (isCorrect) {
          dung++;
        } else {
          saiChiTiet.push(
            `❌ Câu ${qIdx + 1}: bạn chọn "${
              selectedAnswers[qIdx] || "Không chọn"
            }", đúng là "${q.answer}"`
          );
        }
      }
    });

    const diem = Math.round((dung / tongCau) * 10 * 100) / 100;

    // ✅ GIỮ NGUYÊN CÁCH HIỂN THỊ
    setAnswerResults(perQuestion);
    setSubmitted(true);

    Swal.fire({
      icon: "info",
      title: "📘 Kết quả ôn tập",
      html: `
        ✅ Đúng: <strong>${dung}/${tongCau}</strong> câu.<br>
        🎓 Điểm: <strong>${diem}</strong>/10
        ${
          saiChiTiet.length > 0
            ? `<hr><strong>Câu sai:</strong><ul style="text-align:left;">${saiChiTiet
                .map((s) => `<li>${s}</li>`)
                .join("")}</ul>`
            : "<p style='color:green;'>🎉 Bạn đã làm đúng tất cả!</p>"
        }
      `,
      confirmButtonText: "👍 Tiếp tục",
    });
  };

  // ==== NỘP BÀI ĐỀ THI ====
  const handleSubmitDeThi = async () => {
  if (!questions.length) return;
  
  const tuChonCau = {
    khtn: [26, 27],
    tinhoc: [28, 29],
  };

  const isAnswered = (qIdx, question) => {
    if (!question) return false;
    if (question.subQuestions) {
      return question.subQuestions.some(
        (_, subIdx) => subAnswers[`${qIdx}-${subIdx}`] !== undefined
      );
    }
    return selectedAnswers[qIdx] !== undefined;
  };

  const lamKHTN = tuChonCau.khtn.some(
    (i) => questions[i] && isAnswered(i, questions[i])
  );
  const lamTinHoc = tuChonCau.tinhoc.some(
    (i) => questions[i] && isAnswered(i, questions[i])
  );
  const lamCaHaiTuChon = lamKHTN && lamTinHoc;

  let tongDiem = 0;
  let dung = 0;
  let tongCau = 0;

  const saiChiTiet = [];
  const perQuestion = {};

  questions.forEach((q, qIdx) => {
    const isTuChon =
      !isGVDe &&
      (tuChonCau.khtn.includes(qIdx) || tuChonCau.tinhoc.includes(qIdx));

    if (!isGVDe && isTuChon && lamCaHaiTuChon) return;

    if (!q.subQuestions) {
      tongCau++;

      const isCorrect = selectedAnswers[qIdx] === q.answer;

      perQuestion[qIdx] = {
        correct: isCorrect,
        correctAnswer: q.answer,
      };

      if (isCorrect) {
        dung++;
        if (!isGVDe) tongDiem += 0.25;
      } else {
        saiChiTiet.push(
          `❌ Câu ${qIdx + 1}: bạn chọn "${
            selectedAnswers[qIdx] || "Không chọn"
          }", đúng là "${q.answer}"`
        );
      }
    } else {
      let count = 0;

      q.subQuestions.forEach((sq, subIdx) => {
        tongCau++;

        const key = `${qIdx}-${subIdx}`;
        const isCorrect = subAnswers[key] === sq.answer;

        perQuestion[key] = {
          correct: isCorrect,
          correctAnswer: sq.answer,
        };

        if (isCorrect) {
          dung++;
          count++;
        } else {
          saiChiTiet.push(
            `❌ Câu ${qIdx + 1}${sq.label}: bạn chọn "${
              subAnswers[key] || "Không chọn"
            }", đúng là "${sq.answer}"`
          );
        }
      });

      if (!isGVDe) {
        if (count === 1) tongDiem += 0.1;
        else if (count === 2) tongDiem += 0.25;
        else if (count === 3) tongDiem += 0.5;
        else if (count === 4) tongDiem += 1;
      }
    }
  });

  let diem;
  if (isGVDe) {
    diem = Math.round((dung / tongCau) * 10 * 100) / 100;
  } else {
    diem = Math.round(tongDiem * 100) / 100;
  }

  setAnswerResults(perQuestion);
  setSubmitted(true);

  const user = auth.currentUser;

  if (user) {
    await addDoc(collection(db, "ket_qua_lam_bai"), {
      uid: user.uid,
      hoTen: user.displayName || user.email || "Không tên",
      maDe: topic.maDe || topic.id,
      diem,
      dung,
      tong: tongCau,
      thoiGianLam: Math.floor((Date.now() - startTime) / 1000),
      thoiDiemNop: serverTimestamp(),
    });
  }

  Swal.fire({
    icon: "info",
    title: "🎯 Kết quả làm bài",
    html: `
      🎓 Điểm: <strong>${diem}</strong>/10
      ${
        !isGVDe && lamCaHaiTuChon
          ? "<hr><em style='color:red;'>⚠️ Bạn đã làm cả hai phần tự chọn (câu 27–30), nên không được tính điểm các câu này.</em>"
          : ""
      }
      ${
        saiChiTiet.length > 0
          ? `<hr><strong>Câu sai:</strong><ul style="text-align:left;">${saiChiTiet
              .map((s) => `<li>${s}</li>`)
              .join("")}</ul>`
          : "<p style='color:green;'>🎉 Bạn đã làm đúng tất cả!</p>"
      }
    `,
    confirmButtonText: "👍 Tiếp tục",
  });
};


  const handleTimeUp = () => {
    Swal.fire({
      title: "⏰ Hết giờ!",
      text: "Hệ thống sẽ tự động nộp bài của bạn.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      if (isDeThi) handleSubmitDeThi();
      else handleSubmitOnTap();
    });
  };

  const goiAI = async (keyId, cauHoi, options, correctAnswer, userAnswer) => {
  if (aiExplainMap[keyId]) return;
  setAiLoadingMap(prev => ({ ...prev, [keyId]: true }));

  try {
    const res = await fetch("https://on-tap-tin-hoc-ai.onrender.com/giai-thich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: cauHoi,
        options,
        correctAnswer,
        userAnswer,
      }),
    });

    const data = await res.json();

    setAiExplainMap(prev => ({ ...prev, [keyId]: data.text }));

  } catch (err) {
    alert("Lỗi gọi AI");
  }

  setAiLoadingMap(prev => ({ ...prev, [keyId]: false }));
};


  if (loading) {
    return <p style={{ textAlign: "center" }}>⏳ Đang trộn đề...</p>;
  }
  return (
    <>      
      <div>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          📝 {topic.ten || "Đề luyện tập"}
        </h2>


        <div className="theory-box">
          <h3>{isDeThi ? "📌 Lưu ý trước khi làm bài:" : "📘 Nội dung:"}</h3>          
          {!isGVDe && Array.isArray(topic.noiDung) && (
            <ul>
              {topic.noiDung.map((nd, i) => (
                <li key={i} style={{ whiteSpace: "pre-wrap", marginBottom: "8px" }}>
                  {nd}
                </li>
              ))}
            </ul>
          )}
        </div>

        {Array.isArray(questions) && questions.length > 0 ? (
          <div>
            <h3 style={{ marginTop: "20px" }}>📝 Câu hỏi</h3>
            {isDeThiCoDinh && (
              <div
                style={{
                      marginTop: "20px",
                      marginBottom: "15px",
                      padding: "10px",
                      backgroundColor: "#fff7e6",
                      borderLeft: "5px solid #ff9800",
                    }}
              >
                <strong>Phần I. Trắc nghiệm nhiều lựa chọn (6 điểm):</strong>
                <br />
                Thí sinh trả lời từ câu 1 đến câu 24. Mỗi câu hỏi thí sinh chỉ chọn một đáp án duy nhất tương ứng với A, B, C, D trong đề thi của mỗi câu hỏi tương ứng.
              </div>
            )}
            {(questions || []).map((q, idx) => (
              <React.Fragment key={idx}>
                {/* ✅ Thêm phần II - A. Phần chung */}
                {isDeThiCoDinh && idx === 24 && (
                  <div
                    style={{
                      marginTop: "20px",
                      marginBottom: "15px",
                      padding: "10px",
                      backgroundColor: "#fff7e6",
                      borderLeft: "5px solid #ff9800",
                    }}
                  >
                    <strong>
                      Phần II. Trắc nghiệm dạng đúng sai (4 điểm):
                    </strong>
                    <br />
                    Thí sinh trả lời 4 câu hỏi cho phần thi tương ứng.<br />
                    Mỗi câu hỏi thí sinh chọn vào ô tương ứng với đúng hoặc sai đối với mỗi ý trong từng câu hỏi của đề.<br />
                    <br />
                    <strong>A. Phần chung cho tất cả các thí sinh (Câu 25, 26)</strong>
                  </div>
                )}

                {/* ✅ Thêm phần B – Phần riêng */}
                {isDeThiCoDinh && idx === 26 && (
                  <div
                    style={{
                      marginTop: "20px",
                      marginBottom: "15px",
                      padding: "10px",
                      backgroundColor: "#fff7e6",
                      borderLeft: "5px solid #ff9800",
                    }}
                  >
                    <strong>B. Phần riêng</strong>
                    <br />
                    Thí sinh chỉ chọn một trong hai phần sau: Khoa học máy tính làm hoặc Tin học ứng dụng.<br />
                    <br />
                    <strong>Định hướng Khoa học máy tính (câu 27 và 28)</strong>
                  </div>
                )}

                {isDeThiCoDinh && idx === 28 && (
                  <div
                    style={{
                      marginTop: "10px",
                      marginBottom: "15px",
                      padding: "10px",
                      backgroundColor: "#fff7e6",
                      borderLeft: "5px solid #ff9800",
                    }}
                  >
                    <strong>Định hướng Tin học ứng dụng (câu 29 và 30)</strong>
                  </div>
                )}
                <div className="question-card">
                  <div>
                    <strong>Câu {idx + 1}.</strong>
                    {q.questionLines ? (
                      q.questionLines.map((line, i) => (
                        <p key={i} style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <p style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
                        {q.question}
                      </p>
                    )}
                  </div>

                  {q.subQuestions ? (
                    q.subQuestions.map((sq, subIdx) => {
                      const key = `${idx}-${subIdx}`;
                      const selected = subAnswers[key];

                      return (
                        <div key={key} style={{ marginLeft: "20px", marginBottom: "10px" }}>
                          <p style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
                            {sq.label}. {sq.text}
                          </p>
                          <label>
                            <input
                              type="radio"
                              name={`q${idx}-${subIdx}`}
                              value="Đ"
                              checked={selected === "Đ"}
                              disabled={submitted}
                              onChange={(e) => handleSubAnswer(idx, subIdx, e.target.value)}
                            />{" "}
                            Đúng
                          </label>

                          <label style={{ marginLeft: "20px" }}>
                            <input
                              type="radio"
                              name={`q${idx}-${subIdx}`}
                              value="S"
                              checked={selected === "S"}
                              disabled={submitted}
                              onChange={(e) =>
                                handleSubAnswer(idx, subIdx, e.target.value)
                              }
                            />{" "}
                            Sai
                          </label>

                          {/* 👉 **THÊM MỚI – Hiện đúng/sai** */}
                          {submitted && answerResults[key] && (
                            <p
                              style={{
                                color: answerResults[key].correct ? "green" : "red",
                                fontWeight: "bold",
                                marginTop: "5px",
                              }}
                            >
                              {answerResults[key].correct
                                ? "✔ Đúng!"
                                : `✘ Sai. Đáp án đúng: ${answerResults[key].correctAnswer}`}
                            </p>
                          )}
                          {submitted && answerResults[key] && !answerResults[key].correct && (
                            <div style={{ marginTop: "6px" }}>
                              <button
                                onClick={() =>
                                  goiAI(
                                    key,
                                    sq.text,
                                    { Đ: "Đúng", S: "Sai" },
                                    answerResults[key].correctAnswer,
                                    selected
                                  )
                                }
                              >
                                🤖 AI giải thích
                              </button>

                              {aiLoadingMap[key] && <p>🤖 AI đang suy nghĩ...</p>}

                              {aiExplainMap[key] && (
                                <div className="ai-explain">
                                  <b>🤖 Trợ giảng:</b>

                                  <div className="ai-content">
                                    {aiExplainMap[key].split("\n").map((line, i) => (
                                      <p key={i}>{line}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })
                  ) : (
                    <div>
                      {Object.entries(q.options)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, val]) => (
                        <label
                          key={key}
                          style={{
                            display: "block",
                            marginBottom: "10px",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q${idx}`}
                            value={key}
                            checked={selectedAnswers[idx] === key}
                            disabled={submitted}
                            onChange={(e) => handleAnswer(idx, e.target.value)}
                          />{" "}
                          {key}. {val}
                        </label>
                      ))}

                      {/* 👉 **THÊM MỚI – hiện đúng/sai** */}
                      {submitted && answerResults[idx] && (
                        <p
                          style={{
                            color: answerResults[idx].correct ? "green" : "red",
                            fontWeight: "bold",
                            marginTop: "5px",
                          }}
                        >
                          {answerResults[idx].correct
                            ? "✔ Đúng!"
                            : `✘ Sai. Đáp án đúng: ${answerResults[idx].correctAnswer}`}
                        </p>
                      )}
                      {submitted && answerResults[idx] && !answerResults[idx].correct && (
                        <div style={{ marginTop: "6px" }}>
                          <button
                            onClick={() =>
                              goiAI(
                                idx,
                                q.question,
                                q.options,
                                answerResults[idx].correctAnswer,
                                selectedAnswers[idx]
                              )
                            }
                          >
                            🤖 AI giải thích
                          </button>

                          {aiLoadingMap[idx] && <p>🤖 AI đang suy nghĩ...</p>}

                          {aiExplainMap[idx] && (
                            <div className="ai-box">
                              <b>🤖 Trợ giảng:</b>

                              <div className="ai-content">
                                {(aiExplainMap[idx] || "")
                                  .split("\n")
                                  .filter(line => line.trim() !== "")
                                  .map((line, i) => (
                                    <p key={i}>{line}</p>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>                    
                  )}
                </div>
              </React.Fragment>
            ))}

            {!submitted && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  className="submit-btn"
                  onClick={() => {
                    Swal.fire({
                      title: "Xác nhận nộp bài?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "✅ Có, nộp ngay",
                      cancelButtonText: "❌ Chưa, tiếp tục làm",
                    }).then((result) => {
                      if (result.isConfirmed) {
                        if (isDeThi) handleSubmitDeThi();
                        else handleSubmitOnTap();
                      }
                    });
                  }}
                >
                  📝 Nộp bài
                </button>
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "red" }}>
            ⚠️ Đề này chưa có câu hỏi
          </p>
        )}
        <div style={{
            position: "fixed",
            bottom: "120px",   // cách đáy màn hình
            right: "67px",    // cách phải màn hình
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1000,
        }}>
            {!submitted && isDeThi && (
              <ExamTimer
                duration={(topic.thoiGian || 50) * 60}
                onTimeUp={handleTimeUp}
              />
            )}
            <BackToTopButton />
        </div>

      </div>
    </>
  );
}

export default TopicDetail;
