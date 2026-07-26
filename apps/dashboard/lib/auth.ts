import type { NextAuthOptions, Profile } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

interface DiscordProfile extends Profile {
  id?: string;
  username?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'identify email guilds' } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'discord-ai-assistant-secret-key-2026',
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        const p = profile as DiscordProfile;
        token.discordId = p.id;
        token.username = p.username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
