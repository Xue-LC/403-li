import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  assetsInclude: ['**/*.flf', '**/*.wasm'],
  optimizeDeps: {
    exclude: ['woff2-encoder']
  },
  // Ensure WASM files are handled correctly
  assetsInlineLimit: 0, // Don't inline assets below this size
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/workers/[name].[hash].js',
        chunkFileNames: 'assets/workers/[name].[hash].js'
      }
    }
  }
})