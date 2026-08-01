import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import play from 'play-dl';
import type { Logger } from '../utils/logger';

export interface Song {
  title: string;
  url: string;
  duration: string; // e.g. "3:45"
  thumbnail: string;
  requester: string;
}

export interface GuildMusicSession {
  guildId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
  queue: Song[];
  currentSong: Song | null;
  isPaused: boolean;
  textChannelId?: string; // To send messages when a song starts playing
  client?: any; // Discord client reference to send auto-announcements
}

export class MusicService {
  private readonly sessions = new Map<string, GuildMusicSession>();

  constructor(private readonly logger?: Logger) {
    const ytCookie = process.env.YOUTUBE_COOKIE;
    if (ytCookie) {
      try {
        play.setToken({
          youtube: {
            cookie: ytCookie.trim(),
          },
        });
        this.logger?.info('✅ Đã nạp YouTube Cookie để bỏ qua kiểm tra bot.');
      } catch (err) {
        this.logger?.error({ err }, 'Không thể nạp YouTube Cookie cho play-dl');
      }
    }

    // Auto-fetch SoundCloud client ID for fallback
    play
      .getFreeClientID()
      .then((id) => {
        play.setToken({
          soundcloud: {
            client_id: id,
          },
        });
        this.logger?.info('✅ Đã nạp SoundCloud Client ID tự động.');
      })
      .catch((err) => {
        this.logger?.warn({ err }, 'Không thể tự động lấy SoundCloud Client ID');
      });
  }

  /** Get or create a music session for a guild. */
  getSession(guildId: string): GuildMusicSession | undefined {
    return this.sessions.get(guildId);
  }

  /** Checks if a guild has an active music session. */
  hasSession(guildId: string): boolean {
    return this.sessions.has(guildId);
  }

  /** Pause playback. */
  pause(guildId: string): boolean {
    const session = this.sessions.get(guildId);
    if (!session || session.isPaused) return false;
    session.player.pause();
    session.isPaused = true;
    return true;
  }

  /** Resume playback. */
  resume(guildId: string): boolean {
    const session = this.sessions.get(guildId);
    if (!session || !session.isPaused) return false;
    session.player.unpause();
    session.isPaused = false;
    return true;
  }

  /** Skip current song. */
  skip(guildId: string): boolean {
    const session = this.sessions.get(guildId);
    if (!session) return false;

    if (session.player.state.status === AudioPlayerStatus.Idle) {
      // If the player is already Idle, trigger playNext manually
      this.playNext(guildId).catch((err) => {
        this.logger?.error({ err, guildId }, 'Error skipping from Idle state');
      });
    } else {
      // Stopping the player will trigger the state change to Idle, which plays the next song.
      session.player.stop();
    }
    return true;
  }

  /** Stop playback, clear queue, and destroy connection. */
  stop(guildId: string): boolean {
    const session = this.sessions.get(guildId);
    if (!session) return false;
    session.queue = [];
    session.currentSong = null;
    try {
      session.player.stop(true);
    } catch {
      /* ignore */
    }
    try {
      session.connection.destroy();
    } catch {
      /* ignore */
    }
    this.sessions.delete(guildId);
    return true;
  }

  /** Get current queue list. */
  getQueue(guildId: string): Song[] {
    const session = this.sessions.get(guildId);
    return session ? session.queue : [];
  }

  /** Get currently playing song. */
  getCurrentSong(guildId: string): Song | null {
    const session = this.sessions.get(guildId);
    return session ? session.currentSong : null;
  }

