<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 图片取色器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 + 画布取色 -->
          <div class="tool-col">
            <label class="tool-label">上传图片：</label>
            <div
              class="upload-area"
              :class="{ 'upload-dragover': dragOver, 'is-compact': hasImage }"
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
                <span class="upload-hint">支持 PNG / JPEG / WebP / GIF / BMP（≤ 30MB）</span>
              </div>
            </div>

            <template v-if="hasImage">
              <label class="tool-label">画布（悬停预览 / 点击取色）：</label>
              <div ref="wrapperRef" class="canvas-wrapper">
                <canvas
                  ref="canvasRef"
                  class="pick-canvas"
                  @pointermove="onPointerMove"
                  @pointerdown="onPointerDown"
                  @pointerleave="onPointerLeave"
                  @pointercancel="onPointerLeave"
                ></canvas>

                <!-- 放大镜 -->
                <div
                  v-show="loupeVisible"
                  class="loupe"
                  :style="{ left: loupeX + 'px', top: loupeY + 'px', width: LOUPE + 'px', height: LOUPE + 'px' }"
                >
                  <canvas ref="loupeRef" :width="LOUPE" :height="LOUPE"></canvas>
                  <span class="loupe-tag">{{ zoom }}×</span>
                </div>
              </div>

              <div class="image-info">
                <span class="info-item">📐 {{ imgWidth }} × {{ imgHeight }} px</span>
                <span class="info-item">💾 {{ imgSizeText }}</span>
                <span class="info-item">🖱️ {{ hoverText }}</span>
                <span v-if="scaledDown" class="info-item info-warn">
                  ⚠️ 画面已按 {{ workScaleText }} 缩放采样
                </span>
              </div>
              <div class="hint-text">
                鼠标悬停实时预览颜色，单击（或触摸）即取色并记入调色板；同一颜色只保留一次。
              </div>
            </template>
            <div v-else class="placeholder-preview">
              <span>上传图片后在此点击取色</span>
            </div>
          </div>

          <!-- 右栏：当前颜色 + 调色板 -->
          <div class="tool-col">
            <label class="tool-label">当前颜色：</label>
            <div v-if="current" class="current-panel">
              <div class="current-swatch" :style="{ background: current.hex }"></div>
              <div class="value-rows">
                <div v-for="row in valueRows" :key="row.label" class="value-row">
                  <span class="value-label">{{ row.label }}</span>
                  <span class="value-text">{{ row.value }}</span>
                  <button class="mini-btn" :title="'复制 ' + row.label" @click="copyText(row.value, row.label)">
                    📋
                  </button>
                </div>
                <div class="value-row">
                  <span class="value-label">坐标</span>
                  <span class="value-text">x: {{ current.x }}, y: {{ current.y }}</span>
                </div>
              </div>
              <button class="add-btn" @click="addCurrent">＋ 加入调色板</button>
            </div>
            <div v-else class="placeholder-preview small">
              <span>取色后在此显示 HEX / RGB / HSL</span>
            </div>

            <label class="tool-label">调色板（{{ history.length }} / {{ MAX_HISTORY }}）：</label>
            <div v-if="history.length" class="history-grid">
              <div v-for="(item, i) in history" :key="item.hex + i" class="history-item">
                <button
                  class="history-swatch"
                  :style="{ background: item.hex }"
                  :title="item.hex + ' · 点击复制'"
                  @click="copyText(item.hex, '色值')"
                ></button>
                <span class="history-hex">{{ item.hex.slice(1).toUpperCase() }}</span>
                <button class="history-del" title="从调色板移除" @click="removeHistory(i)">✕</button>
              </div>
            </div>
            <div v-else class="placeholder-preview small">
              <span>调色板还是空的，点击图片开始取色</span>
            </div>

            <label class="tool-label">放大镜倍数：{{ zoom }}×</label>
            <input type="range" class="range-input" v-model.number="zoom" min="2" max="20" step="1" />
            <div class="length-display"><span>{{ zoom }}×</span></div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showMarkers" />
                <span>在图上标记取色点</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showLoupe" />
                <span>启用放大镜</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 按钮组（双栏外） -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="!history.length" @click="exportPalette">
            💾 导出调色板 PNG
          </button>
          <button class="tool-button" :disabled="!history.length" @click="copyHexList">
            📋 复制色值列表
          </button>
          <button class="tool-button" :disabled="!history.length" @click="copyPaletteJson">
            📄 复制调色板 JSON
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

const LOUPE = 132
const MAX_EDGE = 2400
const MAX_HISTORY = 64

