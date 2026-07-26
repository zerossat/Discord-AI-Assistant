export interface QuizItem {
  id: number;
  question: string;
  answer: string;
  normalizedAnswer: string;
  hintText: string;
  category: string;
}

export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const QUIZ_PUZZLES: QuizItem[] = [
  {
    id: 1,
    question: '⚽ + 🦶',
    answer: 'BÓNG ĐÁ',
    normalizedAnswer: 'BONG DA',
    hintText: 'Môn thể thao vua được hàng tỷ người yêu thích',
    category: 'Thể thao',
  },
  {
    id: 2,
    question: '🌧️ + 🌈',
    answer: 'CẦU VỒNG',
    normalizedAnswer: 'CAU VONG',
    hintText: 'Dải 7 màu rực rỡ xuất hiện sau cơn mưa',
    category: 'Thiên nhiên',
  },
  {
    id: 3,
    question: '⛵ + 🌊',
    answer: 'SÓNG BIỂN',
    normalizedAnswer: 'SONG BIEN',
    hintText: 'Những chuyển động dâng trào ngoài đại dương',
    category: 'Thiên nhiên',
  },
  {
    id: 4,
    question: '🦁 + 👑',
    answer: 'VUA SƯ TỬ',
    normalizedAnswer: 'VUA SU TU',
    hintText: 'Bộ phim hoạt hình kinh điển của Disney về chú sư tử Simba',
    category: 'Điện ảnh',
  },
  {
    id: 5,
    question: '☀️ + 🌸',
    answer: 'HƯỚNG DƯƠNG',
    normalizedAnswer: 'HUONG DUONG',
    hintText: 'Loài hoa vàng luôn quay mặt về phía mặt trời',
    category: 'Thực vật',
  },
  {
    id: 6,
    question: '💡 + 🧠',
    answer: 'SÁNG KIẾN',
    normalizedAnswer: 'SANG KIEN',
    hintText: 'Ý tưởng mới mẻ mang lại hiệu quả cao',
    category: 'Đời sống',
  },
  {
    id: 7,
    question: '🎯 + 🏹',
    answer: 'BẮN CUNG',
    normalizedAnswer: 'BAN CUNG',
    hintText: 'Môn thể thao dùng cung nhắm vào tâm bia',
    category: 'Thể thao',
  },
  {
    id: 8,
    question: '☕ + 🥛',
    answer: 'BẠC XỈU',
    normalizedAnswer: 'BAC XIU',
    hintText: 'Món cà phê pha nhiều sữa tươi phổ biến ở Việt Nam',
    category: 'Ẩm thực',
  },
  {
    id: 9,
    question: '☘️ + 📜',
    answer: 'CỎ BA LÁ',
    normalizedAnswer: 'CO BA LA',
    hintText: 'Loài cỏ biểu tượng cho may mắn',
    category: 'Thực vật',
  },
  {
    id: 10,
    question: '👑 + 🚪',
    answer: 'VƯƠNG QUỐC',
    normalizedAnswer: 'VUONG QUOC',
    hintText: 'Lãnh thổ được cai trị bởi vua hoặc nữ hoàng',
    category: 'Đời sống',
  },
  {
    id: 11,
    question: '⚓ + 🚢',
    answer: 'HẢI CẢNG',
    normalizedAnswer: 'HAI CANG',
    hintText: 'Nơi tàu thuyền neo đậu và bốc dỡ hàng hóa',
    category: 'Đời sống',
  },
  {
    id: 12,
    question: '🐉 + 👁️',
    answer: 'LONG NHÃN',
    normalizedAnswer: 'LONG NHAN',
    hintText: 'Món đặc sản ngọt ngào làm từ quả nhãn sấy',
    category: 'Ẩm thực',
  },
  {
    id: 13,
    question: '🔥 + 🐉',
    answer: 'HỎA LONG',
    normalizedAnswer: 'HOA LONG',
    hintText: 'Rồng phun lửa thần thoại',
    category: 'Huyền thoại',
  },
  {
    id: 14,
    question: '🎹 + 🎵',
    answer: 'ÂM NHẠC',
    normalizedAnswer: 'AM NHAC',
    hintText: 'Nghệ thuật của giai điệu và âm thanh',
    category: 'Nghệ thuật',
  },
  {
    id: 15,
    question: '🏆 + 🥇',
    answer: 'VÔ ĐỊCH',
    normalizedAnswer: 'VO DICH',
    hintText: 'Vị trí dẫn đầu trong một giải đấu',
    category: 'Thể thao',
  },
  {
    id: 16,
    question: '🚀 + 🌕',
    answer: 'TÀU VŨ TRỤ',
    normalizedAnswer: 'TAU VU TRU',
    hintText: 'Phương tiện bay vào không gian bao la',
    category: 'Khoa học',
  },
  {
    id: 17,
    question: '⚡ + ⛈️',
    answer: 'SẤM SÉT',
    normalizedAnswer: 'SAM SET',
    hintText: 'Hiện tượng thiên nhiên lóe sáng kèm tiếng nổ lớn khi mưa bão',
    category: 'Thời tiết',
  },
  {
    id: 18,
    question: '🍉 + 🗡️',
    answer: 'DƯA HẤU',
    normalizedAnswer: 'DUA HAU',
    hintText: 'Trái cây vỏ xanh ruột đỏ gắn liền với sự tích Mai An Tiêm',
    category: 'Ẩm thực',
  },
  {
    id: 19,
    question: '🍿 + 🎬',
    answer: 'XEM PHIM',
    normalizedAnswer: 'XEM PHIM',
    hintText: 'Hoạt động giải trí quen thuộc tại rạp chiếu',
    category: 'Giải trí',
  },
  {
    id: 20,
    question: '🍵 + 🍋',
    answer: 'TRÀ CHANH',
    normalizedAnswer: 'TRA CHANH',
    hintText: 'Thức uống vỉa hè yêu thích của giới trẻ Việt Nam',
    category: 'Ẩm thực',
  },
];

/**
 * Generate a masked hint string with revealed letters.
 * e.g., "BÓNG ĐÁ" -> "B _ _ G  Đ _"
 */
export function generateMaskedHint(answer: string, level: number = 1): string {
  const words = answer.split(' ');
  return words
    .map((word) => {
      const chars = word.split('');
      const length = chars.length;
      return chars
        .map((char, index) => {
          if (level === 1 && index === 0) return char; // Reveal 1st letter
          if (level >= 2 && (index === 0 || index === length - 1)) return char; // Reveal 1st & last
          if (level >= 3 && (index === 0 || index === Math.floor(length / 2) || index === length - 1)) return char;
          return '_';
        })
        .join(' ');
    })
    .join('   ');
}
