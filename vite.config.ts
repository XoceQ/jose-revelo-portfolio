import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const normalizeBase = (value: string) => {
  const cleaned = value.replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${cleaned}/` : '/';
};

/**
 * Generates GitHub Pages helper files.
 */
function siteFiles(siteUrl: string): Plugin {
  const url = siteUrl.replace(/\/+$/, '');

  return {
    name: 'site-files',

    transformIndexHtml: (html) =>
      html.replaceAll('__SITE_URL__', url),

    closeBundle() {
      const dist = resolve(process.cwd(), 'dist');

      if (!existsSync(dist)) return;

      for (const file of ['robots.txt', 'sitemap.xml']) {
        const path = resolve(dist, file);

        if (existsSync(path)) {
          writeFileSync(
            path,
            readFileSync(path, 'utf8').replaceAll('__SITE_URL__', url)
          );
        }
      }

      copyFileSync(
        resolve(dist, 'index.html'),
        resolve(dist, '404.html')
      );

      writeFileSync(resolve(dist, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...process.env,
  };

  const base = normalizeBase(
    env.VITE_BASE_PATH ?? '/jose-revelo-portfolio/'
  );

  const siteUrl =
    env.VITE_SITE_URL ?? `https://xoceq.github.io${base}`;

  return {
    base,

    plugins: [
      react(),
      siteFiles(siteUrl),
    ],

    build: {
      target: 'es2020',
      cssCodeSplit: false,

      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['framer-motion'],
          },
        },
      },
    },
  };
});