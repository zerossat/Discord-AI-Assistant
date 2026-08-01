import {
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

const GAME_GUIDES: Record<string, { title: string; color: number; icon: string; desc: string }> = {
  turing: {
    title: '🌀 Dự Án Turing — Game Ma Sói AI 24/7',
    icon: '🌀',
    color: 0x9b59b6,
    desc:
      '**Vòng lặp Ma Sói Xã Hội:**\n' +
      '1. **Thâm nhập**: AI tự tạo thân phận ngầm (`Chameleon Persona`) trà trộn vào server.\n' +
      '2. **Nghi vấn**: Gõ `/turing suspect user: @Member` để gửi nghi vấn. Đủ 3 nghi vấn sẽ tự kích hoạt **Tòa Án Turing**.\n' +
      '3. **Hỏi xoáy đáp xoay (10 Phút)**: Gõ `/turing interrogate question: <câu hỏi>` để tra hỏi nghi phạm. AI sẽ tự đối đáp bào chữa real-time.\n' +
      '4. **Bỏ phiếu & Kết quả**: Gõ `/turing vote choice: HUMAN | AI` và `/turing resolve` để chốt phán quyết. Đoán đúng nhận **+200 XP**; đoán sai AI nhận danh hiệu *"Kẻ Thao Túng Master"*!',
  },
  hackbot: {
    title: '🔓 Hack the Bot — Prompt Injection Challenge',
    icon: '🔓',
    color: 0xe74c3c,
    desc:
      '**Thử thách đánh lừa AI:**\n' +
      '1. **Bắt đầu**: Gõ `/hackbot start` để khởi tạo két sắt bảo mật chứa mật mã bí mật.\n' +
      '2. **Bẻ khóa**: Gõ tin nhắn trực tiếp trong kênh chat dùng các kỹ thuật Prompt Injection, bẫy logic hoặc câu từ ép AI tiết lộ mật khẩu.\n' +
      '3. **Gợi ý & Dừng**: Dùng `/hackbot hint` để xin gợi ý hoặc `/hackbot stop` để dừng.\n' +
      '4. **Phần thưởng**: Hacker đầu tiên bẻ khóa thành công nhận **+100 XP**!',
  },
  guessprompt: {
    title: '🖼️ Đoán Prompt Ảnh AI',
    icon: '🖼️',
    color: 0x3498db,
    desc:
      '**Đoán ý tưởng AI vẽ:**\n' +
      '1. **Bắt đầu**: Gõ `/guessprompt start`, AI sẽ sinh 1 bức ảnh từ từ khóa gốc ẩn.\n' +
      '2. **Đoán**: Nhìn ảnh và gõ từ khóa trực tiếp vào kênh chat (hoặc `/guessprompt guess`).\n' +
      '3. **Gợi ý**: Gõ `/guessprompt hint` để xem gợi ý các chữ cái từ AI.\n' +
      '4. **Phần thưởng**: Đoán đúng từ khóa nhận **+80 XP**!',
  },
  gacha: {
    title: '🃏 Thẻ Bài Gacha AI & Kho Thẻ',
    icon: '🃏',
    color: 0xf1c40f,
    desc:
      '**Sưu tầm thẻ bài độc bản:**\n' +
      '1. **Quay Gacha**: Gõ `/gacha` hằng ngày (cooldown 20h) để điểm danh nhận 1 thẻ bài nhân vật AI.\n' +
      '2. **Phẩm chất**: Common (50%), Rare (30%), Epic (15%), Legendary (5%).\n' +
      '3. **Chỉ số**: Mỗi thẻ gồm Artwork sinh bởi AI + chỉ số ATK / DEF / HP riêng biệt.\n' +
      '4. **Xem kho**: Gõ `/cards` (hoặc `/cards user: @Member`) để xem bộ sưu tập.',
  },
  titles: {
    title: '👑 Hệ Thống Danh Hiệu Hài Hước AI',
    icon: '👑',
    color: 0xe67e22,
    desc:
      '**AI Phân Tích & Phong Danh Hiệu:**\n' +
      '1. **Nhận danh hiệu**: Gõ `/titles claim`, AI Gemini sẽ đọc thói quen chat gần đây và phong cho bạn 1 danh hiệu độc quyền cực kỳ hài hước.\n' +
      '2. **Xem danh hiệu**: Gõ `/titles view` để xem bộ sưu tập danh hiệu đã đạt được.',
  },
  quiz: {
    title: '🎯 Đuổi Hình Bắt Chữ AI',
    icon: '🎯',
    color: 0x2ecc71,
    desc:
      '**Game bắt chữ hình ảnh:**\n' +
      '1. **Bắt đầu**: Gõ `/quiz start` để bot hiển thị ảnh câu đố kèm gợi ý số chữ.\n' +
      '2. **Bắt chữ**: Gõ trực tiếp đáp án vào kênh chat (hoặc gõ `/quiz answer`).\n' +
      '3. **Gợi ý**: Dùng nút bấm tương tác hoặc `/quiz hint` để mở ô chữ.',
  },
};

export function buildGuideEmbed(gameKey?: string): EmbedBuilder {
  if (gameKey && GAME_GUIDES[gameKey]) {
    const g = GAME_GUIDES[gameKey]!;
    return new EmbedBuilder()
      .setColor(g.color)
      .setTitle(g.title)
      .setDescription(g.desc)
      .setFooter({ text: 'AI Assistant Game Guide · Dùng /guide để xem game khác' });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 TRUNG TÂM HƯỚNG DẪN CÁC GAME AI')
    .setDescription('Chọn một trò chơi ở menu bên dưới để xem hướng dẫn luật chơi chi tiết & phần thưởng!');

  for (const [key, value] of Object.entries(GAME_GUIDES)) {
    embed.addFields({
      name: `${value.icon} ${value.title}`,
      value: `Dùng \`/guide game: ${key}\` để xem chi tiết.`,
    });
  }

  embed.setFooter({ text: 'AI Assistant Game Hub' });
  return embed;
}

export function buildGuideSelectRow(): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('guide:select_game')
    .setPlaceholder('Chọn game cần xem hướng dẫn…')
    .addOptions(
      Object.entries(GAME_GUIDES).map(([key, val]) => ({
        label: val.title,
        value: key,
        emoji: val.icon,
      })),
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export const guideCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.GUIDE)
    .setDescription('📖 Xem hướng dẫn luật chơi chi tiết các Trò chơi AI')
    .addStringOption((o) =>
      o
        .setName('game')
        .setDescription('Trò chơi cần xem hướng dẫn')
        .addChoices(
          { name: '🌀 Dự Án Turing (Ma Sói AI 24/7)', value: 'turing' },
          { name: '🔓 Hack the Bot (Prompt Injection)', value: 'hackbot' },
          { name: '🖼️ Đoán Prompt Ảnh AI', value: 'guessprompt' },
          { name: '🃏 Thẻ Bài Gacha AI & Kho Thẻ', value: 'gacha' },
          { name: '👑 Phong Danh Hiệu Hài Hước AI', value: 'titles' },
          { name: '🎯 Đuổi Hình Bắt Chữ AI', value: 'quiz' },
        ),
    ),

  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const selectedGame = interaction.options.getString('game') ?? undefined;
    const embed = buildGuideEmbed(selectedGame);
    const row = buildGuideSelectRow();

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};

export async function handleGuideSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId !== 'guide:select_game') return;
  const gameKey = interaction.values[0];
  if (!gameKey) return;

  const embed = buildGuideEmbed(gameKey);
  const row = buildGuideSelectRow();

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
