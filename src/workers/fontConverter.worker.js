// fontConverter.worker.js - Web Worker for font compression
// Runs woff2-encoder in a separate thread to avoid blocking the main UI

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

    // Perform compression (blocking in worker, but not in main thread)
    const compressed = await compress(new Uint8Array(fileData))

    // Send success result with transferable buffer for performance
    self.postMessage({
      type: 'success',
      id,
      fileName,
      fileIndex,
      totalFiles,
      result: compressed,
      compressedSize: compressed.length,
      message: `完成: ${fileName}`
    }, [compressed.buffer])

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
