<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 图片色调调整器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 + 预览 -->
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
                <span class="upload-text">点击、拖拽或 Ctrl+V 粘贴图片</span>
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / BMP</span>
              </div>
            </div>

            <div v-if="hasImage" class="preview-section">
              <div class="preview-head">
                <label class="tool-label">预览：</label>
                <label class="checkbox-label compare-toggle">
                  <input type="checkbox" v-model="compareOn" />
                  <span>前后对比</span>
                </label>
              </div>
              <div
                class="canvas-wrapper"
                :class="{ 'is-dragging': dragging }"
              >
                <canvas
                  ref="canvasRef"
                  class="adjust-canvas"
                  @pointerdown="onPointerDown"
                  @pointermove="onPointerMove"
                  @pointerup="onPointerUp"
                  @pointercancel="onPointerUp"
                ></canvas>
              </div>
              <div class="hint-text">
                {{ compareOn ? '← 左半为原图，右半为调整后，拖拽中间滑块可改变分界位置' : '开启「前后对比」可拖拽滑块查看调整前后差异' }}
              </div>
              <div class="image-info">
                <span class="info-item">📐 {{ imgWidth }} × {{ imgHeight }} px</span>
                <span class="info-item">💾 {{ imgSizeText }}</span>
                <span v-if="scaledDown" class="info-item info-warn">
                  ⚠️ 预览已按 {{ workScaleText }} 缩放
                </span>
              </div>
            </div>
            <div v-else class="placeholder-preview">
              <span>上传图片后在此实时预览色调效果</span>
            </div>
          </div>

          <!-- 右栏：调整参数 -->
          <div class="tool-col">
            <label class="tool-label">快速预设：</label>
            <div class="preset-grid">
              <button
                v-for="p in presets"
                :key="p.name"
                class="preset-btn"
                :title="p.name"
                @click="applyPreset(p)"
              >
                {{ p.name }}
              </button>
            </div>

            <div class="control-section">
              <label class="tool-label">色调旋转：{{ hue }}°</label>
              <input type="range" class="range-input" v-model.number="hue" min="-180" max="180" />
            </div>

            <div class="control-section">
              <label class="tool-label">饱和度：{{ saturation }}%</label>
              <input type="range" class="range-input" v-model.number="saturation" min="0" max="200" />
            </div>

            <div class="control-section">
              <label class="tool-label">亮度：{{ brightness }}%</label>
              <input type="range" class="range-input" v-model.number="brightness" min="0" max="200" />
            </div>

            <div class="control-section">
              <label class="tool-label">对比度：{{ contrast }}%</label>
              <input type="range" class="range-input" v-model.number="contrast" min="0" max="200" />
            </div>

            <div class="control-section">
              <label class="tool-label">棕褐色：{{ sepia }}%</label>
              <input type="range" class="range-input" v-model.number="sepia" min="0" max="100" />
            </div>

            <div class="control-section">
              <label class="tool-label">灰度：{{ grayscale }}%</label>
              <input type="range" class="range-input" v-model.number="grayscale" min="0" max="100" />
            </div>

            <div class="control-section">
              <label class="tool-label">反相：{{ invert }}%</label>
              <input type="range" class="range-input" v-model.number="invert" min="0" max="100" />
            </div>

            <div class="control-section">
              <label class="tool-label">模糊：{{ blur }}px</label>
              <input type="range" class="range-input" v-model.number="blur" min="0" max="20" />
            </div>

            <button class="tool-button full-width reset-btn" :disabled="!hasImage" @click="resetAll">
              ↺ 重置全部参数
            </button>
          </div>
        </div>

        <!-- 按钮组（双栏外） -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!hasImage" @click="exportPng">
            💾 导出 PNG
          </button>
          <button class="tool-button" :disabled="!hasImage" @click="copyImage">
            📋 复制图片
          </button>
          <button class="tool-button" :disabled="!hasImage" @click="copySettings">
            📄 复制参数
          </button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

/* ===== DOM 引用 ===== */
const fileInput = ref(null)
const canvasRef = ref(null)

