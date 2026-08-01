import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

const RARITY_COLORS: Record<string, number> = {
  Legendary: 0xf1c40f,
  Epic: 0x9b59b6,
  Rare: 0x3498db,
  Common: 0x95a5a6,
};

const RARITY_EMOJIS: Record<string, string> = {
  Legendary: '🌟 LEGENDARY',
  Epic: '💜 EPIC',
  Rare: '💙 RARE',
  Common: '⚪ COMMON',
};

export const gachaCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.GACHA)
    .setDescription('🃏 Quay Gacha mở Thẻ Bài Nhân Vật AI độc bản hằng ngày'),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const res = await services.gacha.rollGacha(interaction.user.id, interaction.user.username);

    if (res.isCooldown) {
      await interaction.editReply(
        `⏳ Bạn đã quay gacha hôm nay rồi! Vui lòng quay lại sau **${res.hoursRemaining} giờ** nữa để nhận lượt quay miễn phí tiếp theo nhé.`,
      );
      return;
    }

    const card = res.card;
    const embed = new EmbedBuilder()
      .setColor(RARITY_COLORS[card.rarity] || 0x3498db)
      .setTitle(`🃏 Thẻ Bài Gacha AI: ${card.name}`)
      .setDescription(`**Phẩm chất:** ${RARITY_EMOJIS[card.rarity]}\n> *"${card.description}"*`)
      .addFields(
        { name: '⚔️ Công (ATK)', value: String(card.atk), inline: true },
        { name: '🛡️ Thủ (DEF)', value: String(card.def), inline: true },
        { name: '❤️ Máu (HP)', value: String(card.hp), inline: true },
      )
      .setImage(card.imageUrl)
      .setFooter({
        text: `Sở hữu bởi ${interaction.user.username} · Dùng /cards để xem bộ sưu tập`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export const cardsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.CARDS)
    .setDescription('📦 Xem kho sưu tập Thẻ Bài Gacha AI')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng cần xem kho sưu tập')),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }

    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const user = await services.repositories.users.findByDiscordId(targetUser.id);

    const cards = user?.cards || [];
    if (cards.length === 0) {
      await interaction.editReply(
        `📦 **${targetUser.username}** chưa sở hữu thẻ bài Gacha nào. Hãy dùng \`/gacha\` để nhận lượt quay hằng ngày!`,
      );
      return;
    }

    const lines = cards
      .slice(-10)
      .reverse()
      .map((c: any) => {
        const emoji = RARITY_EMOJIS[c.rarity] || c.rarity;
        return `• **${c.name}** [${emoji}] — ⚔️ ${c.atk} | 🛡️ ${c.def} | ❤️ ${c.hp}`;
      });

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`📦 Bộ Sưu Tập Thẻ Bài — ${targetUser.username}`)
      .setDescription(
        `**Tổng số thẻ sở hữu:** ${cards.length} thẻ\n\n**10 thẻ bài mới nhất:**\n${lines.join('\n')}`,
      )
      .setFooter({ text: 'Dùng /gacha để mở thêm thẻ bài mới mỗi ngày!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
