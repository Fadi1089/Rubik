import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitLab Pages serves projects from https://<user>.gitlab.io/<repo-name>/, so asset URLs need
// that prefix. CI derives BASE_PATH from $CI_PAGES_URL; set it yourself to override locally.
// Dev and preview use the same base, so they mirror the deployed site.
const base = process.env.BASE_PATH || '/Rubik/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Keep the big, rarely-changing libraries in their own cacheable chunks.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
