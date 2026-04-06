import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    // Disable caching in development
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Generate manifest for cache busting
    manifest: true,
    // Ensure content hashes in filenames
    rollupOptions: {
      output: {
        // Add content hash to entry files
        entryFileNames: 'assets/[name]-[hash].js',
        // Add content hash to chunk files
        chunkFileNames: 'assets/[name]-[hash].js',
        // Add content hash to asset files (css, images, etc.)
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Use fixed cache directory to avoid HMR issues
  cacheDir: 'node_modules/.vite',
})