/* ===== DOM 引用 ===== */
const fileInput = ref(null)
const canvasRef = ref(null)
const loupeRef = ref(null)
const wrapperRef = ref(null)

/* ===== 图片状态 ===== */
let imgEl = null
let imgData = null // 缓存的像素数据，避免每次 getImageData
const hasImage = ref(false)
const srcName = ref('image')
const imgWidth = ref(0)
const imgHeight = ref(0)
const imgBytes = ref(0)
const workW = ref(0)
const workH = ref(0)
const scaledDown = computed(() => imgWidth.value > workW.value)
const workScaleText = computed(() => {
  if (!imgWidth.value) return ''
  return (workW.value / imgWidth.value).toFixed(2) + 'x'
})
const imgSizeText = computed(() => formatSize(imgBytes.value))

/* ===== 取色状态 ===== */
const current = ref(null) // { hex, r, g, b, h, s, l, x, y }
const history = ref([]) // [{ hex, r, g, b, x, y }]
const markers = ref([]) // [{ x, y, hex }]
const zoom = ref(8)
const showMarkers = ref(true)
const showLoupe = ref(true)
const loupeVisible = ref(false)
const loupeX = ref(0)
const loupeY = ref(0)
const hoverPos = ref(null)

/* ===== 交互状态 ===== */
const dragOver = ref(false)
const error = ref('')
const success = ref('')
let successTimer = null

/* ===== 派生值 ===== */
const hoverText = computed(() =>
  hoverPos.value ? `x: ${hoverPos.value.x}, y: ${hoverPos.value.y}` : '未定位'
)

const valueRows = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { label: 'HEX', value: c.hex },
    { label: 'RGB', value: `rgb(${c.r}, ${c.g}, ${c.b})` },
    { label: 'HSL', value: `hsl(${c.h}, ${c.s}%, ${c.l}%)` }
  ]
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
  successTimer = setTimeout(() => (success.value = ''), 2200)
}

function readVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch {
    return fallback
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0)
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

async function copyText(text, label = '内容') {
  if (!text) return
  error.value = ''
  try {
    await navigator.clipboard.writeText(text)
    setSuccess(`已复制${label}：${text}`)
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setSuccess(`已复制${label}：${text}`)
    } catch {
      error.value = '复制失败，请手动选择文本复制'
    }
  }
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

      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
      workW.value = Math.max(1, Math.round(img.naturalWidth * scale))
      workH.value = Math.max(1, Math.round(img.naturalHeight * scale))

      const canvas = canvasRef.value
      if (canvas) {
        canvas.width = workW.value
        canvas.height = workH.value
      }

      history.value = []
      markers.value = []
      current.value = null
      hoverPos.value = null
      loupeVisible.value = false
      imgData = null
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

/* ===== 渲染 ===== */
function drawMarker(ctx, m) {
  const accent = readVar('--green', '#9dff6b')
  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.beginPath()
  ctx.arc(m.x + 0.5, m.y + 0.5, 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = accent
  ctx.beginPath()
  ctx.arc(m.x + 0.5, m.y + 0.5, 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

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
  ctx.drawImage(imgEl, 0, 0, W, H)
  // 采样前缓存原始像素，标记点不参与取色
  try {
    imgData = ctx.getImageData(0, 0, W, H).data
  } catch {
    imgData = null
    error.value = '无法读取图片像素，请换一张图片重试'
    return
  }
  if (showMarkers.value) markers.value.forEach((m) => drawMarker(ctx, m))
}

/* ===== 取色 ===== */
function canvasPixelPos(e) {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  const x = clamp(Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width), 0, canvas.width - 1)
  const y = clamp(Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height), 0, canvas.height - 1)
  return { x, y }
}

function readPixel(x, y) {
  if (!imgData || !canvasRef.value) return null
  const W = canvasRef.value.width
  const idx = (y * W + x) * 4
  if (idx < 0 || idx + 2 >= imgData.length) return null
  return { r: imgData[idx], g: imgData[idx + 1], b: imgData[idx + 2] }
}

function setCurrent(x, y) {
  const px = readPixel(x, y)
  if (!px) return null
  const hex = rgbToHex(px.r, px.g, px.b)
  const hsl = rgbToHsl(px.r, px.g, px.b)
  current.value = { hex, r: px.r, g: px.g, b: px.b, h: hsl.h, s: hsl.s, l: hsl.l, x, y }
  return current.value
}

function addCurrent() {
  const c = current.value
  if (!c) return
  pushColor(c)
}

