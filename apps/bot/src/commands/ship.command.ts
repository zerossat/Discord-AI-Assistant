import { createHash } from 'node:crypto';
import { EmbedBuilder, SlashCommandBuilder, type User } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

/** % hợp nhau cố định theo cặp: cùng một cặp luôn cho cùng kết quả. */
function compatPercent(idA: string, idB: string): number {
  const key = [idA, idB].sort().join(':');
  const hash = createHash('md5').update(key).digest();
  return hash.readUInt16BE(0) % 101; // 0..100
}

function heartBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return '❤️'.repeat(filled) + '🤍'.repeat(10 - filled);
}

function verdict(pct: number): { text: string; color: number } {
  if (pct >= 95) return { text: 'Định mệnh rồi! Trời sinh một cặp 🔥💍', color: 0xff2d78 };
  if (pct >= 80) return { text: 'Quá hợp! Một cặp trời ban 💕', color: 0xff4d88 };
  if (pct >= 60) return { text: 'Hợp phết đó nha 😍 Tiến tới đi!', color: 0xeb459e };
  if (pct >= 40) return { text: 'Có tiềm năng 👀 Cứ từ từ tìm hiểu nhé', color: 0xfee75c };
  if (pct >= 20) return { text: 'Cần cố gắng nhiều 🌱 Làm bạn trước đã', color: 0x5865f2 };
  return { text: 'Hơi khó nha 😅 Có duyên chưa chắc có phận', color: 0x4e5058 };
}

function displayName(u: User): string {
  return u.globalName ?? u.username;
}

export const shipCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.SHIP)
    .setDescription('💘 Đo độ hợp % giữa bạn và một người (hoặc giữa 2 người)')
    .addUserOption((o) =>
      o.setName('nguoi-ay').setDescription('Người muốn ghép đôi').setRequired(true),
    )
    .addUserOption((o) =>
      o
        .setName('nguoi-thu-2')
        .setDescription('Người thứ 2 — để trống sẽ ghép với chính bạn'),
    ),
  async execute(interaction) {
    const first = interaction.options.getUser('nguoi-ay', true);
    const second = interaction.options.getUser('nguoi-thu-2');
    const a = second ? first : interaction.user;
    const b = second ?? first;

    if (a.id === b.id) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('💘 100% hợp nhau')
            .setColor(0xff4d88)
            .setDescription(
              `💑 **${displayName(a)}**  ❤️  **${displayName(b)}**\n\n` +
                'Ghép với chính mình hả? **100%** yêu bản thân 💯✨',
            ),
        ],
      });
      return;
    }

    const pct = compatPercent(a.id, b.id);
    const v = verdict(pct);

    const embed = new EmbedBuilder()
      .setTitle(`💘 ${pct}% hợp nhau`)
      .setColor(v.color)
      .setThumbnail(b.displayAvatarURL({ size: 128 }))
      .setDescription(
        `💑 **${displayName(a)}**  ❤️  **${displayName(b)}**\n\n` +
          `${heartBar(pct)}\n\n` +
          `**${v.text}**`,
      )
      .setFooter({ text: 'Chỉ mang tính giải trí 💫 Con số cố định theo từng cặp.' });

    await interaction.reply({ embeds: [embed] });
  },
};
