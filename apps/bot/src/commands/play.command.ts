import { EmbedBuilder, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.PLAY)
    .setDescription('🔊 Phát nhạc từ link (YouTube, SoundCloud, Spotify) hoặc tìm kiếm')
    .addStringOption((o) =>
      o
        .setName('query')
        .setDescription('Đường dẫn bài hát/danh sách phát hoặc từ khóa tìm kiếm')
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction, services) {
    const member = interaction.member instanceof GuildMember ? interaction.member : null;
    const channel = member?.voice.channel ?? null;
    if (!interaction.guild || !channel) {
      await interaction.reply({
        content: '🔇 Bạn cần vào một **kênh thoại** trước khi dùng lệnh `/play` nhé.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();
    const query = interaction.options.getString('query', true);
    const requester = member?.displayName || interaction.user.username;

    try {
      const result = await services.music.play(channel, query, requester, interaction.channelId);

      const embed = new EmbedBuilder().setColor(0x5865f2);

      if (result.songs.length === 1) {
        const song = result.songs[0]!;
        embed
          .setTitle(result.addedToQueue ? '📝 Đã thêm vào danh sách phát' : '🔊 Đang phát nhạc')
          .setDescription(`**[${song.title}](${song.url})**`)
          .addFields(
            { name: 'Thời lượng', value: song.duration, inline: true },
            { name: 'Yêu cầu bởi', value: song.requester, inline: true },
          );
        if (song.thumbnail) {
          embed.setThumbnail(song.thumbnail);
        }
      } else {
        // Multiple songs (Playlist)
        embed
          .setTitle(result.addedToQueue ? '📝 Đã thêm danh sách phát' : '🔊 Đang phát danh sách')
          .setDescription(`Đã thêm **${result.songs.length}** bài hát vào danh sách phát.`)
          .addFields({ name: 'Yêu cầu bởi', value: requester, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await interaction.editReply(`⚠️ Lỗi khi phát nhạc: ${message}`);
    }
  },
};