  /** Plays music or adds it to the queue. */
  async play(
    channel: VoiceBasedChannel,
    query: string,
    requesterName: string,
    textChannelId?: string,
  ): Promise<{ addedToQueue: boolean; songs: Song[] }> {
    const guildId = channel.guild.id;
    let session = this.sessions.get(guildId);

    // 1. Resolve query/URL into list of songs.
    const resolvedSongs = await this.resolveSongs(query, requesterName);
    if (resolvedSongs.length === 0) {
      throw new Error('Không tìm thấy bài hát nào hoặc định dạng không hợp lệ.');
    }

    // 2. Get or create connection & player.
    if (!session) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this.stop(guildId);
        }
      });

      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play },
      });

      session = {
        guildId,
        connection,
        player,
        queue: [],
        currentSong: null,
        isPaused: false,
        textChannelId,
        client: channel.client,
      };

      connection.subscribe(player);
      this.sessions.set(guildId, session);

      // Set up player state listener to play next song when current finishes
      player.on(AudioPlayerStatus.Idle, () => {
        this.playNext(guildId).catch((err) => {
          this.logger?.error({ err, guildId }, 'Error playing next song');
        });
      });

      player.on('error', (err) => {
        this.logger?.error({ err, guildId }, 'AudioPlayer error');
        this.playNext(guildId).catch((err) => {
          this.logger?.error({ err, guildId }, 'Error recovery playing next song');
        });
      });
    }

    // Update text channel ID and client reference in case they changed.
    if (textChannelId) {
      session.textChannelId = textChannelId;
    }
    session.client = channel.client;

    // 3. Add to queue.
    const addedToQueue = session.currentSong !== null;
    session.queue.push(...resolvedSongs);

    // 4. Start playback if idle.
    if (!addedToQueue) {
      await this.playNext(guildId, true);
    }

    return { addedToQueue, songs: resolvedSongs };
  }

  /** Play the next song in queue. */
  private async playNext(guildId: string, isInitialPlay = false): Promise<void> {
    const session = this.sessions.get(guildId);
    if (!session) return;

    if (session.queue.length === 0) {
      session.currentSong = null;
      // We don't automatically disconnect here in case they want to queue more.
      return;
    }

    const nextSong = session.queue.shift()!;
    session.currentSong = nextSong;
    session.isPaused = false;

    try {
      // Get play-dl stream
      let stream;
      try {
        stream = await play.stream(nextSong.url);
      } catch (streamErr) {
        // If it's a YouTube URL and we failed, try SoundCloud fallback
        if (nextSong.url.includes('youtube.com') || nextSong.url.includes('youtu.be')) {
          this.logger?.warn(
            { song: nextSong.title, err: (streamErr as Error).message },
            'YouTube stream failed, trying SoundCloud fallback',
          );
          try {
            const scResults = await play.search(nextSong.title, {
              limit: 1,
              source: { soundcloud: 'tracks' },
            });
            if (scResults.length > 0) {
              const scTrack = scResults[0] as any;
              stream = await play.stream(scTrack.url);
              this.logger?.info(
                { song: nextSong.title },
                'Successfully fell back to SoundCloud stream',
              );
            } else {
              throw streamErr; // No SoundCloud result, throw original error
            }
          } catch (scErr) {
            throw streamErr; // Failed fallback, throw original error
          }
        } else {
          throw streamErr;
        }
      }

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      session.player.play(resource);
      this.logger?.info({ song: nextSong.title, guildId }, 'Started playing song');

      // Automatically announce the song to the text channel if it's not the initial play
      if (!isInitialPlay && session.textChannelId && session.client) {
        try {
          const channel = await session.client.channels.fetch(session.textChannelId);
          if (channel?.isTextBased()) {
            const embed = {
              color: 0x5865f2,
              title: '🔊 Đang phát nhạc',
              description: `**[${nextSong.title}](${nextSong.url})**`,
              fields: [
                { name: 'Thời lượng', value: nextSong.duration, inline: true },
                { name: 'Yêu cầu bởi', value: nextSong.requester, inline: true },
              ],
              thumbnail: nextSong.thumbnail ? { url: nextSong.thumbnail } : undefined,
            };
            await (channel as any).send({ embeds: [embed] });
          }
        } catch (msgErr) {
          this.logger?.warn({ msgErr }, 'Không thể gửi thông báo phát nhạc mới');
        }
      }
    } catch (err) {
      this.logger?.error({ err, song: nextSong.title, guildId }, 'Error streaming song, skipping');
      // If failed, skip to next song
      await this.playNext(guildId, isInitialPlay);
    }
  }

  /** Resolves YouTube, SoundCloud, Spotify, or text query into Song objects. */
  private async resolveSongs(query: string, requester: string): Promise<Song[]> {
    const trimmed = query.trim();

    // Determine link type
    const validation = await play.validate(trimmed);

    // 1. YouTube Video
    if (validation === 'yt_video') {
      const info = await play.video_info(trimmed);
      return [
        {
          title: info.video_details.title || 'YouTube Video',
          url: getVideoUrl(info.video_details),
          duration: info.video_details.durationRaw || '0:00',
          thumbnail: info.video_details.thumbnails[0]?.url || '',
          requester,
        },
      ];
    }

    // 2. YouTube Playlist
    if (validation === 'yt_playlist') {
      const playlist = await play.playlist_info(trimmed, { incomplete: true });
      const videos = await playlist.all_videos();
      return videos.map((video) => ({
        title: video.title || 'YouTube Video',
        url: getVideoUrl(video),
        duration: video.durationRaw || '0:00',
        thumbnail: video.thumbnails[0]?.url || '',
        requester,
      }));
    }

    // 3. SoundCloud Track
    if (validation === 'so_track') {
      const info = await play.soundcloud(trimmed);
      const soTrack = info as any;
      return [
        {
          title: soTrack.name,
          url: soTrack.url,
          duration: formatSeconds(soTrack.durationInSec),
          thumbnail: soTrack.thumbnail || '',
          requester,
        },
      ];
    }

    // 4. Spotify Track
    if (validation === 'sp_track') {
      const info = await play.spotify(trimmed);
      const spTrack = info as any;
      const searchQuery = `${spTrack.name} ${spTrack.artists.map((a: any) => a.name).join(' ')}`;
      try {
        const searchResult = await play.search(searchQuery, {
          limit: 1,
          source: { youtube: 'video' },
        });
        if (searchResult.length === 0) {
          throw new Error(`Không thể tìm thấy bài hát Spotify '${spTrack.name}' trên YouTube.`);
        }
        const video = searchResult[0]!;
        return [
          {
            title: spTrack.name + ` (${spTrack.artists.map((a: any) => a.name).join(', ')})`,
            url: getVideoUrl(video),
            duration: video.durationRaw || '0:00',
            thumbnail: spTrack.thumbnail?.url || video.thumbnails[0]?.url || '',
            requester,
          },
        ];
      } catch (err) {
        this.logger?.warn(
          { err, searchQuery },
          'Spotify track search on YouTube failed, trying SoundCloud fallback',
        );
        const scResults = await play.search(searchQuery, {
          limit: 1,
          source: { soundcloud: 'tracks' },
        });
        if (scResults.length === 0) {
          throw new Error(
            `Không thể tìm thấy bài hát Spotify '${spTrack.name}' trên cả YouTube lẫn SoundCloud.`,
          );
        }
        const track = scResults[0] as any;
        return [
          {
            title: spTrack.name + ` (${spTrack.artists.map((a: any) => a.name).join(', ')})`,
            url: track.url,
            duration: formatSeconds(track.durationInSec),
            thumbnail: spTrack.thumbnail?.url || track.thumbnail || '',
            requester,
          },
        ];
      }
    }

    // 5. Spotify Playlist / Album
    if (validation === 'sp_playlist' || validation === 'sp_album') {
      const info = await play.spotify(trimmed);
      const spData = info as any;
      const tracks = await spData.all_tracks();
      const songs: Song[] = [];

      // Limit to first 30 tracks to prevent rate limit blocks during deployment
      const tracksToProcess = tracks.slice(0, 30);
      for (const track of tracksToProcess) {
        const searchQuery = `${track.name} ${track.artists.map((a: any) => a.name).join(' ')}`;
        const searchResult = await play.search(searchQuery, {
          limit: 1,
          source: { youtube: 'video' },
        });
        if (searchResult.length > 0) {
          const video = searchResult[0]!;
          songs.push({
            title: track.name + ` (${track.artists.map((a: any) => a.name).join(', ')})`,
            url: getVideoUrl(video),
            duration: video.durationRaw || '0:00',
            thumbnail: track.thumbnail?.url || video.thumbnails[0]?.url || '',
            requester,
          });
        }
      }
      return songs;
    }

    // 6. Generic search query (fallback to YouTube video search)
    try {
      const searchResult = await play.search(trimmed, {
        limit: 1,
        source: { youtube: 'video' },
      });
      if (searchResult.length > 0) {
        const video = searchResult[0]!;
        return [
          {
            title: video.title || 'YouTube Video',
            url: getVideoUrl(video),
            duration: video.durationRaw || '0:00',
            thumbnail: video.thumbnails[0]?.url || '',
            requester,
          },
        ];
      }
    } catch (err) {
      this.logger?.warn({ err, query }, 'YouTube search failed, falling back to SoundCloud search');
      const scResults = await play.search(trimmed, {
        limit: 1,
        source: { soundcloud: 'tracks' },
      });
      if (scResults.length > 0) {
        const track = scResults[0] as any;
        return [
          {
            title: track.name || 'SoundCloud Track',
            url: track.url,
            duration: formatSeconds(track.durationInSec),
            thumbnail: track.thumbnail || '',
            requester,
          },
        ];
      }
    }

    return [];
  }
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function getVideoUrl(video: any): string {
  return video?.url || (video?.id ? `https://www.youtube.com/watch?v=${video.id}` : '');
}
