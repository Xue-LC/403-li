<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>💧 图片水印工具</span>
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
              <label class="tool-label">预览（可拖拽水印）：</label>
              <div class="canvas-wrapper" :class="{ 'is-dragging': dragging }">
                <canvas
                  ref="canvasRef"
                  class="wm-canvas"
                  @pointerdown="onPointerDown"
                  @pointermove="onPointerMove"
                  @pointerup="onPointerUp"
                  @pointercancel="onPointerUp"
                ></canvas>
              </div>
              <div class="image-info">
                <span class="info-item">📐 {{ imgWidth }} × {{ imgHeight }} px</span>
                <span class="info-item">💾 {{ imgSizeText }}</span>
                <span v-if="scaledDown" class="info-item info-warn">
                  ⚠️ 已按 {{ workScaleText }} 缩放处理
                </span>
              </div>
              <div class="hint-text">
                {{ tiled ? '平铺模式下不可拖拽，关闭平铺后可自由移动水印' : '在预览图上拖拽即可移动水印，左侧/中间/右侧自动对齐' }}
              </div>
            </div>
            <div v-else class="placeholder-preview">
              <span>上传图片后在此预览水印效果</span>
            </div>
          </div>

          <!-- 右栏：参数 -->
          <div class="tool-col">
            <label class="tool-label">水印文字：</label>
            <textarea
              class="code-input wm-textarea"
              rows="3"
              v-model="text"
              placeholder="输入水印文字，支持多行"
            ></textarea>

            <label class="tool-label">位置：</label>
            <div class="position-row">
              <div class="grid-9">
                <button
                  v-for="cell in gridCells"
                  :key="cell.key"
                  class="grid-cell"
                  :class="{ active: !tiled && activeCell === cell.key }"
                  :title="cell.label"
                  @click="applyCell(cell)"
                ></button>
              </div>
              <div class="position-side">
                <div class="pos-coord">
                  X: {{ (posX * 100).toFixed(0) }}% / Y: {{ (posY * 100).toFixed(0) }}%
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="tiled" />
                  <span>平铺整图</span>
                </label>
                <button class="mini-btn" @click="resetPosition">↺ 重置位置</button>
              </div>
            </div>

            <div class="control-section">
              <label class="tool-label">字号：{{ fontSize }} px</label>
              <input type="range" class="range-input" v-model.number="fontSize" min="8" max="400" />
              <div class="length-display"><span>{{ fontSize }}</span></div>
            </div>

            <div class="control-section">
              <label class="tool-label">不透明度：{{ Math.round(opacity * 100) }}%</label>
              <input type="range" class="range-input" v-model.number="opacity" min="0.05" max="1" step="0.05" />
              <div class="length-display"><span>{{ Math.round(opacity * 100) }}</span></div>
            </div>

            <div class="control-section">
              <label class="tool-label">旋转角度：{{ rotation }}°</label>
              <input type="range" class="range-input" v-model.number="rotation" min="-180" max="180" />
              <div class="length-display"><span>{{ rotation }}</span></div>
            </div>

            <div class="color-row">
              <div class="color-field">
                <label class="tool-label">文字颜色：</label>
                <div class="input-with-copy">
                  <input class="code-input-sm" v-model="color" />
                  <input type="color" class="color-swatch" v-model="color" />
                </div>
              </div>
              <div class="color-field">
                <label class="tool-label">描边颜色：</label>
                <div class="input-with-copy">
                  <input class="code-input-sm" v-model="strokeColor" />
                  <input type="color" class="color-swatch" v-model="strokeColor" />
                </div>
              </div>
            </div>

            <label class="tool-label">字体：</label>
            <select class="code-input-sm wm-select" v-model="fontFamily">
              <option v-for="f in fontFamilies" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="bold" />
                <span>粗体</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="shadow" />
                <span>投影</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="strokeOn" />
                <span>描边</span>
              </label>
            </div>

            <div v-if="strokeOn" class="control-section">
              <label class="tool-label">描边宽度：{{ strokeWidth }} px</label>
              <input type="range" class="range-input" v-model.number="strokeWidth" min="1" max="20" />
              <div class="length-display"><span>{{ strokeWidth }}</span></div>
            </div>

            <div v-if="tiled" class="control-section">
              <label class="tool-label">平铺间距：{{ tileGap }} × 字号</label>
              <input type="range" class="range-input" v-model.number="tileGap" min="0.5" max="6" step="0.5" />
              <div class="length-display"><span>{{ tileGap }}</span></div>
            </div>
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

