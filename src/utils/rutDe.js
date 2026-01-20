// Trộn và rút ngẫu nhiên N câu
export function rutNgauNhien(cauHoi, soCau) {
  const daTron = [...cauHoi].sort(() => Math.random() - 0.5);
  return daTron.slice(0, soCau);
}

// Rút đề từ nhiều chủ đề
export function rutDeNhieuChuDe(data, cauHinh) {
  let deThi = [];

  cauHinh.forEach(item => {
    const chuDe = data.find(cd => cd.id === item.idChuDe);
    if (chuDe) {
      const soCau = Number(item.soCau);
      const cauRut = rutNgauNhien(chuDe.cauHoi, item.soCau);
      deThi = deThi.concat(cauRut);
    }
  });

  return deThi.sort(() => Math.random() - 0.5);
}
