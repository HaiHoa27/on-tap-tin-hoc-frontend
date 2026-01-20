import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

function LichSuLamBai() {
  const [ds, setDs] = useState([]);
  const [locMaDe, setLocMaDe] = useState("");

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "ket_qua_lam_bai"),
        orderBy("thoiDiemNop", "desc")
      );
      const snap = await getDocs(q);
      setDs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  const danhSachMaDe = [...new Set(ds.map(d => d.maDe))];

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 KẾT QUẢ LÀM BÀI HỌC SINH</h2>

      <select
        value={locMaDe}
        onChange={e => setLocMaDe(e.target.value)}
      >
        <option value="">-- Chọn mã đề --</option>
        {danhSachMaDe.map(md => (
          <option key={md} value={md}>{md}</option>
        ))}
      </select>

      <table border="1" cellPadding="8" style={{ marginTop: 20, width: "100%" }}>
        <thead>
          <tr>
            <th>Học sinh</th>
            <th>Mã đề</th>
            <th>Đúng</th>
            <th>Điểm</th>
            <th>Thời gian (phút)</th>
            <th>Thời điểm nộp</th>
          </tr>
        </thead>
        <tbody>
          {ds
            .filter(d => !locMaDe || d.maDe === locMaDe)
            .map(d => (
              <tr key={d.id}>
                <td>{d.hoTen}</td>
                <td>{d.maDe}</td>
                <td>{d.dung}/{d.tong}</td>
                <td>{d.diem}</td>
                <td>{Math.round(d.thoiGianLam / 60)}</td>
                <td>{d.thoiDiemNop?.toDate().toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default LichSuLamBai;
