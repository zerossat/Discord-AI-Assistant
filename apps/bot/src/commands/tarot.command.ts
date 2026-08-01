import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { drawCards } from '../ai/tarot.data';
import { childLogger } from '../utils/logger';

const log = childLogger('tarot');

interface TarotSpread {
  name: string;
  description: string;
  positions: string[];
}

const TAROT_SPREADS: Record<string, TarotSpread> = {
  '1_la': {
    name: '1 lá — Thông điệp ngày mới',
    description: 'Lời khuyên hoặc năng lượng chủ đạo cho ngày hôm nay.',
    positions: ['Thông điệp / Lời khuyên'],
  },
  '3_qht': {
    name: '3 lá — Tổng quan cuộc sống',
    description: 'Nhìn nhận lại quá khứ, đánh giá hiện tại và định hướng tương lai.',
    positions: ['Quá khứ', 'Hiện tại', 'Tương lai'],
  },
  '3_giai_phap': {
    name: '3 lá — Giải quyết vấn đề',
    description: 'Phân tích tình huống hiện trạng, trở ngại lớn nhất và phương án hành động.',
    positions: ['Tình huống hiện tại', 'Thách thức / Trở ngại', 'Lời khuyên / Hướng giải quyết'],
  },
  '3_tinh_duyen': {
    name: '3 lá — Tình duyên / Mối quan hệ',
    description: 'Khám phá tình cảm của bạn, đối phương và chiều hướng kết nối.',
    positions: [
      'Bạn trong mối quan hệ',
      'Đối phương / Năng lượng chung',
      'Tương lai của hai người',
    ],
  },
  '3_lua_chon': {
    name: '3 lá — Quyết định khó khăn',
    description: 'So sánh giữa hai hướng đi để đưa ra lựa chọn sáng suốt.',
    positions: ['Lựa chọn A (Hướng đi 1)', 'Lựa chọn B (Hướng đi 2)', 'Lời khuyên chung'],
  },
};

export const tarotCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.TAROT)
    .setDescription('🔮 Bói bài Tarot — rút bài & luận giải bằng AI')
    .addStringOption((o) =>
      o
        .setName('kieu-boi')
        .setDescription('Chọn kiểu trải bài phù hợp với câu hỏi của bạn')
        .addChoices(
          { name: '🔮 1 lá — Thông điệp ngày mới', value: '1_la' },
          { name: '⏳ 3 lá — Quá khứ, Hiện tại, Tương lai', value: '3_qht' },
          { name: '🧩 3 lá — Vấn đề, Thách thức, Lời khuyên', value: '3_giai_phap' },
          { name: '💖 3 lá — Bản thân, Đối phương, Kết nối', value: '3_tinh_duyen' },
          { name: '⚖️ 3 lá — Lựa chọn A, Lựa chọn B, Lời khuyên', value: '3_lua_chon' },
        ),
    )
    .addStringOption((o) =>
      o.setName('cau-hoi').setDescription('Điều bạn muốn hỏi (không bắt buộc)').setMaxLength(300),
    ),
  async execute(interaction, services) {
    await interaction.deferReply();

    const spreadKey = interaction.options.getString('kieu-boi') ?? '1_la';
    const question = interaction.options.getString('cau-hoi');

    const spread = TAROT_SPREADS[spreadKey] ?? TAROT_SPREADS['1_la']!;
    const drawn = drawCards(spread.positions.length);

    const lines: string[] = [];
    if (question?.trim()) lines.push(`**Câu hỏi:** ${question.trim()}`, '');
    lines.push(`🌌 **Kiểu trải bài:** *${spread.name}*`, `> *${spread.description}*`, '');
    lines.push('🃏 **Lá bài rút được:**');

    const spreadForAi: string[] = [];
    drawn.forEach((d, i) => {
      const orient = d.reversed ? 'Ngược 🔻' : 'Xuôi 🔺';
      const meaning = d.reversed ? d.card.reversed : d.card.upright;
      const pos = spread.positions[i]!;
      lines.push(`**${pos}** — ${d.card.emoji} ${d.card.vi} *(${d.card.en})* · ${orient}`);
      lines.push(`> *Ý nghĩa: ${meaning}*`);
      spreadForAi.push(
        `Vị trí "${pos}": Lá ${d.card.vi} (${d.card.en}) - Hướng ${orient} - Ý nghĩa cốt lõi: ${meaning}`,
      );
    });

    // AI luận giải; degrade nhẹ nếu lỗi (vd: hết quota) — vẫn hiển thị lá bài.
    let reading: string | null = null;
    try {
      const ctx = await buildChatContext(interaction, services);
      reading = await services.chat.tarot(
        ctx,
        question,
        spreadForAi.join('\n'),
        spread.name,
        spread.description,
      );
    } catch (err) {
      log.warn({ err }, 'tarot AI reading failed; showing cards only');
    }

    lines.push('', '🌙 **Luận giải từ AI Reader**');
    lines.push(
      reading?.trim()
        ? reading.trim()
        : 'AI đang bận hoặc hết lượt — bạn tham khảo ý nghĩa từng lá phía trên nhé. ✨',
    );

    const embed = new EmbedBuilder()
      .setTitle('🔮 Trải Bài Tarot Chiêm Nghiệm')
      .setColor(0x5865f2)
      .setDescription(lines.join('\n').slice(0, 4096))
      .setFooter({ text: 'Tarot chỉ mang tính tham khảo & giải trí ✨' });

    await interaction.editReply({ embeds: [embed] });
  },
};
