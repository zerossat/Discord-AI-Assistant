import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Allow a single root-level .env to drive local dev for the whole monorepo.
dotenv.config({ path: path.join(dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server output for Docker.
  output: process.env.NEXT_STANDALONE ? 'standalone' : undefined,
  // The dashboard imports the TypeScript source of @daa/shared directly.
  transpilePackages: ['@daa/shared'],
  // Correct dependency tracing in a pnpm monorepo.
  outputFileTracingRoot: path.join(dirname, '../../'),
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.discordapp.com' }],
  },
};

export default nextConfig;
