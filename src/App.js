import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import data from "./data.json";
import TopicList from "./components/TopicList";
import TopicDetail from "./components/TopicDetail";
import TaoDeOnTap from "./components/TaoDeOnTap";
import LichSuLamBai from "./pages/LichSuLamBai";
import BackToTopButton from "./components/BackToTopButton";
import HeroBanner from "./components/HeroBanner";
import "./App.css";
import ChatBot from "./components/ChatBot";

// ===== NAVBAR RIÊNG DÙNG useNavigate =====
function Navbar({ user, userData, isGV, handleLogout, toggleTheme, theme, setShowLoginForm, setShowRegisterForm }) {
  const navigate = useNavigate();

  return (
    <nav className={`navbar ${theme}`}>
      <div className="nav-container">
        <div className="nav-left">
          <button className="nav-btn" onClick={() => navigate("/")}>🏠 Home</button>
          {user && (
            <button className="nav-btn" onClick={() => navigate("/tao-de")}>
              📝 Tạo đề ôn tập
            </button>
          )}
          {isGV && (
            <button className="nav-btn" onClick={() => navigate("/lich-su")}>
              📊 Xem kết quả học sinh
            </button>
          )}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="welcome-text">
                👋 Xin chào, <strong>{userData?.hoTen || userData?.email || user.email}</strong>
              </span>
              <button className="nav-btn" onClick={handleLogout}>🚪 Đăng xuất</button>
            </>
          ) : (
            <>
              <button
                className="nav-btn"
                onClick={() => setShowLoginForm(true)}
              >
                🔐 Đăng nhập
              </button>

              <button
                className="nav-btn"
                onClick={() => setShowRegisterForm(true)}
              >
                📝 Đăng ký
              </button>
            </>
          )}
          <button className="nav-btn" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Giao diện tối" : "🌞 Giao diện sáng"}
          </button>
        </div>
      </div>
    </nav>
  );
}

function ChatBotController() {
  const location = useLocation();

  // ❌ Ẩn khi vào đề thi
  const hideOnPaths =
    location.pathname.startsWith("/tao-de") ||
    location.pathname.startsWith("/topic/DE_THI") ||
    location.pathname.startsWith("/topic/KT_");

  if (hideOnPaths) return null;

  return <ChatBot />;
}

function TopicLoader({ data }) {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      console.log("👉 URL id:", id);

      // ✅ 1. tìm local trước
      const local = data.find(
        t => String(t.id).trim() === String(id).trim()
      );

      if (local) {
        console.log("✅ Found in data.json:", local);
        setTopic(local);
        setLoading(false);
        return;
      }

      // ✅ 2. tìm firestore
      try {
        const snap = await getDoc(doc(db, "de_on_tap", id));
        if (snap.exists()) {
          console.log("✅ Found in Firestore:", snap.data());
          setTopic({ id, ...snap.data() });
        } else {
          console.log("❌ Not found anywhere");
          setTopic(null);
        }
      } catch (e) {
        console.error("🔥 Firestore error:", e);
        setTopic(null);
      }

      setLoading(false);
    };

    load();
  }, [id, data]);

  if (loading) return <h3>⏳ Đang tải...</h3>;

  if (!topic)
    return <h2 style={{ textAlign: "center", color: "red" }}>
      ❌ Không tìm thấy dữ liệu
    </h2>;

  return <TopicDetail topic={topic} />;
}


