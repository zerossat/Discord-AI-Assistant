import { createHash } from 'node:crypto';
import { EmbedBuilder, SlashCommandBuilder, type User } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import { buildChatContext } from '../utils/context';
import { childLogger } from '../utils/logger';

const log = childLogger('ship');

/** % hợp nhau cố định theo cặp: cùng một cặp luôn cho cùng kết quả. */
function compatPercent(idA: string, idB: string): number {
  const key = [idA, idB].sort().join(':');
  const hash = createHash('md5').update(key).digest();
  return hash.readUInt16BE(0) % 101; // 0..100
}

function heartBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return '💖'.repeat(filled) + '🖤'.repeat(10 - filled);
}

function verdict(pct: number): { text: string; color: number } {
  if (pct >= 95) return { text: 'Định mệnh đời nhau! Trời sinh một cặp 🔥💍', color: 0xff2d78 };
  if (pct >= 80) return { text: 'Quá hợp! Cặp đôi lý tưởng trời ban 💕', color: 0xff4d88 };
  if (pct >= 60) return { text: 'Khá là ăn ý đó nha 😍 Tiến tới thôi!', color: 0xeb459e };
  if (pct >= 40) return { text: 'Tiềm năng lấp ló 👀 Cứ từ từ tìm hiểu nhé', color: 0xfee75c };
  if (pct >= 20) return { text: 'Cần cố gắng rất nhiều 🌱 Làm bạn trước đã', color: 0x5865f2 };
  return { text: 'Có vẻ lệch sóng rồi 😅 Hữu duyên vô phận', color: 0x4e5058 };
}

function displayName(u: User): string {
  return u.globalName ?? u.username;
}

export const shipCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.SHIP)
    .setDescription('💘 Đo độ hợp % giữa bạn và người ấy (luận giải bằng AI Cupid)')
    .addUserOption((o) =>
      o.setName('nguoi-ay').setDescription('Người muốn ghép đôi').setRequired(true),
    )
    .addUserOption((o) =>
      o
        .setName('nguoi-thu-2')
        .setDescription('Người thứ 2 — để trống sẽ ghép với chính bạn'),
    ),
  async execute(interaction, services) {
    const first = interaction.options.getUser('nguoi-ay', true);
    const second = interaction.options.getUser('nguoi-thu-2');
    const a = second ? first : interaction.user;
    const b = second ?? first;

    await interaction.deferReply();

    if (a.id === b.id) {
      const selfLovePct = 100;
      let selfLoveReading = 'Yêu bản thân là khởi đầu của một cuộc tình lãng mạn trọn đời! 💯✨';
      
      try {
        const ctx = await buildChatContext(interaction, services);
        selfLoveReading = await services.chat.ship(ctx, displayName(a), displayName(b), selfLovePct);
      } catch (err) {
        log.warn({ err }, 'AI ship self-love reading failed');
      }

      const embed = new EmbedBuilder()
        .setTitle('💘 Kết Quả Ghép Đôi Tơ Duyên')
        .setColor(0xff4d88)
        .setThumbnail(a.displayAvatarURL({ size: 256 }))
        .setDescription(
          `💑 **Cặp đôi:** ${a} x ${b}\n\n` +
            `📈 **Độ tương thích:** **100%** (Self-Love)\n` +
            `${heartBar(100)}\n\n` +
            `💌 **Lời phán từ Cupid:**\n${selfLoveReading}`,
        )
        .setFooter({ text: 'Yêu chiều bản thân là điều tuyệt vời nhất! 💫' });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const pct = compatPercent(a.id, b.id);
    const v = verdict(pct);

    let aiReading: string | null = null;
    try {
      const ctx = await buildChatContext(interaction, services);
      aiReading = await services.chat.ship(ctx, displayName(a), displayName(b), pct);
    } catch (err) {
      log.warn({ err }, 'AI ship reading failed');
    }

    const embed = new EmbedBuilder()
      .setTitle('💘 Kết Quả Ghép Đôi Tơ Duyên')
      .setColor(v.color)
      .setThumbnail(b.displayAvatarURL({ size: 256 }))
      .setDescription(
        `💑 **Cặp đôi:** ${a} x ${b}\n\n` +
          `📈 **Độ tương thích:** **${pct}%**\n` +
          `${heartBar(pct)}\n\n` +
          `💌 **Lời phán từ Cupid:**\n${aiReading?.trim() || v.text}`,
      )
      .setFooter({ text: 'Chỉ mang tính chất giải trí vui vẻ 💫 Con số cố định theo từng cặp.' });

    await interaction.editReply({ embeds: [embed] });
  },
};
