<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🖼️ 图片压缩裁剪</span>
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
              <label class="tool-label">原图预览：</label>
              <div class="canvas-wrapper">
                <img
                  ref="previewImg"
                  :src="originalSrc"
                  alt="原图"
                  class="preview-image"
                  @load="onImageLoad"
                />
              </div>
              <div class="image-info" v-if="imgInfo">
                <span class="info-item">📐 {{ imgInfo.width }} × {{ imgInfo.height }} px</span>
                <span class="info-item">📦 {{ imgInfo.type }}</span>
                <span class="info-item">💾 {{ imgInfo.size }}</span>
              </div>
            </div>
          </div>

          <!-- 右栏：处理参数 -->
          <div class="tool-col">
            <label class="tool-label">输出尺寸：</label>
            <div class="size-controls">
              <div class="size-row">
                <label class="size-label">宽</label>
                <input
                  class="code-input-sm"
                  type="number"
                  v-model.number="outWidth"
                  min="1"
                  max="10000"
                  @input="onWidthChange"
                />
                <button class="lock-btn" @click="lockAspect = !lockAspect" :title="lockAspect ? '解锁宽高比' : '锁定宽高比'">
                  {{ lockAspect ? '🔒' : '🔓' }}
                </button>
                <label class="size-label">高</label>
                <input
                  class="code-input-sm"
                  type="number"
                  v-model.number="outHeight"
                  min="1"
                  max="10000"
                  @input="onHeightChange"
                />
                <span class="size-unit">px</span>
              </div>

              <!-- 预设缩放比例 -->
              <div class="preset-sizes">
                <button
                  v-for="p in presets"
                  :key="p.label"
                  class="preset-btn"
                  :class="{ active: activePreset === p.label }"
                  @click="applyPreset(p)"
                >{{ p.label }}</button>
              </div>
            </div>

            <!-- 旋转 -->
            <label class="tool-label">旋转：</label>
            <div class="rotate-controls">
              <button class="rotate-btn" @click="rotateLeft" title="逆时针旋转 90°">↺ 90°</button>
              <button class="rotate-btn" @click="rotateRight" title="顺时针旋转 90°">↻ 90°</button>
              <button class="rotate-btn" @click="rotate180" title="旋转 180°">180°</button>
              <button class="rotate-btn" @click="flipH" title="水平翻转">↔ 翻转</button>
              <button class="rotate-btn" @click="flipV" title="垂直翻转">↕ 翻转</button>
              <button class="rotate-btn" @click="resetTransform" title="重置变换">↺ 重置</button>
            </div>
            <span class="rotate-info" v-if="rotation !== 0 || hFlip || vFlip">
              当前：旋转 {{ rotation }}° {{ hFlip ? '| 水平翻转' : '' }}{{ vFlip ? '| 垂直翻转' : '' }}
            </span>

            <!-- 输出格式 -->
            <label class="tool-label">输出格式：</label>
            <div class="radio-group">
              <label class="radio-label" v-for="fmt in formats" :key="fmt.value">
                <input type="radio" v-model="outputFormat" :value="fmt.value" @change="processImage" />
                <span>{{ fmt.label }}</span>
              </label>
            </div>

            <!-- 质量滑块 -->
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
              <div class="length-display"><span>{{ quality }}</span></div>
            </div>

            <!-- 输出预览 -->
            <label class="tool-label">处理后预览：</label>
            <div class="canvas-wrapper" v-if="outputSrc">
              <img :src="outputSrc" alt="处理后" class="preview-image" />
            </div>
            <div v-else-if="originalSrc" class="placeholder-preview">
              <span>调整参数后自动预览</span>
            </div>

            <!-- 输出信息 -->
            <div class="image-info" v-if="outputInfo">
              <span class="info-item">📐 {{ outputInfo.width }} × {{ outputInfo.height }} px</span>
              <span class="info-item">💾 {{ outputInfo.size }}</span>
              <span class="info-item" v-if="outputInfo.compressionRatio">
                📉 压缩率 {{ outputInfo.compressionRatio }}%
              </span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="downloadImage" :disabled="!outputBlob">
            💾 下载图片
          </button>
          <button class="tool-button" @click="copyToClipboard" :disabled="!outputSrc">
            📋 复制图片
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
import { ref, nextTick, computed } from 'vue'

// 引用
const fileInput = ref(null)
const previewImg = ref(null)

