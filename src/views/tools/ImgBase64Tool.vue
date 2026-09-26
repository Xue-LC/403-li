<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 图片转 Base64</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 & 预览 -->
          <div class="tool-col">
            <label class="tool-label">上传图片：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFile"
              />
              <div class="upload-content">
                <span class="upload-icon">📁</span>
                <span class="upload-text">点击或拖拽上传图片</span>
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / SVG / BMP</span>
              </div>
            </div>

            <!-- 图片预览 -->
            <div v-if="originalSrc" class="preview-section">
              <label class="tool-label">预览：</label>
              <div class="canvas-wrapper">
                <img
                  ref="previewImg"
                  :src="originalSrc"
                  alt="预览图片"
                  class="preview-image"
                  @load="onImageLoad"
                />
              </div>
              <!-- 图片信息 -->
              <div class="image-info" v-if="imgInfo">
                <span class="info-item">📐 {{ imgInfo.width }} × {{ imgInfo.height }} px</span>
                <span class="info-item">📦 {{ imgInfo.type }}</span>
                <span class="info-item">💾 {{ imgInfo.size }}</span>
              </div>
            </div>
          </div>

          <!-- 右栏：输出 -->
          <div class="tool-col">
            <label class="tool-label">输出格式：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="fmt in formats" :key="fmt.value">
                <input type="radio" v-model="outputFormat" :value="fmt.value" @change="convertImage" />
                <span>{{ fmt.label }}</span>
              </label>
            </div>

            <!-- 质量滑块 -->
            <div v-if="outputFormat !== 'png'" class="quality-section">
              <label class="tool-label">质量：{{ quality }}%</label>
              <input
                type="range"
                v-model.number="quality"
                min="10"
                max="100"
                class="range-input"
                @input="convertImage"
              />
              <div class="length-display"><span>{{ quality }}</span></div>
            </div>

            <label class="tool-label">Base64 输出：</label>
            <textarea
              class="code-input output"
              :value="base64Output"
              readonly
              rows="10"
              placeholder="转换结果将显示在这里..."
            ></textarea>

            <!-- 统计信息 -->
            <div class="image-info" v-if="base64Output">
              <span class="info-item">📏 Base64 长度：{{ base64Output.length }} 字符</span>
              <span class="info-item">📊 原始大小：{{ (base64Output.length * 0.75 / 1024).toFixed(1) }} KB</span>
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyBase64" :disabled="!base64Output">
            📋 复制 Base64
          </button>
          <button class="tool-button" @click="downloadImage" :disabled="!base64Output">
            💾 下载图片
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copied" class="status-success">✅ 已复制到剪贴板</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'

// 状态
const originalSrc = ref('')
const base64Output = ref('')
const dragOver = ref(false)
const copied = ref(false)
const error = ref('')
const outputFormat = ref('png')
const quality = ref(92)
const imgInfo = ref(null)
const imgElement = ref(null)

const fileInput = ref(null)
const previewImg = ref(null)

const formats = [
  { label: 'PNG（无损）', value: 'png' },
  { label: 'JPEG（有损）', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
]

// 文件大小格式化
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    originalSrc.value = e.target.result
    imgInfo.value = {
      type: file.type,
      size: formatSize(file.size),
      width: 0,
      height: 0,
    }
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

// 图片加载完成后获取尺寸并转换
function onImageLoad() {
  const img = previewImg.value
  if (!img) return

  imgInfo.value.width = img.naturalWidth
  imgInfo.value.height = img.naturalHeight

  nextTick(() => {
    convertImage()
  })
}

// 使用 Canvas 转换图片
function convertImage() {
  const img = previewImg.value
  if (!img) return

  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    const mimeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    }

    const mimeType = mimeMap[outputFormat.value]
    const q = outputFormat.value === 'png' ? undefined : quality.value / 100

    base64Output.value = canvas.toDataURL(mimeType, q)
  } catch (err) {
    error.value = '图片转换失败：' + err.message
  }
}

// 复制 Base64
async function copyBase64() {
  try {
    await navigator.clipboard.writeText(base64Output.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = '复制失败，请手动选择复制'
  }
}

// 下载图片
function downloadImage() {
  const link = document.createElement('a')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  link.download = `image.${ext}`
  link.href = base64Output.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 清空
function clearAll() {
  originalSrc.value = ''
  base64Output.value = ''
  imgInfo.value = null
  error.value = ''
  copied.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--line);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
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

.preview-section {
  margin-top: 16px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  display: block;
  margin: 0 auto;
}

.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.info-item {
  color: var(--muted);
  font-size: 12px;
  font-family: 'MapleMono NF CN', monospace;
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
}

.quality-section {
  margin-bottom: 14px;
}

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-text {
    font-size: 12px;
  }
}
</style>