function pushColor(c) {
  error.value = ''
  const exist = history.value.findIndex((it) => it.hex === c.hex)
  if (exist >= 0) {
    setSuccess(`${c.hex} 已在调色板中（共 ${history.value.length} 色）`)
    return
  }
  if (history.value.length >= MAX_HISTORY) {
    history.value.shift()
  }
  history.value.unshift({ hex: c.hex, r: c.r, g: c.g, b: c.b, x: c.x, y: c.y })
  const pos = { x: c.x, y: c.y, hex: c.hex }
  markers.value.push(pos)
  if (markers.value.length > 200) markers.value.shift()
  render()
  setSuccess(`已加入调色板：${c.hex}`)
}

function removeHistory(i) {
  const item = history.value[i]
  history.value.splice(i, 1)
  const mi = markers.value.findIndex((m) => m.hex === item.hex && m.x === item.x && m.y === item.y)
  if (mi >= 0) markers.value.splice(mi, 1)
  render()
}

/* ===== 放大镜 ===== */
function drawLoupe(x, y) {
  const lc = loupeRef.value
  const mc = canvasRef.value
  if (!lc || !mc) return
  if (lc.width !== LOUPE || lc.height !== LOUPE) {
    lc.width = LOUPE
    lc.height = LOUPE
  }
  const ctx = lc.getContext('2d')
  const bg = readVar('--panel-2', '#0b0f0b')
  const accent = readVar('--green', '#9dff6b')
  const src = Math.max(1, Math.round(LOUPE / zoom.value))
  const sx = x - Math.floor(src / 2)
  const sy = y - Math.floor(src / 2)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, LOUPE, LOUPE)
  ctx.drawImage(mc, sx, sy, src, src, 0, 0, LOUPE, LOUPE)

  const cell = LOUPE / src
  const cx = (x - sx) * cell
  const cy = (y - sy) * cell
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.lineWidth = 4
  ctx.strokeRect(cx, cy, cell, cell)
  ctx.strokeStyle = accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(cx, cy, cell, cell)
}

function positionLoupe(e) {
  const wrapper = wrapperRef.value
  if (!wrapper) return
  const wr = wrapper.getBoundingClientRect()
  let lx = e.clientX - wr.left + 18
  let ly = e.clientY - wr.top + 18
  if (lx + LOUPE > wr.width - 4) lx = Math.max(4, e.clientX - wr.left - LOUPE - 18)
  if (ly + LOUPE > wr.height - 4) ly = Math.max(4, e.clientY - wr.top - LOUPE - 18)
  loupeX.value = lx
  loupeY.value = ly
}

function onPointerMove(e) {
  if (!hasImage.value || !imgData) return
  const pos = canvasPixelPos(e)
  if (!pos) return
  hoverPos.value = pos
  setCurrent(pos.x, pos.y)
  if (showLoupe.value) {
    loupeVisible.value = true
    positionLoupe(e)
    drawLoupe(pos.x, pos.y)
  } else {
    loupeVisible.value = false
  }
}

function onPointerDown(e) {
  if (!hasImage.value || !imgData) return
  const pos = canvasPixelPos(e)
  if (!pos) return
  if (e.pointerType !== 'mouse') {
    hoverPos.value = pos
    if (showLoupe.value) {
      loupeVisible.value = true
      positionLoupe(e)
      drawLoupe(pos.x, pos.y)
    }
    try {
      canvasRef.value.setPointerCapture(e.pointerId)
    } catch {
      /* 忽略 */
    }
  }
  const c = setCurrent(pos.x, pos.y)
  if (c) pushColor(c)
}

function onPointerLeave() {
  loupeVisible.value = false
}