// 状态
const originalSrc = ref('')
const outputSrc = ref('')
const dragOver = ref(false)
const copied = ref(false)
const error = ref('')
const outputFormat = ref('jpeg')
const quality = ref(85)
const imgInfo = ref(null)
const outputInfo = ref(null)
const outputBlob = ref(null)

// 尺寸
const outWidth = ref(0)
const outHeight = ref(0)
const origWidth = ref(0)
const origHeight = ref(0)
const lockAspect = ref(true)
const activePreset = ref('')

// 旋转/翻转
const rotation = ref(0)
const hFlip = ref(false)
const vFlip = ref(false)

const formats = [
  { label: 'JPEG（有损，体积小）', value: 'jpeg' },
  { label: 'PNG（无损，支持透明）', value: 'png' },
  { label: 'WebP（体积小，质量好）', value: 'webp' },
]

const presets = [
  { label: '25%', scale: 0.25 },
  { label: '50%', scale: 0.5 },
  { label: '75%', scale: 0.75 },
  { label: '100%', scale: 1 },
  { label: '200%', scale: 2 },
  { label: '16:9', scale: -1, w: 1920, h: 1080 },
  { label: '4:3', scale: -1, w: 1024, h: 768 },
  { label: '1:1', scale: -1, w: 512, h: 512 },
]

// 文件大小格式化
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

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
  copied.value = false
  outputSrc.value = ''
  outputBlob.value = null
  outputInfo.value = null
  activePreset.value = ''
  rotation.value = 0
  hFlip.value = false
  vFlip.value = false

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  // 检查文件大小（最大 50MB）
  if (file.size > 50 * 1024 * 1024) {
    error.value = '图片文件过大，请选择小于 50MB 的图片'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    originalSrc.value = e.target.result
    imgInfo.value = {
      type: file.type,
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

function onImageLoad() {
  const img = previewImg.value
  if (!img) return

  origWidth.value = img.naturalWidth
  origHeight.value = img.naturalHeight
  outWidth.value = img.naturalWidth
  outHeight.value = img.naturalHeight
  imgInfo.value.width = img.naturalWidth
  imgInfo.value.height = img.naturalHeight

  nextTick(() => {
    processImage()
  })
}

function onWidthChange() {
  if (lockAspect.value && origWidth.value > 0) {
    outHeight.value = Math.round((outWidth.value / origWidth.value) * origHeight.value)
  }
  activePreset.value = ''
  processImage()
}

function onHeightChange() {
  if (lockAspect.value && origHeight.value > 0) {
    outWidth.value = Math.round((outHeight.value / origHeight.value) * origWidth.value)
  }
  activePreset.value = ''
  processImage()
}

function applyPreset(p) {
  activePreset.value = p.label
  if (p.scale > 0) {
    // 按比例缩放
    outWidth.value = Math.round(origWidth.value * p.scale)
    outHeight.value = Math.round(origHeight.value * p.scale)
  } else {
    // 按目标宽高比裁剪（以当前宽为基础）
    const targetRatio = p.w / p.h
    const currentRatio = origWidth.value / origHeight.value
    if (currentRatio > targetRatio) {
      // 原图更宽，以高度为准
      outHeight.value = origHeight.value
      outWidth.value = Math.round(origHeight.value * targetRatio)
    } else {
      // 原图更高，以宽度为准
      outWidth.value = origWidth.value
      outHeight.value = Math.round(origWidth.value / targetRatio)
    }
  }
  processImage()
}

function rotateLeft() {
  rotation.value = (rotation.value - 90) % 360
  if (rotation.value < 0) rotation.value += 360
  // 旋转时交换宽高
  if (Math.abs(rotation.value) % 180 !== 0) {
    const tmp = outWidth.value
    outWidth.value = outHeight.value
    outHeight.value = tmp
  }
  activePreset.value = ''
  processImage()
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
  if (Math.abs(rotation.value) % 180 !== 0) {
    const tmp = outWidth.value
    outWidth.value = outHeight.value
    outHeight.value = tmp
  }
  activePreset.value = ''
  processImage()
}

function rotate180() {
  rotation.value = (rotation.value + 180) % 360
  activePreset.value = ''
  processImage()
}

function flipH() {
  hFlip.value = !hFlip.value
  activePreset.value = ''
  processImage()
}

function flipV() {
  vFlip.value = !vFlip.value
  activePreset.value = ''
  processImage()
}

function resetTransform() {
  rotation.value = 0
  hFlip.value = false
  vFlip.value = false
  outWidth.value = origWidth.value
  outHeight.value = origHeight.value
  activePreset.value = ''
  processImage()
}

function processImage() {
  const img = previewImg.value
  if (!img || !outWidth.value || !outHeight.value) return

  try {
    const w = outWidth.value
    const h = outHeight.value

    // 计算旋转后的 canvas 尺寸
    const isRotated90 = Math.abs(rotation.value) % 180 === 90
    const canvasW = isRotated90 ? h : w
    const canvasH = isRotated90 ? w : h

    const canvas = document.createElement('canvas')
    canvas.width = canvasW
    canvas.height = canvasH
    const ctx = canvas.getContext('2d')

    // 应用变换
    ctx.save()
    ctx.translate(canvasW / 2, canvasH / 2)

    // 旋转
    const rad = (rotation.value * Math.PI) / 180
    ctx.rotate(rad)

    // 翻转
    const scaleX = hFlip.value ? -1 : 1
    const scaleY = vFlip.value ? -1 : 1
    ctx.scale(scaleX, scaleY)

    // 绘制图片
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    ctx.restore()

    // 生成输出
    const mimeMap = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    }
    const mimeType = mimeMap[outputFormat.value]
    const q = outputFormat.value === 'png' ? undefined : quality.value / 100

    outputSrc.value = canvas.toDataURL(mimeType, q)

    // 转 Blob 获取大小
    canvas.toBlob((blob) => {
      if (blob) {
        outputBlob.value = blob
        const origBytes = imgInfo.value?.origSize || 1
        const ratio = origBytes > 0 ? Math.round((1 - blob.size / origBytes) * 100) : 0
        outputInfo.value = {
          width: canvasW,
          height: canvasH,
          size: formatSize(blob.size),
          compressionRatio: ratio >= 0 ? ratio : 0,
        }
      }
    }, mimeType, q)
  } catch (err) {
    error.value = '图片处理失败：' + err.message
  }
}

function downloadImage() {
  if (!outputBlob.value) return
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  const url = URL.createObjectURL(outputBlob.value)
  const link = document.createElement('a')
  link.download = `processed.${ext}`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function copyToClipboard() {
  if (!outputSrc.value) return
  try {
    // 尝试复制图片 Blob
    if (outputBlob.value && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ [outputBlob.value.type]: outputBlob.value })
      ])
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
      return
    }
  } catch {
    // ClipboardItem 不支持时 fallback 到 data URL
  }

  try {
    await navigator.clipboard.writeText(outputSrc.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = '复制失败，请手动保存图片'
  }
}