/* ===== 图片状态 ===== */
// 用普通变量保存 Image 元素，避免被 Vue 响应式代理包裹
let imgEl = null
const hasImage = ref(false)
const srcName = ref('image')
const imgWidth = ref(0)
const imgHeight = ref(0)
const imgBytes = ref(0)
const workW = ref(0)
const workH = ref(0)

/* 超大图缩放（长边上限），避免浏览器内存爆掉 */
const MAX_EDGE = 2400
const scaledDown = computed(() => imgWidth.value > workW.value)
const workScaleText = computed(() => {
  if (!imgWidth.value) return ''
  return (workW.value / imgWidth.value).toFixed(2) + 'x'
})
const imgSizeText = computed(() => formatSize(imgBytes.value))

/* ===== 调整参数 ===== */
const DEFAULTS = {
  hue: 0,
  saturation: 100,
  brightness: 100,
  contrast: 100,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  blur: 0
}
const hue = ref(DEFAULTS.hue)
const saturation = ref(DEFAULTS.saturation)
const brightness = ref(DEFAULTS.brightness)
const contrast = ref(DEFAULTS.contrast)
const sepia = ref(DEFAULTS.sepia)
const grayscale = ref(DEFAULTS.grayscale)
const invert = ref(DEFAULTS.invert)
const blur = ref(DEFAULTS.blur)

/* ===== 对比滑块 ===== */
const compareOn = ref(true)
const comparePos = ref(0.5)

/* ===== 交互状态 ===== */
const dragOver = ref(false)
const dragging = ref(false)
const error = ref('')
const success = ref('')
let successTimer = null

const presets = [
  { name: '原图', v: {} },
  { name: '黑白', v: { grayscale: 100, contrast: 110 } },
  { name: '复古', v: { sepia: 75, contrast: 105, brightness: 105 } },
  { name: '冷色调', v: { hue: -30, saturation: 115, brightness: 102 } },
  { name: '暖色调', v: { hue: 20, saturation: 125, brightness: 105 } },
  { name: '高对比', v: { contrast: 160, saturation: 120 } },
  { name: '褪色', v: { saturation: 55, brightness: 108, contrast: 92 } },
  { name: '反相', v: { invert: 100 } }
]

const activePreset = ref('原图')

/* ===== 工具函数 ===== */
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function setSuccess(msg) {
  success.value = msg
  if (successTimer) clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

function themeColor(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return (v && v.trim()) || fallback
}

/* ===== 滤镜字符串 ===== */
function buildFilter() {
  const parts = []
  if (hue.value !== 0) parts.push(`hue-rotate(${hue.value}deg)`)
  if (saturation.value !== 100) parts.push(`saturate(${saturation.value}%)`)
  if (brightness.value !== 100) parts.push(`brightness(${brightness.value}%)`)
  if (contrast.value !== 100) parts.push(`contrast(${contrast.value}%)`)
  if (sepia.value !== 0) parts.push(`sepia(${sepia.value}%)`)
  if (grayscale.value !== 0) parts.push(`grayscale(${grayscale.value}%)`)
  if (invert.value !== 0) parts.push(`invert(${invert.value}%)`)
  if (blur.value !== 0) parts.push(`blur(${blur.value}px)`)
  return parts.length ? parts.join(' ') : 'none'
}

/* ===== 文件载入 ===== */
function handleFile(e) {
  const file = e.target.files && e.target.files[0]
  if (file) loadFile(file)
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) loadFile(file)
}

function handlePaste(e) {
  const items = (e.clipboardData && e.clipboardData.items) || []
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const file = it.getAsFile()
      if (file) {
        loadFile(file)
        e.preventDefault()
        return
      }
    }
  }
}