/* ===== 水印参数 ===== */
const text = ref('© 403.li')
const fontSize = ref(48)
const opacity = ref(0.6)
const rotation = ref(-30)
const color = ref('#9dff6b')
const strokeColor = ref('#0b0f0b')
const fontFamily = ref("'MapleMono NF CN', monospace")
const bold = ref(true)
const shadow = ref(false)
const strokeOn = ref(false)
const strokeWidth = ref(3)
const tiled = ref(false)
const tileGap = ref(1.5)

/* ===== 位置（归一化 0-1，锚点在文字对齐边上） ===== */
const posX = ref(0.96)
const posY = ref(0.96)
const align = ref('right')
const baseline = ref('bottom')
const activeCell = ref('br')

/* ===== 交互状态 ===== */
const dragOver = ref(false)
const dragging = ref(false)
const error = ref('')
const success = ref('')
let successTimer = null

const fontFamilies = [
  { label: '等宽 (MapleMono)', value: "'MapleMono NF CN', monospace" },
  { label: '无衬线 (Sans)', value: 'system-ui, -apple-system, sans-serif' },
  { label: '衬线 (Serif)', value: 'Georgia, "Times New Roman", serif' },
  { label: '手写体 (Cursive)', value: 'cursive' }
]

const gridCells = [
  { key: 'tl', label: '左上', col: 'left', row: 'top' },
  { key: 'tc', label: '中上', col: 'center', row: 'top' },
  { key: 'tr', label: '右上', col: 'right', row: 'top' },
  { key: 'ml', label: '左中', col: 'left', row: 'middle' },
  { key: 'mc', label: '正中', col: 'center', row: 'middle' },
  { key: 'mr', label: '右中', col: 'right', row: 'middle' },
  { key: 'bl', label: '左下', col: 'left', row: 'bottom' },
  { key: 'bc', label: '中下', col: 'center', row: 'bottom' },
  { key: 'br', label: '右下', col: 'right', row: 'bottom' }
]

const imgSizeText = computed(() => formatSize(imgBytes.value))
const workScaleText = computed(() => {
  if (!imgWidth.value) return ''
  return (workW.value / imgWidth.value).toFixed(2) + 'x'
})

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

