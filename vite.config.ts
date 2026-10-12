import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * Dev server only: lets the ?capture-guide-images page save the pictures it renders into
 * public/guide-images. Accepts only simple file names, and only POSTs.
 */
function guideImageWriter(): Plugin {
  const dir = join(import.meta.dirname, 'public', 'guide-images')
  return {
    name: 'guide-image-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__guide-images', (req, res) => {
        const name = new URL(req.url ?? '', 'http://localhost').searchParams.get('name') ?? ''
        if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(name)) {
          res.statusCode = 400
          res.end()
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          mkdirSync(dir, { recursive: true })
          writeFileSync(join(dir, `${name}.webp`), Buffer.concat(chunks))
          res.end('ok')
        })
      })
    },
  }
}

// GitLab Pages serves projects from https://<user>.gitlab.io/<repo-name>/, so asset URLs need
// that prefix. CI derives BASE_PATH from $CI_PAGES_URL; set it yourself to override locally.
// Dev and preview use the same base, so they mirror the deployed site.
const base = process.env.BASE_PATH || '/Rubik/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), guideImageWriter()],
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
