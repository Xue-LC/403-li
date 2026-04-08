// fontWorker.js - Web Worker for font compression
// This runs woff2-encoder in a separate thread to avoid blocking the main UI

// Import woff2-encoder dynamically
// Note: Vite handles worker imports specially
import { compress } from 'woff2-encoder'

// Worker message handler
self.onmessage = async function(e) {
  const { id, fileData, fileName, fileIndex, totalFiles } = e.data

  try {
    // Send start status
    self.postMessage({
      type: 'start',
      id,
      fileName,
      fileIndex,
      totalFiles,
      message: `开始转换: ${fileName}`
    })

    // Perform compression (this is blocking in the worker, but not in main thread)
    const compressed = await compress(new Uint8Array(fileData))

    // Send success result
    self.postMessage({
      type: 'success',
      id,
      fileName,
      fileIndex,
      totalFiles,
      result: compressed,
      compressedSize: compressed.length,
      message: `完成: ${fileName}`
    }, [compressed.buffer]) // Transfer ownership for performance

  } catch (error) {
    // Send error
    self.postMessage({
      type: 'error',
      id,
      fileName,
      fileIndex,
      totalFiles,
      error: error.message || '转换失败'
    })
  }
}

// Signal that worker is ready
self.postMessage({ type: 'ready' })