function loadFile(file) {
  error.value = ''
  success.value = ''
  if (!file.type || !file.type.startsWith('image/')) {
    error.value = '请选择图片文件（PNG / JPEG / WebP / GIF / BMP）'
    return
  }
  if (file.size > 30 * 1024 * 1024) {
    error.value = '图片过大，请选择小于 30MB 的文件'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      imgEl = img
      imgWidth.value = img.naturalWidth
      imgHeight.value = img.naturalHeight
      imgBytes.value = file.size
      srcName.value = (file.name || 'image').replace(/\.[^.]+$/, '')

      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
      workW.value = Math.max(1, Math.round(img.naturalWidth * scale))
      workH.value = Math.max(1, Math.round(img.naturalHeight * scale))

      const canvas = canvasRef.value
      if (canvas) {
        canvas.width = workW.value
        canvas.height = workH.value
      }

      hasImage.value = true
      nextTick(render)
    }
    img.onerror = () => {
      error.value = '图片解析失败，文件可能已损坏'
    }
    img.src = reader.result
  }
  reader.onerror = () => {
    error.value = '文件读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

/* ===== 对比滑块交互 ===== */
function pointerFrac(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width) return null
  return clamp((e.clientX - rect.left) / rect.width, 0, 1)
}

function onPointerDown(e) {
  if (!hasImage.value || !compareOn.value) return
  const fx = pointerFrac(e)
  if (fx == null) return
  dragging.value = true
  try {
    canvasRef.value.setPointerCapture(e.pointerId)
  } catch {
    /* 忽略 */
  }
  comparePos.value = fx
  render()
}

function onPointerMove(e) {
  if (!dragging.value) return
  const fx = pointerFrac(e)
  if (fx == null) return
  comparePos.value = fx
  render()
}

function onPointerUp(e) {
  if (!dragging.value) return
  dragging.value = false
  try {
    canvasRef.value.releasePointerCapture(e.pointerId)
  } catch {
    /* 忽略 */
  }
}

/* ===== 渲染 ===== */
function render() {
  const canvas = canvasRef.value
  if (!canvas || !imgEl) return
  if (canvas.width !== workW.value || canvas.height !== workH.value) {
    canvas.width = workW.value
    canvas.height = workH.value
  }
  const W = canvas.width
  const H = canvas.height
  if (!W || !H) return

  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // 调整后的完整画面
  ctx.filter = buildFilter()
  ctx.drawImage(imgEl, 0, 0, W, H)
  ctx.filter = 'none'

  if (compareOn.value) {
    const dx = Math.round(comparePos.value * W)
    // 左半部分还原为原图
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, dx, H)
    ctx.clip()
    ctx.drawImage(imgEl, 0, 0, W, H)
    ctx.restore()

    const lineColor = themeColor('--green', '#9dff6b')
    const lineW = Math.max(1, Math.round(W / 600))

    // 分界线
    ctx.fillStyle = lineColor
    ctx.fillRect(dx - Math.round(lineW / 2), 0, lineW, H)

    // 分界手柄
    const knob = clamp(Math.round(Math.min(W, H) * 0.03), 12, 34)
    ctx.fillRect(dx - knob / 2, H / 2 - knob / 2, knob, knob)
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    const tri = knob * 0.34
    ctx.beginPath()
    ctx.moveTo(dx - tri, H / 2 - tri)
    ctx.lineTo(dx - tri, H / 2 + tri)
    ctx.lineTo(dx, H / 2)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(dx + tri, H / 2 - tri)
    ctx.lineTo(dx + tri, H / 2 + tri)
    ctx.lineTo(dx, H / 2)
    ctx.closePath()
    ctx.fill()

    // 标签
    const fontPx = clamp(Math.round(W / 34), 12, 26)
    ctx.font = `600 ${fontPx}px 'MapleMono NF CN', monospace`
    ctx.textBaseline = 'top'
    const pad = Math.round(fontPx * 0.4)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(pad, pad, ctx.measureText('原图').width + pad * 2, fontPx + pad)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('原图', pad * 2, pad + pad * 0.5)
    const rw = ctx.measureText('调整后').width + pad * 2
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(W - rw - pad, pad, rw, fontPx + pad)
    ctx.fillStyle = lineColor
    ctx.fillText('调整后', W - rw, pad + pad * 0.5)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.filter = 'none'
}

/* ===== 预设 / 重置 ===== */
function applyPreset(p) {
  activePreset.value = p.name
  hue.value = p.v.hue ?? DEFAULTS.hue
  saturation.value = p.v.saturation ?? DEFAULTS.saturation
  brightness.value = p.v.brightness ?? DEFAULTS.brightness
  contrast.value = p.v.contrast ?? DEFAULTS.contrast
  sepia.value = p.v.sepia ?? DEFAULTS.sepia
  grayscale.value = p.v.grayscale ?? DEFAULTS.grayscale
  invert.value = p.v.invert ?? DEFAULTS.invert
  blur.value = p.v.blur ?? DEFAULTS.blur
}

