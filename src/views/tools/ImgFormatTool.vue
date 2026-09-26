<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 图片格式转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 & 原图预览 -->
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
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / BMP</span>
              </div>
            </div>

            <div v-if="originalSrc" class="preview-section">
              <div class="preview-head">
                <span class="preview-title">原图预览：</span>
                <button
                  class="copy-btn-inline"
                  :disabled="!originalSrc"
                  title="复制原图 Data URL"
                  @click="copyOriginal"
                >📋 复制原图</button>
              </div>
              <div class="canvas-wrapper">
                <img
                  ref="previewImg"
                  :src="originalSrc"
                  alt="原图"
                  class="preview-image"
                  @load="onImageLoad"
                  @error="onImageError"
                />
              </div>
              <div class="image-info" v-if="imgInfo">
                <span class="info-item">📐 {{ imgInfo.width }} × {{ imgInfo.height }} px</span>
                <span class="info-item">🏷️ {{ imgInfo.format }}</span>
                <span class="info-item">💾 {{ imgInfo.size }}</span>
              </div>
            </div>
            <div v-else class="placeholder-preview">
              <span>上传图片后显示原图信息</span>
            </div>
          </div>

          <!-- 右栏：转换参数 & 输出预览 -->
          <div class="tool-col">
            <label class="tool-label">目标格式：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="fmt in formats" :key="fmt.value">
                <input type="radio" v-model="outputFormat" :value="fmt.value" @change="processImage" />
                <span>{{ fmt.label }}</span>
              </label>
            </div>

            <div v-if="outputFormat !== 'png'" class="quality-section">
              <label class="tool-label">输出质量：{{ quality }}%</label>
              <input
                type="range"
                v-model.number="quality"
                min="5"
                max="100"
                class="range-input"
                @input="processImage"
              />
            </div>
            <p v-else class="quality-hint">PNG 为无损格式，无需调节质量</p>

            <div v-if="originalSrc" class="preview-section">
              <div class="preview-head">
                <span class="preview-title">转换后预览：</span>
                <button
                  class="copy-btn-inline"
                  :disabled="!outputSrc"
                  title="复制转换后的图片到剪贴板"
                  @click="copyOutput"
                >📋 复制结果</button>
              </div>
              <div class="canvas-wrapper">
                <img v-if="outputSrc" :src="outputSrc" alt="转换后" class="preview-image" />
                <div v-else class="placeholder-preview">
                  <span>转换中...</span>
                </div>
              </div>

              <div class="image-info" v-if="outputInfo">
                <span class="info-item">📐 {{ outputInfo.width }} × {{ outputInfo.height }} px</span>
                <span class="info-item">🏷️ {{ outputInfo.format }}</span>
                <span class="info-item">💾 {{ outputInfo.size }}</span>
              </div>

              <!-- 转换前后大小对比 -->
              <div class="size-compare" v-if="outputInfo && imgInfo && imgInfo.origSize > 0">
                <div class="compare-bar">
                  <div class="compare-seg seg-orig" :style="{ flex: compare.orig }" title="原图大小"></div>
                  <div class="compare-seg seg-out" :style="{ flex: compare.out }" title="转换后大小"></div>
                </div>
                <div class="compare-legend">
                  <span class="legend-item"><i class="dot dot-orig"></i>原图 {{ imgInfo.size }}</span>
                  <span class="legend-item"><i class="dot dot-out"></i>转换后 {{ outputInfo.size }}</span>
                  <span class="legend-item delta" :class="compare.deltaClass">
                    {{ compare.deltaIcon }} 体积{{ compare.deltaText }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="placeholder-preview">
              <span>上传图片后自动转换并预览</span>
            </div>
          </div>
        </div>

        <!-- 按钮组（全宽，双栏外） -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!outputBlob" @click="downloadImage">
            💾 下载图片
          </button>
          <button class="tool-button" :disabled="!outputSrc" @click="copyOutput">
            📋 复制图片
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copied" class="status-success">✅ {{ copied }}</div>
        <div v-if="error" class="status-error">❌ {{ error }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

// DOM 引用
const fileInput = ref(null)
const previewImg = ref(null)

// 状态
const originalSrc = ref('')
const outputSrc = ref('')
const dragOver = ref(false)
const copied = ref('')
const error = ref('')
const outputFormat = ref('png')
const quality = ref(85)
const imgInfo = ref(null)
const outputInfo = ref(null)
const outputBlob = ref(null)

// 支持的目标格式
const formats = [
  { label: 'PNG（无损）', value: 'png' },
  { label: 'JPEG（有损）', value: 'jpeg' },
  { label: 'WebP（体积小）', value: 'webp' },
]

const MIME_MAP = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }
const EXT_MAP = { png: 'png', jpeg: 'jpg', webp: 'webp' }
const CONVERTIBLE = ['png', 'jpeg', 'webp']

// 文件大小格式化
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 大小对比数据
const compare = computed(() => {
  const orig = imgInfo.value?.origSize || 0
  const out = outputInfo.value?.newSize || 0
  if (!orig || !out) {
    return { orig: 50, out: 50, deltaIcon: '', deltaText: '', deltaClass: '' }
  }
  const max = Math.max(orig, out)
  const pct = ((out - orig) / orig) * 100
  let deltaIcon = ''
  let deltaText = ''
  let deltaClass = ''
  if (pct < -0.5) {
    deltaIcon = '📉'
    deltaText = `缩小 ${Math.round(Math.abs(pct))}%`
    deltaClass = 'delta-down'
  } else if (pct > 0.5) {
    deltaIcon = '📈'
    deltaText = `增大 ${Math.round(pct)}%`
    deltaClass = 'delta-up'
  } else {
    deltaText = '基本不变'
  }
  return {
    orig: Math.round((orig / max) * 100),
    out: Math.round((out / max) * 100),
    deltaIcon,
    deltaText,
    deltaClass,
  }
})

// 选择文件
function handleFile(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function processFile(file) {
  error.value = ''
  copied.value = ''
  outputSrc.value = ''
  outputBlob.value = null
  outputInfo.value = null
  imgInfo.value = null

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  if (file.size > 50 * 1024 * 1024) {
    error.value = '图片文件过大，请选择小于 50MB 的图片'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    originalSrc.value = e.target.result
    imgInfo.value = {
      type: file.type,
      format: (file.type.replace('image/', '') || 'unknown').toUpperCase(),
      size: formatSize(file.size),
      origSize: file.size,
      width: 0,
      height: 0,
    }
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

// 原图加载完成
function onImageLoad() {
  const img = previewImg.value
  if (!img) return

  imgInfo.value.width = img.naturalWidth
  imgInfo.value.height = img.naturalHeight

  // 默认目标格式跟随原图格式（非三类则转 PNG）
  const srcType = (imgInfo.value.type || '').split('/')[1]?.toLowerCase()
  outputFormat.value = CONVERTIBLE.includes(srcType) ? srcType : 'png'

  processImage()
}

function onImageError() {
  error.value = '图片解析失败，文件可能已损坏或格式不受支持'
}

// 核心转换：Canvas 绘制 → toDataURL / toBlob
function processImage() {
  const img = previewImg.value
  if (!img || !img.naturalWidth) return

  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      error.value = '当前浏览器不支持 Canvas，无法转换'
      return
    }

    // JPEG 不支持透明通道，先填充白色背景
    if (outputFormat.value === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }

    ctx.drawImage(img, 0, 0, w, h)

    const mime = MIME_MAP[outputFormat.value]
    const q = outputFormat.value === 'png' ? undefined : quality.value / 100

    outputSrc.value = canvas.toDataURL(mime, q)

    canvas.toBlob((blob) => {
      if (!blob) return
      outputBlob.value = blob
      outputInfo.value = {
        width: w,
        height: h,
        format: outputFormat.value.toUpperCase(),
        size: formatSize(blob.size),
        newSize: blob.size,
      }
    }, mime, q)
  } catch (err) {
    error.value = '图片处理失败：' + err.message
  }
}

// 复制原图 Data URL（输入区）
async function copyOriginal() {
  if (!originalSrc.value) return
  try {
    await navigator.clipboard.writeText(originalSrc.value)
    copied.value = '原图 Data URL 已复制到剪贴板'
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    error.value = '复制失败，请检查浏览器剪贴板权限'
  }
}

// 复制转换结果（输出区）：优先复制图片本身，失败则回退 Data URL
async function copyOutput() {
  if (!outputSrc.value) return
  try {
    if (outputBlob.value && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ [outputBlob.value.type]: outputBlob.value })
      ])
      copied.value = '转换后的图片已复制到剪贴板'
      setTimeout(() => (copied.value = ''), 2000)
      return
    }
  } catch {
    // ClipboardItem 不可用时回退到 Data URL 文本
  }
  try {
    await navigator.clipboard.writeText(outputSrc.value)
    copied.value = '转换后的 Data URL 已复制到剪贴板'
    setTimeout(() => (copied.value = ''), 2000)
  } catch {
    error.value = '复制失败，请手动保存图片'
  }
}