function clearAll() {
  originalSrc.value = ''
  outputSrc.value = ''
  outputBlob.value = null
  outputInfo.value = null
  imgInfo.value = null
  outWidth.value = 0
  outHeight.value = 0
  origWidth.value = 0
  origHeight.value = 0
  rotation.value = 0
  hFlip.value = false
  vFlip.value = false
  activePreset.value = ''
  error.value = ''
  copied.value = false
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

.preview-section {
  margin-top: 16px;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  display: block;
  margin: 0 auto;
  border: 1px solid var(--line);
}

.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.15);
}

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

/* 尺寸控制 */
.size-controls {
  margin-bottom: 14px;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.size-label {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  width: 24px;
  text-align: center;
}

.size-row .code-input-sm {
  flex: 1;
  min-width: 60px;
  max-width: 100px;
}

.size-unit {
  color: var(--muted);
  font-size: 12px;
}

.lock-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-family: var(--mono);
}

.lock-btn:hover {
  border-color: var(--green);
  background: rgba(157, 255, 107, 0.08);
}

.preset-sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
  cursor: pointer;
  padding: 4px 10px;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--green);
  color: var(--text);
}

.preset-btn.active {
  border-color: var(--green);
  color: var(--green);
  background: rgba(157, 255, 107, 0.08);
}

/* 旋转控制 */
.rotate-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.rotate-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
  cursor: pointer;
  padding: 5px 10px;
  transition: all 0.2s;
}

.rotate-btn:hover {
  border-color: var(--green);
  color: var(--text);
  background: rgba(157, 255, 107, 0.06);
}

.rotate-info {
  display: block;
  color: var(--green);
  font-size: 11px;
  font-family: var(--mono);
  margin-bottom: 14px;
  min-height: 16px;
}

/* 格式选择 */
.radio-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

/* 质量 */
.quality-section {
  margin-bottom: 14px;
}

/* 响应式 */
@media (max-width: 640px) {
  .upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .size-row .code-input-sm {
    max-width: 80px;
  }

  .rotate-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