function resetAll() {
  applyPreset(presets[0])
  comparePos.value = 0.5
  error.value = ''
  setSuccess('已重置全部参数')
}

/* ===== 输出 ===== */
function exportPng() {
  const canvas = canvasRef.value
  if (!canvas || !hasImage.value) return
  // 导出时关闭对比，输出完整调整结果
  const compareWasOn = compareOn.value
  if (compareWasOn) {
    compareOn.value = false
    render()
  }
  canvas.toBlob((blob) => {
    if (compareWasOn) {
      compareOn.value = true
      render()
    }
    if (!blob) {
      error.value = '导出失败，请重试'
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${srcName.value || 'image'}-adjusted.png`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setSuccess('已导出 PNG 图片')
  }, 'image/png')
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas || !hasImage.value) return
  error.value = ''
  const compareWasOn = compareOn.value
  if (compareWasOn) {
    compareOn.value = false
    render()
  }
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('生成图片失败')
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setSuccess('已复制图片到剪贴板')
    } else {
      throw new Error('当前浏览器不支持复制图片，请改用导出 PNG')
    }
  } catch (err) {
    error.value = '复制失败：' + (err.message || '浏览器不支持')
  } finally {
    if (compareWasOn) {
      compareOn.value = true
      render()
    }
  }
}

async function copySettings() {
  const cfg = {
    filter: buildFilter(),
    hue: hue.value,
    saturation: saturation.value,
    brightness: brightness.value,
    contrast: contrast.value,
    sepia: sepia.value,
    grayscale: grayscale.value,
    invert: invert.value,
    blur: blur.value
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2))
    setSuccess('已复制调整参数（JSON）')
  } catch {
    error.value = '复制失败，请检查浏览器剪贴板权限'
  }
}

function clearAll() {
  imgEl = null
  hasImage.value = false
  imgWidth.value = 0
  imgHeight.value = 0
  imgBytes.value = 0
  workW.value = 0
  workH.value = 0
  dragging.value = false
  error.value = ''
  success.value = ''
  if (fileInput.value) fileInput.value.value = ''
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

/* ===== 参数变化自动重绘 ===== */
watch(
  [hue, saturation, brightness, contrast, sepia, grayscale, invert, blur, compareOn, comparePos],
  () => render()
)

onMounted(() => window.addEventListener('paste', handlePaste))
onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
/* ===== 上传区域 ===== */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--panel-2);
}
.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
}
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.upload-icon {
  font-size: 1.8rem;
}
.upload-text {
  color: var(--text);
  font-size: 0.9rem;
}
.upload-hint {
  color: var(--muted);
  font-size: 0.75rem;
}

/* ===== 预览 ===== */
.preview-section {
  margin-top: 1rem;
}
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.preview-head .tool-label {
  margin: 0;
}
.compare-toggle {
  margin: 0;
}
.canvas-wrapper {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 0.5rem;
  display: flex;
  justify-content: center;
}
.canvas-wrapper.is-dragging {
  cursor: ew-resize;
}
.adjust-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  touch-action: none;
  cursor: ew-resize;
}
.hint-text {
  color: var(--muted);
  font-size: 0.75rem;
  margin-top: 0.5rem;
  line-height: 1.5;
}
.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--muted);
}
.info-warn {
  color: var(--green);
}
.placeholder-preview {
  margin-top: 1rem;
  border: 1px dashed var(--line);
  padding: 3rem 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  background: var(--panel-2);
}

/* ===== 预设 ===== */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.preset-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  padding: 0.45rem 0.2rem;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.preset-btn:hover {
  border-color: var(--green);
  color: var(--green);
}
.preset-btn:active {
  background: var(--green-soft);
}

/* ===== 控制区 ===== */
.control-section {
  margin-bottom: 0.75rem;
}
.reset-btn {
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .preset-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .upload-area {
    padding: 1rem;
  }
}
</style>
