import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '@daa/shared';
import type { Command } from './types';

export const queueCommand: Command = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAMES.QUEUE)
    .setDescription('📋 Xem danh sách hàng chờ bài hát')
    .setDMPermission(false),
  async execute(interaction, services) {
    if (!interaction.guildId) return;

    const session = services.music.getSession(interaction.guildId);
    if (!session || (!session.currentSong && session.queue.length === 0)) {
      await interaction.reply({
        content: '❌ Hàng chờ hiện tại đang trống.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder().setTitle('📋 Danh sách nhạc chờ phát').setColor(0x5865f2);

    const description: string[] = [];

    if (session.currentSong) {
      description.push(`**Đang phát:**`);
      description.push(
        `🎵 **[${session.currentSong.title}](${session.currentSong.url})** | \`${session.currentSong.duration}\` (Yêu cầu bởi: \`${session.currentSong.requester}\`)`,
      );
      description.push('');
    }

    if (session.queue.length > 0) {
      description.push(`**Bài hát tiếp theo:**`);
      const list = session.queue.slice(0, 10).map((song, i) => {
        return `\`${i + 1}.\` **[${song.title}](${song.url})** | \`${song.duration}\` (Yêu cầu bởi: \`${song.requester}\`)`;
      });
      description.push(...list);

      if (session.queue.length > 10) {
        description.push(`...và còn **${session.queue.length - 10}** bài hát khác.`);
      }
    } else {
      description.push('Không còn bài hát nào tiếp theo trong hàng chờ.');
    }

    embed.setDescription(description.join('\n'));
    await interaction.reply({ embeds: [embed] });
  },
};