function isValidColor(c) {
  if (!c) return false
  if (typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports('color', c)
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)
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

      // 默认字号按图宽自适应
      fontSize.value = clamp(Math.round(workW.value / 22), 12, 400)

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

/* ===== 位置 ===== */
function applyCell(cell) {
  activeCell.value = cell.key
  tiled.value = false
  align.value = cell.col
  baseline.value = cell.row === 'top' ? 'top' : cell.row === 'middle' ? 'middle' : 'bottom'
  posX.value = cell.col === 'left' ? 0.04 : cell.col === 'right' ? 0.96 : 0.5
  posY.value = cell.row === 'top' ? 0.04 : cell.row === 'bottom' ? 0.96 : 0.5
}

function resetPosition() {
  applyCell(gridCells[8])
  rotation.value = -30
  render()
}

function pointerFrac(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  return {
    fx: clamp((e.clientX - rect.left) / rect.width, 0, 1),
    fy: clamp((e.clientY - rect.top) / rect.height, 0, 1)
  }
}

function moveToPosition(fx, fy) {
  posX.value = fx
  posY.value = fy
  align.value = fx < 1 / 3 ? 'left' : fx < 2 / 3 ? 'center' : 'right'
  baseline.value = fy < 1 / 3 ? 'top' : fy < 2 / 3 ? 'middle' : 'bottom'
  activeCell.value = ''
}

function onPointerDown(e) {
  if (!hasImage.value || tiled.value) return
  const frac = pointerFrac(e)
  if (!frac) return
  dragging.value = true
  try {
    canvasRef.value.setPointerCapture(e.pointerId)
  } catch {
    /* 忽略 */
  }
  moveToPosition(frac.fx, frac.fy)
  render()
}

function onPointerMove(e) {
  if (!dragging.value) return
  const frac = pointerFrac(e)
  if (!frac) return
  moveToPosition(frac.fx, frac.fy)
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
function applyFont(ctx, size) {
  ctx.font = `${bold.value ? '700' : '400'} ${size}px ${fontFamily.value}`
}

function drawTextLine(ctx, line, x, y, size) {
  if (strokeOn.value && strokeWidth.value > 0) {
    ctx.save()
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = strokeWidth.value * (size / Math.max(fontSize.value, 1))
    ctx.strokeStyle = isValidColor(strokeColor.value) ? strokeColor.value : '#000000'
    ctx.lineJoin = 'round'
    ctx.strokeText(line, x, y)
    ctx.restore()
  }
  ctx.fillStyle = isValidColor(color.value) ? color.value : '#ffffff'
  ctx.fillText(line, x, y)
}

function render() {
  const canvas = canvasRef.value
  if (!canvas || !imgEl) return
  // Canvas 首次挂载时尺寸为默认 300×150，需要同步为工作尺寸
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
  ctx.drawImage(imgEl, 0, 0, W, H)

  const lines = String(text.value || '').split('\n')
  if (!String(text.value || '').trim()) return

  applyFont(ctx, fontSize.value)
  ctx.globalAlpha = clamp(opacity.value, 0.01, 1)
  ctx.textAlign = tiled.value ? 'center' : align.value
  ctx.textBaseline = tiled.value ? 'middle' : baseline.value

  if (shadow.value) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)'
    ctx.shadowBlur = Math.max(2, fontSize.value * 0.18)
    ctx.shadowOffsetY = Math.max(1, fontSize.value * 0.06)
  } else {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  const lineHeight = fontSize.value * 1.25

  if (tiled.value) {
    ctx.translate(W / 2, H / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    const diag = Math.sqrt(W * W + H * H) / 2
    const textW = Math.max(
      1,
      ...lines.map((l) => ctx.measureText(l).width)
    )
    // 横向：文字宽度 + 间距（间距以字号为单位）；纵向：行高 × 间距（不小于 1.2 倍行高，避免重叠）
    const stepX = textW + fontSize.value * tileGap.value
    const stepY = Math.max(lineHeight * tileGap.value, lineHeight * 1.2)
    let rowIndex = 0
    for (let y = -diag; y <= diag; y += stepY) {
      const offset = rowIndex % 2 === 0 ? 0 : stepX / 2
      for (let x = -diag - offset; x <= diag + offset; x += stepX) {
        lines.forEach((line, li) => {
          drawTextLine(ctx, line, x, y + li * lineHeight, fontSize.value)
        })
      }
      rowIndex++
    }
  } else {
    const x = posX.value * W
    const y = posY.value * H
    ctx.translate(x, y)
    ctx.rotate((rotation.value * Math.PI) / 180)
    // 多行时按对齐方式整体上下居中偏移
    const offset = ((lines.length - 1) * lineHeight) / 2
    lines.forEach((line, li) => {
      drawTextLine(ctx, line, 0, li * lineHeight - offset, fontSize.value)
    })
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

/* ===== 输出 ===== */
function exportPng() {
  const canvas = canvasRef.value
  if (!canvas || !hasImage.value) return
  canvas.toBlob((blob) => {
    if (!blob) {
      error.value = '导出失败，请重试'
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${srcName.value || 'image'}-watermark.png`
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
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('生成图片失败')
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setSuccess('已复制图片到剪贴板')
      return
    }
    throw new Error('当前浏览器不支持复制图片')
  } catch (err) {
    error.value = '复制失败：' + (err.message || '浏览器不支持，请改用导出 PNG')
  }
}

async function copySettings() {
  const cfg = {
    text: text.value,
    fontSize: fontSize.value,
    opacity: opacity.value,
    rotation: rotation.value,
    color: color.value,
    strokeColor: strokeColor.value,
    strokeWidth: strokeOn.value ? strokeWidth.value : 0,
    fontFamily: fontFamily.value,
    bold: bold.value,
    shadow: shadow.value,
    tiled: tiled.value,
    tileGap: tiled.value ? tileGap.value : undefined,
    position: tiled.value ? { mode: 'tile' } : { x: +posX.value.toFixed(3), y: +posY.value.toFixed(3), align: align.value, baseline: baseline.value }
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2))
    setSuccess('已复制水印参数（JSON）')
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
  [text, fontSize, opacity, rotation, color, strokeColor, fontFamily, bold, shadow, strokeOn, strokeWidth, tiled, tileGap, posX, posY, align, baseline],
  () => render()
)

onMounted(() => window.addEventListener('paste', handlePaste))
onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  if (successTimer) clearTimeout(successTimer)
})
</script>

<style scoped>
/* 上传区域 */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
}

.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: center;
}

.upload-icon {
  font-size: 2rem;
}

.upload-text {
  color: var(--text);
  font-size: 13px;
}

.upload-hint {
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
}

.preview-section {
  margin-top: 16px;
}

.canvas-wrapper {
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  padding: 6px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.wm-canvas {
  max-width: 100%;
  max-height: 360px;
  display: block;
  border-radius: 0;
  cursor: grab;
  touch-action: none;
}

.canvas-wrapper.is-dragging .wm-canvas {
  cursor: grabbing;
}

.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.15);
  margin-top: 16px;
}

.image-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.info-item {
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
  background: var(--panel-2);
  padding: 4px 8px;
  border: 1px solid var(--line);
}

.info-item.info-warn {
  color: var(--green);
  border-color: var(--green);
}

.hint-text {
  margin-top: 8px;
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
  line-height: 1.5;
}

/* 输入区 */
.wm-textarea {
  min-height: 68px;
  margin-bottom: 14px;
  resize: vertical;
}

.wm-select {
  width: 100%;
  background: var(--panel-2);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 0;
  font-family: var(--mono);
  font-size: 12px;
  padding: 0 8px;
  height: 40px;
  outline: none;
  cursor: pointer;
  margin-bottom: 14px;
}

.wm-select:focus {
  border-color: var(--green);
}

/* 九宫格 */
.position-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.grid-9 {
  display: grid;
  grid-template-columns: repeat(3, 34px);
  grid-template-rows: repeat(3, 34px);
  gap: 3px;
}

.grid-cell {
  background: var(--panel-2);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.grid-cell:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.grid-cell.active {
  background: var(--green);
  border-color: var(--green);
}

.position-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 130px;
}

.pos-coord {
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
}

.mini-btn {
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  padding: 5px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mini-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

/* 控件 */
.control-section {
  margin-bottom: 12px;
}

.color-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.color-field {
  flex: 1;
  min-width: 150px;
}

.color-swatch {
  width: 38px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--panel-2);
  padding: 2px;
  cursor: pointer;
}

.input-with-copy .color-swatch {
  position: static;
  transform: none;
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 8px 0 14px;
}

/* 响应式 */
@media (max-width: 640px) {
  .upload-area {
    padding: 1.2rem 0.8rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .wm-canvas {
    max-height: 260px;
  }

  .grid-9 {
    grid-template-columns: repeat(3, 30px);
    grid-template-rows: repeat(3, 30px);
  }
}
</style>
