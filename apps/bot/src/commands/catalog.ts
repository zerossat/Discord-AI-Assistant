import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
} from 'discord.js';

export interface CommandInfo {
  usage: string;
  desc: string;
}

export interface CommandCategory {
  id: string;
  label: string;
  emoji: string;
  commands: CommandInfo[];
}

/** Single source of truth for `/help` and `/menu`. */
export const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    id: 'ai',
    label: 'AI & Chat',
    emoji: '🤖',
    commands: [
      { usage: '/ask <câu hỏi>', desc: 'Hỏi AI bất cứ điều gì (có ghi nhớ hội thoại)' },
      { usage: '/code <yêu cầu>', desc: 'Sinh code kèm giải thích & best practices' },
      { usage: '/translate <đến> <văn bản> [từ]', desc: 'Dịch văn bản giữa các ngôn ngữ' },
      { usage: '/summary [số tin]', desc: 'Tóm tắt các tin nhắn gần đây trong kênh' },
    ],
  },
  {
    id: 'fun',
    label: 'Giải trí',
    emoji: '🔮',
    commands: [
      { usage: '/tarot [số lá] [câu hỏi]', desc: 'Bói bài Tarot — rút bài & luận giải bằng AI' },
      { usage: '/ship <người ấy> [người 2]', desc: 'Đo độ hợp % giữa hai người' },
    ],
  },
  {
    id: 'voice',
    label: 'Giọng nói',
    emoji: '🔊',
    commands: [
      { usage: '/tts <nội dung> [giọng]', desc: 'Đọc văn bản trong kênh thoại (Google/Gemini)' },
      { usage: '/leave', desc: 'Cho bot rời khỏi kênh thoại' },
    ],
  },
  {
    id: 'music',
    label: 'Âm nhạc',
    emoji: '🎵',
    commands: [
      { usage: '/play <truy vấn>', desc: 'Phát nhạc từ URL (YouTube, SoundCloud, Spotify) hoặc tìm kiếm' },
      { usage: '/pause', desc: 'Tạm dừng nhạc đang phát' },
      { usage: '/resume', desc: 'Tiếp tục nhạc đang tạm dừng' },
      { usage: '/skip', desc: 'Bỏ qua bài hát hiện tại' },
      { usage: '/stop', desc: 'Dừng nhạc, xoá hàng chờ và rời kênh thoại' },
      { usage: '/queue', desc: 'Xem danh sách bài hát trong hàng chờ' },
    ],
  },
  {
    id: 'admin',
    label: 'Cấu hình & Thống kê',
    emoji: '⚙️',
    commands: [
      { usage: '/config view|set', desc: 'Xem & chỉnh cấu hình server (cần quyền Manage Server)' },
      { usage: '/stats', desc: 'Thống kê sử dụng của bot' },
      { usage: '/reset-memory', desc: 'Xoá bộ nhớ hội thoại của bạn trong ngữ cảnh hiện tại' },
    ],
  },
  {
    id: 'help',
    label: 'Trợ giúp',
    emoji: '❓',
    commands: [
      { usage: '/help', desc: 'Xem danh sách toàn bộ lệnh' },
      { usage: '/menu', desc: 'Menu lệnh tương tác (chọn nhóm để xem)' },
    ],
  },
];

const SELECT_ID = 'menu:category';

function categoryLines(category: CommandCategory): string {
  return category.commands.map((c) => `\`${c.usage}\`\n→ ${c.desc}`).join('\n\n');
}

/** Full, static list of every command grouped by category (for `/help`). */
export function buildHelpEmbed(): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📖 Danh sách lệnh')
    .setDescription('Tất cả lệnh của AI Assistant. Dùng `/menu` để xem theo nhóm tương tác.');
  for (const category of COMMAND_CATEGORIES) {
    embed.addFields({
      name: `${category.emoji} ${category.label}`,
      value: category.commands.map((c) => `\`${c.usage}\` — ${c.desc}`).join('\n'),
    });
  }
  embed.setFooter({ text: 'Mẹo: gõ "/" trong khung chat để Discord gợi ý lệnh.' });
  return embed;
}

/** Overview shown when `/menu` is first opened. */
export function buildMenuOverviewEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📋 Menu lệnh')
    .setDescription(
      'Chọn một nhóm lệnh ở menu bên dưới để xem chi tiết.\n\n' +
        COMMAND_CATEGORIES.map((c) => `${c.emoji} **${c.label}** — ${c.commands.length} lệnh`).join(
          '\n',
        ),
    )
    .setFooter({ text: 'AI Assistant · /help để xem tất cả cùng lúc' });
}

/** Detail embed for one category (after a select). */
export function buildCategoryEmbed(categoryId: string): EmbedBuilder {
  const category = COMMAND_CATEGORIES.find((c) => c.id === categoryId) ?? COMMAND_CATEGORIES[0]!;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${category.emoji} ${category.label}`)
    .setDescription(categoryLines(category))
    .setFooter({ text: 'Chọn nhóm khác ở menu bên dưới · /help để xem tất cả' });
}

/** The category dropdown. `selected` marks the current category as default. */
export function buildMenuRow(selected?: string): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder('Chọn nhóm lệnh…')
    .addOptions(
      COMMAND_CATEGORIES.map((c) => ({
        label: c.label,
        value: c.id,
        emoji: c.emoji,
        description: `${c.commands.length} lệnh`,
        default: c.id === selected,
      })),
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

/** Handle a category selection from `/menu`. */
export async function handleMenuSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId !== SELECT_ID) return;
  const categoryId = interaction.values[0];
  if (!categoryId) return;
  await interaction.update({
    embeds: [buildCategoryEmbed(categoryId)],
    components: [buildMenuRow(categoryId)],
  });
}