/* ===== 导出 / 复制 ===== */
function exportPalette() {
  const list = history.value
  if (!list.length) {
    error.value = '调色板为空，请先在图片上取色'
    return
  }
  error.value = ''
  const pad = 20
  const gap = 10
  const header = 34
  const cellW = 110
  const swatchH = 84
  const labelH = 30
  const cellH = swatchH + labelH
  const cols = Math.min(6, list.length)
  const rows = Math.ceil(list.length / cols)
  const W = pad * 2 + cols * cellW + (cols - 1) * gap
  const H = pad * 2 + header + rows * cellH + (rows - 1) * gap
  const dpr = 2

  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const bg = readVar('--panel', '#0b0f0b')
  const line = readVar('--line', 'rgba(157,255,107,0.25)')
  const accent = readVar('--green', '#9dff6b')
  const textColor = readVar('--text', '#e6ffe6')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = accent
  ctx.font = '13px "MapleMono NF CN", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText(`403.LI PALETTE · ${list.length} COLORS`, pad, pad + header / 2)

  ctx.font = '12px "MapleMono NF CN", monospace'
  list.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = pad + col * (cellW + gap)
    const y = pad + header + row * (cellH + gap)
    ctx.fillStyle = item.hex
    ctx.fillRect(x, y, cellW, swatchH)
    ctx.strokeStyle = line
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, cellW - 1, swatchH - 1)
    ctx.fillStyle = textColor
    ctx.fillText(item.hex.toUpperCase(), x + 2, y + swatchH + labelH / 2)
  })

  canvas.toBlob((blob) => {
    if (!blob) {
      error.value = '导出失败，请重试'
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${srcName.value || 'image'}-palette.png`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setSuccess('已导出调色板 PNG')
  }, 'image/png')
}

function copyHexList() {
  if (!history.value.length) return
  copyText(history.value.map((it) => it.hex).join('\n'), '色值列表')
}

function copyPaletteJson() {
  if (!history.value.length) return
  const data = {
    source: srcName.value,
    size: `${imgWidth.value}x${imgHeight.value}`,
    colors: history.value.map((it) => {
      const hsl = rgbToHsl(it.r, it.g, it.b)
      return { hex: it.hex, rgb: `rgb(${it.r}, ${it.g}, ${it.b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }
    })
  }
  copyText(JSON.stringify(data, null, 2), '调色板 JSON')
}

function clearAll() {
  imgEl = null
  imgData = null
  hasImage.value = false
  imgWidth.value = 0
  imgHeight.value = 0
  imgBytes.value = 0
  workW.value = 0
  workH.value = 0
  history.value = []
  markers.value = []
  current.value = null
  hoverPos.value = null
  loupeVisible.value = false
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

/* ===== 监听 ===== */
watch(showMarkers, () => render())
watch(zoom, () => {
  if (loupeVisible.value && hoverPos.value) drawLoupe(hoverPos.value.x, hoverPos.value.y)
})
watch(showLoupe, (v) => {
  if (!v) loupeVisible.value = false
})

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

.upload-area.is-compact {
  padding: 0.7rem;
}

.upload-area.is-compact .upload-icon {
  display: none;
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

/* 画布 */
.canvas-wrapper {
  position: relative;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  padding: 6px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.pick-canvas {
  max-width: 100%;
  max-height: 420px;
  display: block;
  cursor: crosshair;
  touch-action: none;
  border-radius: 0;
}

.loupe {
  position: absolute;
  pointer-events: none;
  border: 1px solid var(--line-strong);
  background: var(--panel-2);
  box-shadow: 0 0 16px var(--green-glow);
  z-index: 5;
}

.loupe canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.loupe-tag {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--green);
  background: rgba(0, 0, 0, 0.6);
  padding: 0 3px;
}

/* 信息条 */
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

.placeholder-preview {
  border: 1px dashed var(--line);
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.15);
  margin-top: 16px;
}

.placeholder-preview.small {
  padding: 1.1rem 0.8rem;
  font-size: 12px;
  margin-top: 0;
}

/* 当前颜色 */
.current-panel {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.current-swatch {
  height: 84px;
  border: 1px solid var(--line);
}

.value-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
}

.value-label {
  color: var(--green);
  min-width: 36px;
  text-transform: uppercase;
}

.value-text {
  flex: 1;
  color: var(--text);
  word-break: break-all;
}

.add-btn {
  background: var(--green-soft);
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  min-height: 36px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.add-btn:hover {
  background: rgba(157, 255, 107, 0.2);
  box-shadow: 0 0 16px var(--green-glow);
}

/* 调色板 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
  gap: 8px;
}

.history-item {
  position: relative;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-swatch {
  width: 100%;
  height: 40px;
  border: 1px solid var(--line);
  cursor: pointer;
  padding: 0;
  transition: box-shadow 0.2s;
}

.history-swatch:hover {
  box-shadow: 0 0 12px var(--green-glow);
}

.history-hex {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  text-align: center;
  letter-spacing: 0.5px;
}

.history-del {
  position: absolute;
  top: -1px;
  right: -1px;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 10px;
  line-height: 1;
  padding: 2px 4px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.history-item:hover .history-del {
  opacity: 1;
}

.history-del:hover {
  color: var(--red);
  border-color: var(--red);
}

/* 小按钮 */
.mini-btn {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  padding: 4px 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.mini-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.length-display {
  text-align: right;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  margin-top: -4px;
}

/* 响应式 */
@media (max-width: 640px) {
  .upload-area {
    padding: 1.2rem 0.8rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .pick-canvas {
    max-height: 300px;
  }

  .loupe {
    display: none;
  }

  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  }

  .history-del {
    opacity: 1;
  }
}
</style>