// ===== APP CHÍNH =====
function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // ===== PHÂN QUYỀN GIÁO VIÊN =====
  const GIAO_VIEN_EMAIL = "tranhaihoa.thptll@quangtri.edu.vn"; // đổi thành email GV của bạn
  const isGV = user?.email === GIAO_VIEN_EMAIL;

  // Lắng nghe đăng nhập Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, "hoc_sinh", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setUserData(docSnap.data());
          else setUserData({ email: currentUser.email });
        } catch (err) {
          console.error(err);
          setUserData({ email: currentUser.email });
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Swal.fire({ icon: "success", title: "✅ Đã đăng xuất!" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Router>
      {/* Header */}
      <header className="site-header">
        <img src="/header-bg.jpg" alt="TinTNSmart Header" className="header-bg" />
      </header>


      {/* Navbar */}
      <Navbar
        user={user}
        userData={userData}
        isGV={isGV}
        handleLogout={handleLogout}
        toggleTheme={toggleTheme}
        theme={theme}
        setShowLoginForm={setShowLoginForm}
        setShowRegisterForm={setShowRegisterForm}
      />

      {!user && <HeroBanner />}

      {/* Form đăng ký */}
      {showRegisterForm && (
        <div className="overlay">
          <div className={`register-form ${theme}`}>
            <h2>📝 Đăng ký tài khoản học sinh</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const hoTen = form.hoTen.value;
                const lop = form.lop.value;
                const email = form.email.value;
                const password = form.password.value;

                try {
                  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  const newUser = userCredential.user;

                  await setDoc(doc(db, "hoc_sinh", newUser.uid), {
                    hoTen,
                    lop,
                    email,
                    createdAt: new Date(),
                  });

                  setUser(newUser);
                  setUserData({ hoTen, lop, email });
                  Swal.fire({ icon: "success", title: "✅ Đăng ký thành công!" });
                  form.reset();
                  setShowRegisterForm(false);
                } catch (err) {
                  console.error(err);
                  Swal.fire({ icon: "error", title: "❌ Lỗi khi đăng ký" });
                }
              }}
            >
              <input name="hoTen" placeholder="👤 Họ và tên" required />
              <input name="lop" placeholder="🏫 Lớp" required />
              <input name="email" type="email" placeholder="📧 Email" required />
              <input name="password" type="password" placeholder="🔒 Mật khẩu" required />
              <div className="form-buttons">
                <button type="submit">Gửi</button>
                <button type="button" onClick={() => setShowRegisterForm(false)}>Huỷ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form đăng nhập */}
      {showLoginForm && (
        <div className="overlay">
          <div className={`register-form ${theme}`}>
            <h2>Đăng nhập</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;

                try {
                  const userCredential = await signInWithEmailAndPassword(auth, email, password);
                  setUser(userCredential.user);
                  setUserData({ email });
                  Swal.fire({ icon: "success", title: "✅ Đăng nhập thành công!" });
                  setShowLoginForm(false);
                } catch (err) {
                  console.error(err);
                  Swal.fire({ icon: "error", title: "❌ Đăng nhập thất bại!" });
                }
              }}
            >
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Mật khẩu" required />
              <div className="form-buttons">
                <button type="submit">Đăng nhập</button>
                <button type="button" onClick={() => setShowLoginForm(false)}>Huỷ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Routes */}
      <div className={`container ${theme}`} style={{ minHeight: "80vh" }}>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <TopicList data={data} />
              ) : (
                <h2 style={{ textAlign: "center" }}>
                  🔒 Vui lòng đăng nhập để ôn tập
                </h2>
              )
            }
          />

          <Route
            path="/tao-de"
            element={
              !user ? (
                <h2 style={{ textAlign: "center" }}>
                  🔒 Bạn cần đăng nhập để truy cập
                </h2>
              ) : (
                <TaoDeOnTap data={data} />
              )
            }
          />

          <Route
            path="/lich-su"
            element={
              !user ? (
                <h2 style={{ textAlign: "center" }}>
                  🔒 Bạn cần đăng nhập để xem kết quả
                </h2>
              ) : isGV ? (
                <LichSuLamBai />
              ) : (
                <h2 style={{ textAlign: "center" }}>
                  ❌ Chỉ giáo viên mới xem được kết quả
                </h2>
              )
            }
          />

          {/* 👉 Chủ đề con từ data.json */}
          <Route path="/topic/:id" element={<TopicLoader data={data} />} />
        </Routes>
      </div>

      <BackToTopButton theme={theme} />
      <ChatBotController />   {/* 🤖 Trợ giảng Tin học */}

      <footer className="site-footer">
        <p>
          <strong>
            <em>✅ Trường THPT số 1 Lê Lợi - Địa chỉ: 87 Lê Lợi, Nam Đông Hà, Quảng Trị</em>
          </strong>{" "}
        </p>
      </footer>
    </Router>
  );
}

export default App;
