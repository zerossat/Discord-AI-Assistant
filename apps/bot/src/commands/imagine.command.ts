import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const imagineCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.IMAGINE)
    .setDescription('Tạo hình ảnh nghệ thuật bằng AI — Generate AI art from prompt')
    .addStringOption((option) =>
      option
        .setName('prompt')
        .setDescription('Mô tả hình ảnh bạn muốn tạo / Image description')
        .setRequired(true)
        .setMaxLength(1000),
    )
    .addStringOption((option) =>
      option
        .setName('style')
        .setDescription('Phong cách nghệ thuật / Art style')
        .setRequired(false)
        .addChoices(
          { name: 'Cyberpunk', value: 'Cyberpunk' },
          { name: 'Anime', value: 'Anime' },
          { name: 'Realistic Photo', value: 'Realistic' },
          { name: 'Digital Art', value: 'Digital Art' },
          { name: 'Fantasy Oil Painting', value: 'Oil Painting' },
          { name: '3D Render', value: '3D Render' },
        ),
    ),
  async execute(interaction, services) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    const prompt = interaction.options.getString('prompt', true);
    const style = interaction.options.getString('style') ?? undefined;

    try {
      const res = await services.image.generateImage({ prompt, style });

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🎨 Sáng tạo Hình ảnh AI')
        .setDescription(`**Mô tả gốc:** ${prompt}${style ? `\n**Phong cách:** \`${style}\`` : ''}`)
        .addFields({
          name: '🔍 Prompt đã tinh chỉnh (AI Enhanced)',
          value: `\`\`\`${res.enhancedPrompt.slice(0, 500)}\`\`\``,
        })
        .setImage(res.imageUrl)
        .setFooter({
          text: `Yêu cầu bởi ${interaction.user.username} · Gemini & Pollinations AI`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        content: '⚠️ Không thể khởi tạo hình ảnh. Vui lòng thử lại sau giây lát!',
      });
    }
  },
};
