// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://chaostocreation.com.au',

  // Static by default. Only the Keystatic admin route opts out via
  // `export const prerender = false`, so every public page ships as HTML.
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),

  integrations: [react(), markdoc(), keystatic(), sitemap()],

  // The press kit became the media kit when Research joined the navigation.
  // Emitted as a platform-level redirect by the Vercel adapter.
  redirects: { '/press/': '/media/' },

  vite: {
    plugins: [tailwindcss()],
  },

  // Self-hosted, preloaded, zero layout shift. Replaces the six Google Font
  // families the WordPress site was loading from a third-party origin.
  fonts: [
    {
      // Display. The WONK and SOFT axes give an organic quirk suited to a book
      // about biology, and it sidesteps the Playfair/Cormorant default.
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--ff-display',
      weights: ['300 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Iowan Old Style', 'Georgia', 'serif'],
    },
    {
      // Body. Cleaner and slightly more condensed than Inter.
      provider: fontProviders.google(),
      name: 'Instrument Sans',
      cssVariable: '--ff-body',
      weights: ['400 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // Specimen labels, figure numbers, ISBN/format data. Reads as instrumentation.
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--ff-mono',
      weights: ['400', '500'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'monospace'],
    },
  ],

  image: {
    responsiveStyles: true,
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