// 下载转换结果
function downloadImage() {
  if (!outputBlob.value) return
  const url = URL.createObjectURL(outputBlob.value)
  const link = document.createElement('a')
  link.download = `converted.${EXT_MAP[outputFormat.value] || 'png'}`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 清空
function clearAll() {
  originalSrc.value = ''
  outputSrc.value = ''
  outputBlob.value = null
  outputInfo.value = null
  imgInfo.value = null
  outputFormat.value = 'png'
  quality.value = 85
  error.value = ''
  copied.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
/* 上传区域 */
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

/* 预览区块 */
.preview-section {
  margin-top: 16px;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-title {
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
}

.copy-btn-inline {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  cursor: pointer;
  padding: 4px 10px;
  transition: all 0.2s;
}

.copy-btn-inline:hover:not(:disabled) {
  border-color: var(--green);
  color: var(--green);
  background: rgba(157, 255, 107, 0.08);
}

.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-wrapper {
  border: 1px solid var(--line);
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  display: block;
  margin: 0 auto;
}

.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.15);
}

/* 图片信息 */
.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.info-item {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
}

/* 质量 */
.quality-section {
  margin-bottom: 6px;
}

.quality-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  margin: 0 0 16px;
}

/* 大小对比 */
.size-compare {
  margin-top: 12px;
  border: 1px solid var(--line);
  padding: 10px;
  background: var(--panel-2);
}

.compare-bar {
  display: flex;
  height: 12px;
  border: 1px solid var(--line);
  overflow: hidden;
}

.compare-seg {
  height: 100%;
  transition: flex 0.2s;
}

.seg-orig {
  background: var(--muted);
}

.seg-out {
  background: var(--green);
}

.compare-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 11px;
  font-family: var(--mono);
  color: var(--muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  display: inline-block;
}

.dot-orig {
  background: var(--muted);
}

.dot-out {
  background: var(--green);
}

.delta.delta-down {
  color: var(--green);
}

.delta.delta-up {
  color: var(--red);
}

/* 响应式 */
@media (max-width: 640px) {
  .upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .copy-btn-inline {
    font-size: 11px;
    padding: 3px 8px;
  }

  .preview-image {
    max-height: 220px;
  }
}
</style>
