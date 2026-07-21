import { defineConfig } from 'tsup';

// Optional production bundle. Local dev and Docker run the bot directly with
// `tsx`, so a build step is not strictly required — but `pnpm build` produces
// a self-contained ESM bundle in `dist/` for environments that prefer it.
export default defineConfig({
  entry: ['src/index.ts', 'src/deploy-commands.ts'],
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  dts: false,
  // Bundle the internal workspace package (it ships TypeScript source).
  noExternal: ['@daa/shared'],
});
