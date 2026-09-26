<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 SVG Data URI 转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：输入 -->
          <div class="tool-col">
            <label class="tool-label">SVG 代码：</label>
            <textarea
              class="code-input"
              v-model="svgInput"
              rows="12"
              placeholder="粘贴 SVG 代码，例如：&#10;<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;>&#10;  <circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; fill=&quot;#9dff6b&quot; />&#10;</svg>"
              @input="onInputChange"
            ></textarea>

            <div class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".svg,image/svg+xml"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传 SVG 文件</span>
                <span class="upload-hint">仅支持 .svg 文件</span>
              </div>
            </div>

            <!-- 编码选项 -->
            <label class="tool-label">编码方式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="encodeMode" value="urlencoded" @change="onInputChange" />
                <span>URL 编码 (data:image/svg+xml,...)</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="encodeMode" value="base64" @change="onInputChange" />
                <span>Base64 (data:image/svg+xml;base64,...)</span>
              </label>
            </div>
          </div>

          <!-- 右栏：预览 + 输出 -->
          <div class="tool-col">
            <label class="tool-label">SVG 预览：</label>
            <div class="preview-wrapper">
              <div class="preview-container" v-if="svgInput.trim()">
                <img
                  :src="currentDataUri"
                  alt="SVG 预览"
                  class="preview-svg"
                  @error="previewError = true"
                  @load="previewError = false"
                />
              </div>
              <div class="preview-empty" v-else>
                <span class="preview-empty-text">粘贴 SVG 代码后实时预览</span>
              </div>
            </div>
            <div v-if="previewError" class="preview-warning">⚠️ SVG 有语法错误，无法预览</div>

            <label class="tool-label">Data URI：</label>
            <textarea
              class="code-input output"
              :value="currentDataUri"
              readonly
              rows="6"
              placeholder="转换结果将显示在这里..."
            ></textarea>

            <!-- 统计信息 -->
            <div class="stats-section" v-if="svgInput.trim()">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">原始 SVG</span>
                  <span class="stat-value">{{ formatSize(svgInput.length) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Data URI</span>
                  <span class="stat-value">{{ formatSize(currentDataUri.length) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">膨胀率</span>
                  <span class="stat-value">{{ inflationRatio }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">编码方式</span>
                  <span class="stat-value">{{ encodeMode === 'urlencoded' ? 'URL 编码' : 'Base64' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyUri" :disabled="!currentDataUri">
            📋 复制 Data URI
          </button>
          <button class="tool-button" @click="copyCssBg" :disabled="!currentDataUri">
            🎨 复制 CSS 代码
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <!-- 快捷复制区 -->
        <div class="quick-uses" v-if="svgInput.trim()">
          <div class="quick-use-item">
            <label class="tool-label">img src：</label>
            <div class="result-display">
              <code class="code-snippet">{{ imgTag }}</code>
              <button class="copy-btn" @click="copyText(imgTag)" title="复制">📋</button>
            </div>
          </div>
          <div class="quick-use-item">
            <label class="tool-label">CSS background-image：</label>
            <div class="result-display">
              <code class="code-snippet">{{ cssBgLine }}</code>
              <button class="copy-btn" @click="copyText(cssBgLine)" title="复制">📋</button>
            </div>
          </div>
        </div>

        <div v-if="copied" class="status-success">✅ {{ copied }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

// 状态
const svgInput = ref('')
const dragOver = ref(false)
const encodeMode = ref('urlencoded')
const previewError = ref(false)
const copied = ref('')
const error = ref('')

const fileInput = ref(null)

// 计算 Data URI
const currentDataUri = computed(() => {
  const svg = svgInput.value.trim()
  if (!svg) return ''

  try {
    if (encodeMode.value === 'urlencoded') {
      // URL 编码方式
      const encoded = encodeURIComponent(svg)
        .replace(/%20/g, ' ')
        .replace(/%3D/g, '=')
        .replace(/%2F/g, '/')
      return 'data:image/svg+xml,' + encoded
    } else {
      // Base64 编码方式
      const base64 = btoa(unescape(encodeURIComponent(svg)))
      return 'data:image/svg+xml;base64,' + base64
    }
  } catch (err) {
    error.value = '编码失败：' + err.message
    return ''
  }
})

// 膨胀率计算
const inflationRatio = computed(() => {
  if (!svgInput.value.trim() || !currentDataUri.value) return '0'
  const original = svgInput.value.trim().length
  const encoded = currentDataUri.value.length
  if (original === 0) return '0'
  return ((encoded / original) * 100).toFixed(1)
})

// img 标签代码片段
const imgTag = computed(() => {
  if (!currentDataUri.value) return ''
  return `<img src="${currentDataUri.value}" alt="" />`
})

// CSS background-image 代码片段
const cssBgLine = computed(() => {
  if (!currentDataUri.value) return ''
  return `background-image: url("${currentDataUri.value}");`
})

// 文件大小格式化
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 输入变更
function onInputChange() {
  error.value = ''
  copied.value = ''
  previewError.value = false
}

// 处理文件选择
function handleFile(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

// 处理拖放
function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

// 处理文件
function processFile(file) {
  error.value = ''
  copied.value = ''
  previewError.value = false

  if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
    error.value = '请选择 SVG 文件'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    svgInput.value = e.target.result
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsText(file)
}

// 复制 Data URI
async function copyUri() {
  try {
    await navigator.clipboard.writeText(currentDataUri.value)
    copied.value = '已复制 Data URI 到剪贴板'
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    error.value = '复制失败，请手动选择复制'
  }
}

// 复制 CSS 背景代码
async function copyCssBg() {
  try {
    await navigator.clipboard.writeText(cssBgLine.value)
    copied.value = '已复制 CSS 代码到剪贴板'
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    error.value = '复制失败，请手动选择复制'
  }
}

// 通用文本复制
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = '已复制到剪贴板'
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    error.value = '复制失败，请手动选择复制'
  }
}

// 清空
function clearAll() {
  svgInput.value = ''
  encodeMode.value = 'urlencoded'
  previewError.value = false
  copied.value = ''
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
  margin-top: 14px;
  margin-bottom: 14px;
}

.upload-area:hover,
.upload-area.upload-dragover {
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
  font-size: 2rem;
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

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.preview-wrapper {
  border: 1px solid var(--line);
  background: var(--panel);
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 6px;
}

.preview-container {
  width: 100%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-svg {
  max-width: 100%;
  max-height: 200px;
  display: block;
}

.preview-empty {
  padding: 2rem;
  text-align: center;
}

.preview-empty-text {
  color: var(--muted);
  font-size: 13px;
}

.preview-warning {
  color: var(--yellow, #f0c040);
  font-size: 12px;
  font-family: var(--mono);
  margin-bottom: 10px;
  padding: 4px 8px;
  background: rgba(240, 192, 64, 0.08);
  border: 1px solid rgba(240, 192, 64, 0.3);
}

.quick-uses {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-use-item {
  flex: 1;
}

.code-snippet {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 60px;
  overflow-y: auto;
  display: block;
  line-height: 1.5;
}

.stats-section {
  margin-top: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1rem 0.5rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .preview-container {
    padding: 8px;
  }

  .preview-svg {
    max-height: 150px;
  }
}

@media (max-width: 375px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
