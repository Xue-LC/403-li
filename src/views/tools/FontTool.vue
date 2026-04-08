<template>
  <div class="font-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔤 字体转换</span>
        <span>TTF/OTF → WOFF2</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <!-- 文件上传区域 -->
          <div class="upload-area" 
               @dragover.prevent="dragOver = true"
               @dragleave.prevent="dragOver = false"
               @drop.prevent="handleDrop"
               :class="{ 'drag-over': dragOver }"
               @click="$refs.fileInput.click()">
            <input 
              ref="fileInput"
              type="file" 
              accept=".ttf,.otf,.woff"
              multiple
              @change="handleFileSelect"
              style="display: none"
            />
            <div class="upload-content">
              <span class="upload-icon">📁</span>
              <span class="upload-text">点击或拖拽上传字体文件</span>
              <span class="upload-hint">支持 TTF, OTF, WOFF 格式</span>
            </div>
          </div>

          <!-- 文件列表 -->
          <div v-if="files.length > 0" class="file-list">
            <div class="file-list-header">
              <span>转换文件 ({{ files.length }})</span>
              <button class="clear-btn" @click="clearAll">清空</button>
            </div>
            <div v-for="(file, index) in files" :key="file.id" class="file-item">
              <div class="file-info">
                <span class="file-name">{{ file.status === 'done' ? file.outputName : file.name }}</span>
                <span v-if="file.status === 'done' && file.convertedSize" class="file-size">
                  {{ formatSize(file.convertedSize) }}
                  <span class="file-size-original">(原 {{ formatSize(file.size) }})</span>
                </span>
                <span v-else class="file-size">{{ formatSize(file.size) }}</span>
              </div>
              <div class="file-actions">
                <span v-if="file.status === 'pending'" class="file-status">待转换</span>
                <span v-if="file.status === 'converting'" class="file-status converting">转换中...</span>
                <span v-if="file.status === 'done'" class="file-status done">✓ 完成</span>
                <span v-if="file.status === 'error'" class="file-status error">✗ 失败</span>
                <button v-if="file.status === 'pending'" class="remove-btn" @click="removeFile(index)">✕</button>
                <button v-if="file.status === 'done'" class="download-btn" @click="downloadFile(file)">⬇ 下载</button>
              </div>
            </div>
          </div>

          <!-- 转换步骤详情 -->
          <div v-if="conversionSteps.length > 0" class="steps-section">
            <div class="steps-title">转换进度</div>
            <div class="steps-list">
              <div v-for="step in conversionSteps" :key="step.id" 
                   class="step-item" 
                   :class="{ 'step-active': step.status === 'active', 'step-done': step.status === 'done', 'step-error': step.status === 'error' }">
                <span class="step-indicator">
                  <span v-if="step.status === 'pending'" class="step-dot">○</span>
                  <span v-else-if="step.status === 'active'" class="step-spinner">⏳</span>
                  <span v-else-if="step.status === 'done'" class="step-check">✓</span>
                  <span v-else-if="step.status === 'error'" class="step-error-icon">✗</span>
                </span>
                <span class="step-name">{{ step.name }}</span>
                <span v-if="step.detail" class="step-detail">({{ step.detail }})</span>
              </div>
            </div>
          </div>

          <!-- 转换进度条 -->
          <div v-if="progress > 0 || isAnimating" class="progress-section">
            <div class="progress-header">
              <span class="progress-label">{{ progressText }}</span>
              <span class="progress-percent">{{ isAnimating ? '...' : progress + '%' }}</span>
            </div>
            <div class="progress-bar-container">
              <span class="progress-bracket">[</span>
              <span class="progress-blocks" :class="{ 'progress-animated': isAnimating }">{{ progressBlocks }}</span>
              <span class="progress-bracket">]</span>
            </div>
          </div>

          <!-- 转换按钮 -->
          <div v-if="hasPendingFiles" class="convert-section">
            <button class="convert-btn" @click="convertAll" :disabled="converting">
              <span v-if="converting">转换中...</span>
              <span v-else>开始转换 ({{ pendingCount }}个文件)</span>
            </button>
          </div>

          <!-- 转换结果统计 -->
          <div v-if="completedCount > 0" class="stats-section">
            <div class="stats-title">转换统计</div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">原始大小</span>
                <span class="stat-value">{{ formatSize(totalOriginalSize) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">压缩后</span>
                <span class="stat-value">{{ formatSize(totalConvertedSize) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">压缩率</span>
                <span class="stat-value" :class="getCompressionClass()">{{ compressionRatio }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">节省</span>
                <span class="stat-value saved">{{ formatSize(totalOriginalSize - totalConvertedSize) }}</span>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="status-error">
            ❌ {{ error }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 字体转换工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'FontTool',
  components: {
    Topbar
  },
  data() {
    return {
      files: [],
      dragOver: false,
      converting: false,
      error: '',
      nextId: 1,
      progress: 0,
      progressText: '',
      isAnimating: false,
      completedCountCurrent: 0,
      totalCountCurrent: 0,
      worker: null,
      conversionSteps: [],
      currentFileId: null
    }
  },
  mounted() {
    // Initialize Web Worker
    this.initWorker()
  },
  beforeUnmount() {
    // Clean up worker
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  },
  computed: {
    hasPendingFiles() {
      return this.files.some(f => f.status === 'pending')
    },
    pendingCount() {
      return this.files.filter(f => f.status === 'pending').length
    },
    completedCount() {
      return this.files.filter(f => f.status === 'done').length
    },
    totalOriginalSize() {
      return this.files
        .filter(f => f.status === 'done')
        .reduce((sum, f) => sum + f.size, 0)
    },
    totalConvertedSize() {
      return this.files
        .filter(f => f.status === 'done' && f.convertedSize)
        .reduce((sum, f) => sum + f.convertedSize, 0)
    },
    compressionRatio() {
      if (this.totalOriginalSize === 0) return 0
      const ratio = (this.totalConvertedSize / this.totalOriginalSize) * 100
      return ratio.toFixed(1)
    },
    progressBarWidth() {
      return `${this.progress}%`
    },
    progressBlocks() {
      const totalBlocks = 20
      // 当动画激活时，显示满的进度块以配合流动动画效果
      if (this.isAnimating) {
        return '█'.repeat(totalBlocks)
      }
      const filledBlocks = Math.floor((this.progress / 100) * totalBlocks)
      return '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks)
    }
  },
  methods: {
    handleFileSelect(event) {
      const selectedFiles = Array.from(event.target.files)
      this.addFiles(selectedFiles)
      event.target.value = '' // 重置 input
    },
    handleDrop(event) {
      this.dragOver = false
      const droppedFiles = Array.from(event.dataTransfer.files)
        .filter(f => this.isValidFontFile(f.name))
      this.addFiles(droppedFiles)
    },
    isValidFontFile(filename) {
      const ext = filename.toLowerCase().split('.').pop()
      return ['ttf', 'otf', 'woff'].includes(ext)
    },
    addFiles(newFiles) {
      for (const file of newFiles) {
        if (!this.isValidFontFile(file.name)) {
          this.error = `不支持的文件格式: ${file.name}`
          setTimeout(() => this.error = '', 3000)
          continue
        }
        this.files.push({
          id: this.nextId++,
          name: file.name,
          size: file.size,
          file: file,
          status: 'pending',
          convertedSize: null,
          result: null
        })
      }
    },
    removeFile(index) {
      this.files.splice(index, 1)
    },
    clearAll() {
      this.files = []
    },
    formatSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    initSteps(fileId, fileSize) {
      // Initialize steps for a new file conversion
      const sizeStr = this.formatSize(fileSize)
      this.currentFileId = fileId
      this.conversionSteps = [
        { id: 'init', name: '初始化 Worker', status: 'done', detail: '' },
        { id: 'wasm', name: '加载 WASM 模块', status: 'done', detail: '' },
        { id: 'read', name: '读取文件', status: 'pending', detail: sizeStr },
        { id: 'preprocess', name: '预处理字体数据', status: 'pending', detail: '' },
        { id: 'compress', name: 'Brotli 压缩', status: 'pending', detail: '' },
        { id: 'complete', name: '完成', status: 'pending', detail: '' }
      ]
    },

    updateStep(stepId, status, detail = '') {
      const step = this.conversionSteps.find(s => s.id === stepId)
      if (step) {
        step.status = status
        if (detail) step.detail = detail
      }
    },

    initWorker() {
      // Create Web Worker using Vite's worker import pattern
      this.worker = new Worker(
        new URL('../../workers/fontConverter.worker.js', import.meta.url),
        { type: 'module' }
      )
      
      this.worker.onmessage = (e) => {
        const { type, id, fileName, fileIndex, totalFiles, result, compressedSize, error, message, stepId, stepName, status: stepStatus, detail } = e.data
        
        const fileInfo = this.files.find(f => f.id === id)
        if (!fileInfo && type !== 'ready') return
        
        if (type === 'ready') {
          // Worker initialized
          console.log('Worker ready')
        } else if (type === 'step') {
          // Update step status
          this.updateStep(stepId, stepStatus, detail)
        } else if (type === 'start') {
          fileInfo.status = 'converting'
          this.progressText = `正在转换 (${fileIndex + 1}/${totalFiles}): ${fileName}`
        } else if (type === 'success') {
          // result is already a Uint8Array (sliced copy from worker)
          fileInfo.result = result instanceof Uint8Array ? result : new Uint8Array(result)
          fileInfo.convertedSize = compressedSize
          fileInfo.status = 'done'
          this.completedCountCurrent++
          
          // Update progress
          this.progress = Math.floor((this.completedCountCurrent / this.totalCountCurrent) * 100)
          this.progressText = `已完成 ${this.completedCountCurrent} / 共 ${this.totalCountCurrent} 个文件`
          
          // Generate output filename
          const baseName = fileInfo.name.replace(/\.[^.]+$/, '')
          fileInfo.outputName = baseName + '.woff2'
          
          // Clear steps after a delay
          setTimeout(() => {
            if (this.completedCountCurrent >= this.totalCountCurrent) {
              this.conversionSteps = []
            }
          }, 1000)
          
          // Check if all files completed
          if (this.completedCountCurrent >= this.totalCountCurrent) {
            this.finishConversion()
          }
        } else if (type === 'error') {
          fileInfo.status = 'error'
          fileInfo.error = error || '转换失败'
          this.error = `${fileName}: ${fileInfo.error}`
          this.completedCountCurrent++
          
          // Check if all files completed (even with errors)
          if (this.completedCountCurrent >= this.totalCountCurrent) {
            this.finishConversion()
          }
        }
      }
      
      this.worker.onerror = (err) => {
        console.error('Worker error:', err)
        this.error = 'Worker 发生错误: ' + err.message
        this.converting = false
        this.isAnimating = false
      }
    },
    finishConversion() {
      this.converting = false
      this.isAnimating = false
      this.progress = 100
      this.progressText = '转换完成!'
      
      // Clear after 1.5 seconds
      setTimeout(() => {
        this.progress = 0
        this.progressText = ''
        this.completedCountCurrent = 0
        this.totalCountCurrent = 0
      }, 1500)
    },
    async convertAll() {
      if (!this.worker) {
        this.error = 'Worker 未初始化'
        return
      }
      
      this.converting = true
      this.error = ''
      this.completedCountCurrent = 0
      
      const pendingFiles = this.files.filter(f => f.status === 'pending')
      this.totalCountCurrent = pendingFiles.length
      
      if (this.totalCountCurrent === 0) {
        this.converting = false
        return
      }
      
      // Initialize steps for first file
      if (pendingFiles.length > 0) {
        this.initSteps(pendingFiles[0].id, pendingFiles[0].size)
      }
      
      // Start animation
      this.isAnimating = true
      this.progress = 0
      this.progressText = `准备转换 ${this.totalCountCurrent} 个文件...`
      
      // Process all pending files through worker
      for (let i = 0; i < pendingFiles.length; i++) {
        const fileInfo = pendingFiles[i]
        
        // Initialize steps for each file
        this.initSteps(fileInfo.id, fileInfo.size)
        
        try {
          const buffer = await fileInfo.file.arrayBuffer()
          
          // Send to worker
          this.worker.postMessage({
            id: fileInfo.id,
            fileData: buffer,
            fileName: fileInfo.name,
            fileIndex: i,
            totalFiles: this.totalCountCurrent
          }, [buffer]) // Transfer buffer for performance
        } catch (err) {
          console.error('Error sending file to worker:', err)
          fileInfo.status = 'error'
          fileInfo.error = err.message || '发送文件失败'
          this.error = `${fileInfo.name}: ${fileInfo.error}`
          this.completedCountCurrent++
          
          if (this.completedCountCurrent >= this.totalCountCurrent) {
            this.finishConversion()
          }
        }
      }
    },
    downloadFile(fileInfo) {
      if (!fileInfo.result) return
      
      const blob = new Blob([fileInfo.result], { type: 'font/woff2' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileInfo.outputName || 'font.woff2'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    getCompressionClass() {
      const ratio = parseFloat(this.compressionRatio)
      if (ratio < 50) return 'excellent'
      if (ratio < 70) return 'good'
      return 'normal'
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';

.font-tool {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

/* === Upload Area === */
.upload-area {
  border: 2px dashed var(--line);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--green);
  background: rgba(157, 255, 107, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-text {
  color: var(--text);
  font-size: 14px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
}

/* === File List === */
.file-list {
  margin-top: 1.5rem;
  border: 1px solid var(--line);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
  background: rgba(18, 22, 27, 0.94);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.clear-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
  padding: 4px 12px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 11px;
  transition: all 0.2s;
}

.clear-btn:hover {
  border-color: var(--red);
  color: var(--red);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  color: var(--text);
  font-size: 13px;
  word-break: break-all;
}

.file-size {
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
}

.file-size-original {
  color: var(--muted);
  text-decoration: line-through;
  opacity: 0.6;
  margin-left: 4px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-status {
  font-size: 12px;
  font-family: var(--mono);
  color: var(--muted);
}

.file-status.converting {
  color: #ffd467;
}

.file-status.done {
  color: var(--green);
}

.file-status.error {
  color: var(--red);
}

.remove-btn,
.download-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text);
  padding: 4px 10px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 11px;
  transition: all 0.2s;
}

.remove-btn:hover {
  border-color: var(--red);
  color: var(--red);
}

.download-btn {
  border-color: var(--green);
  color: var(--green);
}

.download-btn:hover {
  background: rgba(157, 255, 107, 0.1);
}

/* === Progress Section === */
.progress-section {
  margin-top: 1.5rem;
  border: 1px solid var(--line);
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 12px;
}

.progress-label {
  color: var(--text);
}

.progress-percent {
  color: var(--green);
  font-weight: 600;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--mono);
  font-size: 14px;
}

.progress-bracket {
  color: var(--muted);
}

.progress-blocks {
  color: var(--green);
  letter-spacing: 0;
  line-height: 1;
}

/* CSS 动画进度条 - 模拟流动效果 */
.progress-animated {
  background: linear-gradient(
    90deg,
    var(--green) 0%,
    var(--green) 30%,
    rgba(157, 255, 107, 0.3) 50%,
    var(--green) 70%,
    var(--green) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: progress-flow 1.2s linear infinite;
}

@keyframes progress-flow {
  0% {
    background-position: 100% 0%;
  }
  100% {
    background-position: -100% 0%;
  }
}

/* === Convert Section === */
.convert-section {
  margin-top: 1.5rem;
}

.convert-btn {
  width: 100%;
  padding: 0.875rem;
  background: var(--green);
  color: #000;
  border: none;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.convert-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* === Stats Section === */
.stats-section {
  margin-top: 1.5rem;
  border: 1px solid var(--line);
  padding: 1rem;
}

.stats-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--mono);
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  color: var(--text);
  font-weight: 600;
}

.stat-value.excellent {
  color: var(--green);
}

.stat-value.good {
  color: #ffd467;
}

.stat-value.saved {
  color: var(--green);
}

/* === Steps Section === */
.steps-section {
  margin-top: 1.5rem;
  border: 1px solid var(--line);
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.steps-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  padding: 0.25rem 0;
}

.step-item.step-done {
  color: var(--green);
}

.step-item.step-active {
  color: var(--text);
}

.step-item.step-error {
  color: var(--red);
}

.step-indicator {
  width: 16px;
  text-align: center;
}

.step-dot {
  color: var(--muted);
}

.step-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.step-check {
  color: var(--green);
}

.step-error-icon {
  color: var(--red);
}

.step-name {
  flex: 1;
}

.step-detail {
  color: var(--muted);
  font-size: 11px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* === Status Error === */
.status-error {
  color: var(--red);
  margin-top: 1.25rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 107, 125, 0.3);
  background: rgba(255, 107, 125, 0.05);
}

/* === Responsive === */
@media (max-width: 640px) {
  .font-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>