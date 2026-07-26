import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';
import type { GuildSettingsPatch } from '../database/repositories';
import { LANGUAGE_CHOICES, MODEL_CHOICES } from '../utils/choices';

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.CONFIG)
    .setDescription('Xem & chỉnh cấu hình bot cho server (admin)')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) => sc.setName('view').setDescription('Xem cấu hình hiện tại'))
    .addSubcommand((sc) =>
      sc
        .setName('set')
        .setDescription('Cập nhật cấu hình')
        .addStringOption((o) =>
          o
            .setName('model')
            .setDescription('AI model (vd: gemini-2.5-flash, gemini-3.6-pro...)')
            .setAutocomplete(true),
        )
        .addStringOption((o) =>
          o
            .setName('language')
            .setDescription('Ngôn ngữ mặc định')
            .addChoices(...LANGUAGE_CHOICES),
        )
        .addStringOption((o) =>
          o.setName('prefix').setDescription('Prefix lệnh (legacy)').setMaxLength(5),
        )
        .addBooleanOption((o) =>
          o.setName('memory').setDescription('Bật/tắt ghi nhớ hội thoại'),
        )
        .addIntegerOption((o) =>
          o
            .setName('summary-limit')
            .setDescription('Số tin nhắn mặc định cho /summary')
            .setMinValue(10)
            .setMaxValue(100),
        ),
    ),
  async execute(interaction, services) {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: 'Lệnh này chỉ dùng được trong server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.options.getSubcommand() === 'view') {
      const s = await services.repositories.settings.getOrCreate(guildId);
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Cấu hình bot')
        .setColor(0x5865f2)
        .addFields(
          { name: 'AI Model', value: `\`${s.aiModel}\``, inline: true },
          { name: 'Ngôn ngữ', value: `\`${s.language}\``, inline: true },
          { name: 'Prefix', value: `\`${s.prefix}\``, inline: true },
          { name: 'Ghi nhớ', value: s.memoryEnabled ? '✅ Bật' : '❌ Tắt', inline: true },
          { name: 'Summary limit', value: String(s.summaryMessageLimit), inline: true },
        );
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const patch: GuildSettingsPatch = {};
    const model = interaction.options.getString('model');
    const language = interaction.options.getString('language');
    const prefix = interaction.options.getString('prefix');
    const memory = interaction.options.getBoolean('memory');
    const summaryLimit = interaction.options.getInteger('summary-limit');
    if (model) patch.aiModel = model;
    if (language) patch.language = language;
    if (prefix) patch.prefix = prefix;
    if (memory !== null) patch.memoryEnabled = memory;
    if (summaryLimit !== null) patch.summaryMessageLimit = summaryLimit;

    if (Object.keys(patch).length === 0) {
      await interaction.reply({
        content: 'Bạn chưa cung cấp thay đổi nào.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updated = await services.repositories.settings.update(guildId, patch);
    await interaction.reply({
      content:
        '✅ Đã cập nhật cấu hình:\n' +
        `• Model: \`${updated.aiModel}\`\n` +
        `• Ngôn ngữ: \`${updated.language}\`\n` +
        `• Prefix: \`${updated.prefix}\`\n` +
        `• Ghi nhớ: ${updated.memoryEnabled ? 'bật' : 'tắt'}\n` +
        `• Summary limit: ${updated.summaryMessageLimit}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
