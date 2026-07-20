import { Readable } from 'node:stream';
import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  type AudioPlayer,
} from '@discordjs/voice';
import type { VoiceBasedChannel } from 'discord.js';

/** One reusable audio player per guild, kept alive while the bot stays in voice. */
const players = new Map<string, AudioPlayer>();

/**
 * Join (or reuse) the user's voice channel, play `audio`, and STAY connected.
 * The bot leaves only when the channel empties (voiceState event) or `/leave`.
 */
export async function speak(channel: VoiceBasedChannel, audio: Buffer): Promise<void> {
  const guildId = channel.guild.id;

  let connection = getVoiceConnection(guildId);
  let isNewConnection = false;
  if (!connection || connection.joinConfig.channelId !== channel.id) {
    const conn = joinVoiceChannel({
      channelId: channel.id,
      guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    // Try to recover from transient drops; give up (leave) if it can't.
    conn.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(conn, VoiceConnectionStatus.Signalling, 5_000),
          entersState(conn, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        leave(guildId);
      }
    });
    connection = conn;
    isNewConnection = true;
  }
  if (!connection) throw new Error('Không tạo được kết nối thoại');

  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

  let player = players.get(guildId);
  if (!player) {
    player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    player.on('error', () => {
      /* swallow — a bad clip shouldn't crash the bot */
    });
    players.set(guildId, player);
    connection.subscribe(player);
  } else if (isNewConnection) {
    connection.subscribe(player);
  }

  player.play(createAudioResource(Readable.from(audio)));
  await entersState(player, AudioPlayerStatus.Playing, 10_000);
  // Intentionally NOT destroying the connection — the bot stays in the channel.
}

/** Leave the guild's voice channel and forget its player. Returns false if not connected. */
export function leave(guildId: string): boolean {
  const player = players.get(guildId);
  if (player) {
    try {
      player.stop(true);
    } catch {
      /* noop */
    }
    players.delete(guildId);
  }
  const connection = getVoiceConnection(guildId);
  if (!connection) return false;
  try {
    connection.destroy();
  } catch {
    /* already destroyed */
  }
  return true;
}
