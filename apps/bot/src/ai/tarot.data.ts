/**
 * Major Arcana (22 lá Ẩn Chính) cho lệnh `/tarot`.
 * Mỗi lá có tên Việt/Anh và ý nghĩa ngắn cho chiều xuôi (upright) & ngược (reversed).
 */
export interface TarotCard {
  vi: string;
  en: string;
  emoji: string;
  upright: string;
  reversed: string;
}

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
}

export const MAJOR_ARCANA: readonly TarotCard[] = [
  {
    vi: 'Gã Khờ',
    en: 'The Fool',
    emoji: '🃏',
    upright: 'Khởi đầu mới, tự do, phiêu lưu, ngây thơ',
    reversed: 'Liều lĩnh, thiếu suy nghĩ, do dự',
  },
  {
    vi: 'Nhà Ảo Thuật',
    en: 'The Magician',
    emoji: '🪄',
    upright: 'Sáng tạo, ý chí, hiện thực hóa, kỹ năng',
    reversed: 'Thao túng, thiếu tập trung, tiềm năng bị lãng phí',
  },
  {
    vi: 'Nữ Tư Tế',
    en: 'The High Priestess',
    emoji: '🌙',
    upright: 'Trực giác, bí ẩn, nội tâm, tri thức ẩn',
    reversed: 'Phớt lờ trực giác, bí mật, mất kết nối nội tâm',
  },
  {
    vi: 'Nữ Hoàng',
    en: 'The Empress',
    emoji: '🌷',
    upright: 'Sung túc, nuôi dưỡng, nữ tính, sáng tạo',
    reversed: 'Phụ thuộc, bế tắc sáng tạo, bỏ bê bản thân',
  },
  {
    vi: 'Hoàng Đế',
    en: 'The Emperor',
    emoji: '🏛️',
    upright: 'Quyền lực, kỷ luật, ổn định, lãnh đạo',
    reversed: 'Độc đoán, cứng nhắc, mất kiểm soát',
  },
  {
    vi: 'Giáo Hoàng',
    en: 'The Hierophant',
    emoji: '📜',
    upright: 'Truyền thống, niềm tin, dẫn dắt, học hỏi',
    reversed: 'Nổi loạn, phá lệ, lối đi riêng',
  },
  {
    vi: 'Tình Nhân',
    en: 'The Lovers',
    emoji: '💞',
    upright: 'Tình yêu, hòa hợp, lựa chọn, kết nối',
    reversed: 'Bất hòa, lựa chọn sai, mất cân bằng',
  },
  {
    vi: 'Cỗ Xe',
    en: 'The Chariot',
    emoji: '🏇',
    upright: 'Quyết tâm, chiến thắng, ý chí, tiến lên',
    reversed: 'Mất phương hướng, thiếu kiểm soát, trì trệ',
  },
  {
    vi: 'Sức Mạnh',
    en: 'Strength',
    emoji: '🦁',
    upright: 'Dũng cảm, kiên nhẫn, nội lực, từ bi',
    reversed: 'Tự ti, nóng vội, nghi ngờ bản thân',
  },
  {
    vi: 'Ẩn Sĩ',
    en: 'The Hermit',
    emoji: '🏮',
    upright: 'Suy ngẫm, tìm kiếm bên trong, khôn ngoan',
    reversed: 'Cô lập, lạc lối, né tránh',
  },
  {
    vi: 'Bánh Xe Số Phận',
    en: 'Wheel of Fortune',
    emoji: '🎡',
    upright: 'Vận may, bước ngoặt, chu kỳ, định mệnh',
    reversed: 'Vận xui, trì hoãn, mất kiểm soát',
  },
  {
    vi: 'Công Lý',
    en: 'Justice',
    emoji: '⚖️',
    upright: 'Công bằng, sự thật, trách nhiệm, cân bằng',
    reversed: 'Bất công, thiên vị, trốn tránh trách nhiệm',
  },
  {
    vi: 'Người Treo Ngược',
    en: 'The Hanged Man',
    emoji: '🙃',
    upright: 'Buông bỏ, góc nhìn mới, tạm dừng',
    reversed: 'Trì hoãn, kháng cự, hy sinh vô ích',
  },
  {
    vi: 'Cái Chết',
    en: 'Death',
    emoji: '🦋',
    upright: 'Kết thúc & tái sinh, chuyển hóa, đổi mới',
    reversed: 'Níu kéo, sợ thay đổi, đình trệ',
  },
  {
    vi: 'Tiết Độ',
    en: 'Temperance',
    emoji: '🍷',
    upright: 'Cân bằng, điều hòa, kiên nhẫn, dung hòa',
    reversed: 'Mất cân bằng, thái quá, thiếu kiên nhẫn',
  },
  {
    vi: 'Ác Quỷ',
    en: 'The Devil',
    emoji: '😈',
    upright: 'Cám dỗ, ràng buộc, ham muốn, lệ thuộc',
    reversed: 'Giải thoát, dứt bỏ, lấy lại tự do',
  },
  {
    vi: 'Tòa Tháp',
    en: 'The Tower',
    emoji: '🗼',
    upright: 'Biến động bất ngờ, đổ vỡ, thức tỉnh',
    reversed: 'Né tránh tai họa, sợ thay đổi, khủng hoảng kéo dài',
  },
  {
    vi: 'Ngôi Sao',
    en: 'The Star',
    emoji: '⭐',
    upright: 'Hy vọng, chữa lành, cảm hứng, niềm tin',
    reversed: 'Mất niềm tin, nản lòng, lạc lối',
  },
  {
    vi: 'Mặt Trăng',
    en: 'The Moon',
    emoji: '🌕',
    upright: 'Ảo ảnh, trực giác, mơ hồ, tiềm thức',
    reversed: 'Sáng tỏ, vượt qua sợ hãi, sự thật lộ diện',
  },
  {
    vi: 'Mặt Trời',
    en: 'The Sun',
    emoji: '☀️',
    upright: 'Niềm vui, thành công, sức sống, tích cực',
    reversed: 'Lạc quan thái quá, trì hoãn niềm vui, mệt mỏi',
  },
  {
    vi: 'Phán Xét',
    en: 'Judgement',
    emoji: '📯',
    upright: 'Thức tỉnh, đánh giá lại, tha thứ, đổi mới',
    reversed: 'Tự trách, do dự, phớt lờ tiếng gọi bên trong',
  },
  {
    vi: 'Thế Giới',
    en: 'The World',
    emoji: '🌍',
    upright: 'Hoàn thành, viên mãn, thành tựu, trọn vẹn',
    reversed: 'Dang dở, thiếu khép lại, trì hoãn mục tiêu',
  },
];

/** Rút ngẫu nhiên `count` lá khác nhau, mỗi lá có chiều xuôi/ngược ngẫu nhiên. */
export function drawCards(count: number): DrawnCard[] {
  const deck = [...MAJOR_ARCANA];
  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck.slice(0, Math.max(1, Math.min(count, deck.length))).map((card) => ({
    card,
    reversed: Math.random() < 0.5,
  }));
}
