import { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const tronNgauNhien = (arr) => [...arr].sort(() => Math.random() - 0.5);

const tronCauHoiDung = (cau) => {
  // ===== DẠNG ĐÚNG / SAI =====
  if (cau.subQuestions) {
    return {
      ...cau,
      subQuestions: cau.subQuestions.map(sq => ({ ...sq }))
    };
  }

  // ===== DẠNG TRẮC NGHIỆM =====
  if (!cau.options || !cau.answer) return cau;

  const entries = Object.entries(cau.options);
  const dapAnCu = cau.answer;
  const noiDungDung = cau.options[dapAnCu];

  const tron = entries
    .map(([k, v]) => ({ k, v, r: Math.random() }))
    .sort((a, b) => a.r - b.r);

  const newOptions = {};
  let newAnswer = null;

  tron.forEach((item, i) => {
    const label = String.fromCharCode(65 + i); // A B C D
    newOptions[label] = item.v;
    if (item.v === noiDungDung) {
      newAnswer = label;
    }
  });

  return {
    ...cau,
    options: newOptions,
    answer: newAnswer
  };
};

function TaoDeOnTap({ data }) {
  const navigate = useNavigate();

  // ❌ Không lấy đề cố định
  const dataOnTap = Array.isArray(data)
    ? data.filter(cd => cd.id !== "DE_THI")
    : [];

  // Gom nhóm theo chuyên đề
  const nhom = dataOnTap.reduce((acc, cd) => {
    if (!acc[cd.chuyenDe]) acc[cd.chuyenDe] = [];
    acc[cd.chuyenDe].push(cd);
    return acc;
  }, {});

  const [chon, setChon] = useState({});
  const [thoiGianLam, setThoiGianLam] = useState(30); // phút

  const thayDoi = (id, field, value) => {
    setChon(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "soCau" ? Number(value) : value
      }
    }));
  };

   const taoDe = async () => {
    console.log("DATA ON TAP:", dataOnTap);
    console.log("CHON:", chon);
    const tongCauThuc = Object.entries(chon).reduce((acc, [, cfg]) => {
      if (cfg?.chon && cfg.soCau > 0) return acc + cfg.soCau;
      return acc;
    }, 0);

    if (tongCauThuc === 0) {
      Swal.fire({
        icon: "error",
        title: "⚠️ Vui lòng chọn chủ đề và số câu"
      });
      return;
    }

    try {
      let dsCauHoi = [];

      for (const [id, cfg] of Object.entries(chon)) {
        if (!cfg?.chon || cfg.soCau <= 0) continue;

        const chuDeCon = dataOnTap.find(cd => cd.id === id);
        if (!chuDeCon || !Array.isArray(chuDeCon.cauHoi)) continue;

        const hopLe = chuDeCon.cauHoi.filter(
          c => c.options || c.subQuestions
        );

        if (cfg.soCau > hopLe.length) {
          Swal.fire({
            icon: "warning",
            title: "⚠️ Số câu vượt quá dữ liệu",
            text: `Chủ đề "${chuDeCon.ten}" chỉ có ${hopLe.length} câu`
          });
          return;
        }

        dsCauHoi = dsCauHoi.concat(
          tronNgauNhien(hopLe)
            .slice(0, cfg.soCau)
            .map(tronCauHoiDung)
        );

      }

      const maDeMoi = "KT_" + Date.now();

      const deHoanChinh = {
        id: maDeMoi,
        ten: "Đề luyện tập ngẫu nhiên",
        cauHoi: tronNgauNhien(dsCauHoi),
        thoiGian: thoiGianLam, // phút (⚠️ rất quan trọng)
        soCau: dsCauHoi.length,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "de_on_tap", maDeMoi), deHoanChinh);

      Swal.fire({
        icon: "success",
        title: "✅ Tạo đề thành công",
        html: `
          Mã đề: <b>${maDeMoi}</b><br/>
          <a href="/topic/${maDeMoi}">
            ${window.location.origin}/topic/${maDeMoi}
          </a>
        `
      }).then(() => navigate(`/topic/${maDeMoi}`));

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "❌ Lỗi khi tạo đề"
      });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📝 Tạo đề ôn tập (GV)</h2>

      <label>
        ⏱️ Thời gian làm bài (phút):
        <input
          type="number"
          min="5"
          value={thoiGianLam}
          onChange={e => setThoiGianLam(Number(e.target.value))}
          style={{ width: 80, marginLeft: 10 }}
        />
      </label>

      <h3 style={{ marginTop: 20 }}>
        📘 Chọn chủ đề con và số câu:
      </h3>

      {Object.keys(nhom).map(tenNhom => (
        <div key={tenNhom} style={{ marginBottom: 15 }}>
          <h4>Chuyên đề: {tenNhom}</h4>

          {nhom[tenNhom].map(cd => (
            <div key={cd.id} style={{ marginLeft: 20 }}>
              <input
                type="checkbox"
                onChange={e => thayDoi(cd.id, "chon", e.target.checked)}
              />{" "}
              {cd.ten}
              <input
                type="number"
                min="0"
                placeholder="Số câu"
                onChange={e => thayDoi(cd.id, "soCau", e.target.value)}
                style={{ width: 70, marginLeft: 10 }}
              />
            </div>
          ))}
        </div>
      ))}

      <p>
        <b>Tổng số câu:</b>{" "}
        {Object.entries(chon).reduce((acc, [, cfg]) => {
          if (cfg?.chon && cfg.soCau > 0) return acc + cfg.soCau;
          return acc;
        }, 0)}
      </p>

      <button onClick={taoDe}>🎯 Tạo đề</button>
    </div>
  );
}

export default TaoDeOnTap;
