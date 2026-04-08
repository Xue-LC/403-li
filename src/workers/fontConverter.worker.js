// fontConverter.worker.js - Web Worker for font compression
// Runs woff2-encoder in a separate thread to avoid blocking the main UI

import { compress } from 'woff2-encoder'

// Helper to send step updates
function sendStep(id, fileName, stepId, stepName, status, detail = '') {
  self.postMessage({
    type: 'step',
    id,
    fileName,
    stepId,
    stepName,
    status,
    detail
  })
}

// Worker message handler
self.onmessage = async function(e) {
  const { id, fileData, fileName, fileIndex, totalFiles } = e.data
  const fileSizeMB = (fileData.byteLength / (1024 * 1024)).toFixed(1)

  try {
    // Step 1: Read file (already done in main thread, just report)
    sendStep(id, fileName, 'read', '读取文件', 'active', `${fileSizeMB} MB`)
    sendStep(id, fileName, 'read', '读取文件', 'done', `${fileSizeMB} MB`)

    // Step 2: Preprocess font data
    sendStep(id, fileName, 'preprocess', '预处理字体数据', 'active')
    const fontData = new Uint8Array(fileData)
    sendStep(id, fileName, 'preprocess', '预处理字体数据', 'done')

    // Step 3: Compression
    sendStep(id, fileName, 'compress', 'Brotli 压缩', 'active')
    const compressed = await compress(fontData)
    const compressedSizeMB = (compressed.length / (1024 * 1024)).toFixed(1)
    sendStep(id, fileName, 'compress', 'Brotli 压缩', 'done', `${compressedSizeMB} MB`)

    // Step 4: Complete
    sendStep(id, fileName, 'complete', '完成', 'done')

    // Send success result with transferable buffer for performance
    self.postMessage({
      type: 'success',
      id,
      fileName,
      fileIndex,
      totalFiles,
      result: compressed,
      compressedSize: compressed.length,
      originalSize: fileData.byteLength,
      message: `完成: ${fileName}`
    }, [compressed.buffer])

  } catch (error) {
    // Mark current step as error
    sendStep(id, fileName, 'error', '转换失败', 'error', error.message)
    
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
