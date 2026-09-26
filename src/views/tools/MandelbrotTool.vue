<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌀 曼德博集合可视化器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：参数控制 -->
          <div class="tool-col">
            <label class="tool-label">预设视点：</label>
            <div class="preset-grid">
              <button
                v-for="p in PRESETS"
                :key="p.key"
                class="preset-btn"
                :class="{ active: presetKey === p.key }"
                @click="applyPreset(p)"
              >
                {{ p.label }}
              </button>
            </div>

            <label class="tool-label">最大迭代次数：{{ state.maxIter }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="state.maxIter" min="50" max="3000" step="50" class="range-input" />
              <span class="range-value">{{ state.maxIter }}</span>
            </div>

            <label class="tool-label">逃逸半径：{{ escapeLabel }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="state.escape" min="2" max="10" step="0.5" class="range-input" />
              <span class="range-value">{{ escapeLabel }}</span>
            </div>

            <label class="tool-label">渲染分辨率：</label>
            <div class="radio-group">
              <label v-for="r in RESOLUTIONS" :key="r.key" class="radio-label">
                <input type="radio" v-model="resKey" :value="r.key" />
                <span>{{ r.label }}</span>
              </label>
            </div>

            <label class="tool-label">配色方案：</label>
            <div class="radio-group">
              <label v-for="s in SCHEMES" :key="s.key" class="radio-label">
                <input type="radio" v-model="state.scheme" :value="s.key" />
                <span>{{ s.label }}</span>
              </label>
            </div>

            <label class="tool-label">渲染选项：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="state.smooth" />
                <span>平滑着色（连续渐变，无断层）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="state.fast" />
                <span>内部快速判定（跳过主心形/圆球）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="state.cyclic" />
                <span>色彩循环（重复色带）</span>
              </label>
            </div>

            <label class="tool-label">视图坐标（可手动输入后回车）：</label>
            <div class="coord-grid">
              <div class="coord-field">
                <span class="coord-name">实部 Re</span>
                <input class="code-input-sm" :value="inRe" @change="applyCoord('re', $event)" @keyup.enter="applyCoord('re', $event)" />
              </div>
              <div class="coord-field">
                <span class="coord-name">虚部 Im</span>
                <input class="code-input-sm" :value="inIm" @change="applyCoord('im', $event)" @keyup.enter="applyCoord('im', $event)" />
              </div>
              <div class="coord-field">
                <span class="coord-name">视点宽度</span>
                <input class="code-input-sm" :value="inWidth" @change="applyCoord('width', $event)" @keyup.enter="applyCoord('width', $event)" />
              </div>
            </div>
          </div>

          <!-- 右栏：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="canvas-wrapper">
              <canvas
                ref="canvasRef"
                width="840"
                height="560"
                tabindex="0"
                :style="{ transform: dragTransform }"
                @dblclick="onDblClick"
              ></canvas>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
              <div v-if="rendering" class="render-bar">
                <span :style="{ width: progress + '%' }"></span>
              </div>
            </div>

            <div class="hint-line">
              🖱 滚轮缩放 · 拖拽平移 · 双击放大（Shift+双击缩小）<br />
              ⌨️ 方向键平移 · +/− 缩放 · 0 重置视图
            </div>

            <label class="tool-label">光标复平面坐标：</label>
            <div class="result-display coord-readout">
              {{ hoverText }}
              <button class="copy-btn" style="top: 8px; right: 8px" @click="copyView" title="复制视图参数">📋</button>
            </div>

            <div v-if="precisionWarning" class="warn-line">⚠️ {{ precisionWarning }}</div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">迭代上限</span>
            <span class="stat-value">{{ state.maxIter }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">缩放倍率</span>
            <span class="stat-value">{{ zoomText }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">视点宽度</span>
            <span class="stat-value">{{ fmtCoord(state.width) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">中心坐标</span>
            <span class="stat-value">{{ fmtCoord(state.cx) }} {{ state.cy < 0 ? '-' : '+' }} {{ fmtCoord(Math.abs(state.cy)) }}i</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">渲染耗时</span>
            <span class="stat-value">{{ rendering ? progress + '%' : renderMs + 'ms' }}</span>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button" @click="resetView">重置视图</button>
          <button class="tool-button" @click="zoomCenter(0.5)">放大 ×2</button>
          <button class="tool-button" @click="zoomCenter(2)">缩小 ÷2</button>
          <button class="tool-button" @click="copyImage">复制图片</button>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="downloadPng">导出 PNG</button>
          <button class="tool-button" @click="copyView">复制视图参数</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 常量 ---------- */
const BASE_WIDTH = 3.4

const RESOLUTIONS = [
  { key: 'hd', label: '高清', w: 840, h: 560 },
  { key: 'md', label: '标准', w: 560, h: 373 },
  { key: 'sd', label: '草稿', w: 336, h: 224 }
]

const SCHEMES = [
  { key: 'theme', label: '主题绿' },
  { key: 'neon', label: '荧光绿' },
  { key: 'mono', label: '灰度' },
  { key: 'ember', label: '暖焰' },
  { key: 'spectrum', label: '光谱' }
]

const PRESETS = [
  { key: 'full', label: '全览', cx: -0.75, cy: 0, width: 3.4, iter: 300 },
  { key: 'seahorse', label: '海马谷', cx: -0.743643887037151, cy: 0.13182590420533, width: 0.0009, iter: 900 },
  { key: 'elephant', label: '象谷', cx: 0.285, cy: 0.01, width: 0.012, iter: 800 },
  { key: 'spiral', label: '螺旋', cx: -0.7269, cy: 0.1889, width: 0.006, iter: 800 },
  { key: 'bolt', label: '闪电', cx: -1.25066, cy: 0.02012, width: 0.006, iter: 900 },
  { key: 'mini', label: '迷你曼德博', cx: -1.74995, cy: 0.0000035, width: 0.0006, iter: 1200 }
]

/* ---------- 状态 ---------- */
const canvasRef = ref(null)
const resKey = ref('hd')
const presetKey = ref('full')

const state = reactive({
  cx: -0.75,
  cy: 0,
  width: BASE_WIDTH,
  maxIter: 300,
  escape: 4,
  scheme: 'theme',
  smooth: true,
  fast: true,
  cyclic: false
})

const inRe = ref(String(state.cx))
const inIm = ref(String(state.cy))
const inWidth = ref(String(state.width))

const hoverText = ref('把鼠标移到画布上查看复平面坐标…')
const rendering = ref(false)
const progress = ref(0)
const renderMs = ref(0)
const dragOffset = reactive({ x: 0, y: 0 })
const dragging = ref(false)
const error = ref('')
const success = ref('')

const size = computed(() => RESOLUTIONS.find((r) => r.key === resKey.value) || RESOLUTIONS[0])
const escapeLabel = computed(() => Number(state.escape).toFixed(1))
const dragTransform = computed(() =>
  dragOffset.x || dragOffset.y ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none'
)

const zoomText = computed(() => {
  const z = BASE_WIDTH / state.width
  if (z >= 1000) return z.toExponential(2) + '×'
  if (z >= 10) return z.toFixed(1) + '×'
  return z.toFixed(2) + '×'
})

const precisionWarning = computed(() =>
  state.width < 1e-12 ? '已接近双精度浮点极限（宽度 < 1e-12），继续放大将出现像素化条纹' : ''
)

/* ---------- 数值与颜色工具 ---------- */
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function fmtCoord(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0'
  if (n === 0) return '0'
  const a = Math.abs(n)
  if (a < 1e-4 || a >= 1e7) return n.toExponential(8)
  return String(Number(n.toPrecision(12)))
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (!Number.isFinite(n)) return [157, 255, 107]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixRgb(a, b, t) {
  const k = clamp(t, 0, 1)
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

function hslRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

/* 生成 1024 级调色板（LUT），避免逐像素做插值 */
function buildLut(scheme, green, bg) {
  const dark = mixRgb(bg, [0, 0, 0], 0.5)
  let stops
  switch (scheme) {
    case 'mono':
      stops = [[0, 0, 0], [70, 70, 70], [150, 150, 150], [255, 255, 255]]
      break
    case 'neon':
      stops = [[4, 14, 7], [11, 52, 20], [29, 133, 45], [95, 214, 95], [205, 255, 180]]
      break
    case 'ember':
      stops = [[6, 4, 0], [70, 18, 0], [186, 72, 0], [255, 178, 20], [255, 252, 235]]
      break
    case 'spectrum':
      stops = [
        hslRgb(58, 1, 0.84),
        hslRgb(85, 1, 0.62),
        hslRgb(110, 1, 0.56),
        hslRgb(140, 1, 0.52),
        hslRgb(158, 1, 0.4),
        hslRgb(88, 0.92, 0.9)
      ]
      break
    default:
      stops = [
        dark,
        mixRgb(green, dark, 0.55),
        green,
        mixRgb(green, [255, 255, 255], 0.5),
        mixRgb(green, [255, 255, 255], 0.86)
      ]
  }
  const N = 1024
  const lut = new Uint8ClampedArray(N * 3)
  const segs = stops.length - 1
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * segs
    const s = Math.min(segs - 1, Math.floor(t))
    const c = mixRgb(stops[s], stops[s + 1], t - s)
    lut[i * 3] = c[0]
    lut[i * 3 + 1] = c[1]
    lut[i * 3 + 2] = c[2]
  }
  return lut
}

/* 主心形 + 周期 2 圆球的内部判定（跳过无谓迭代） */
function inInterior(cr, ci) {
  const ci2 = ci * ci
  const x = cr - 0.25
  const q = x * x + ci2
  if (q * (q + x) <= 0.25 * ci2) return true
  const y = cr + 1
  return y * y + ci2 <= 0.0625
}

/* ---------- 渲染器（分块渐进渲染，保持界面响应） ---------- */
/* 每帧行数自适应：便宜视图放大块（减少 putImageData 次数），昂贵视图缩小块（保持帧率） */
const CHUNK_MIN = 4
const CHUNK_MAX = 64
const FRAME_BUDGET = 30 /* 目标单帧计算耗时（ms） */
let rowsPerChunk = 24
let rafId = 0
let renderTimer = null
let successTimer = null
let rCtx = null
let rImg = null
let rLut = null
let rInner = [8, 12, 10]
let rY = 0
let rStart = 0
let rMaxIter = 300
let rEscSq = 16
let rLogR = Math.LN2
let rInvSqrtIter = 1
let rSmooth = true
let rCyclic = false
let rFast = true

function scheduleRender(delay = 90) {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(startRender, delay)
}

function startRender() {
  const c = canvasRef.value
  if (!c) return
  cancelAnimationFrame(rafId)
  rafId = 0
  const { w, h } = size.value
  if (c.width !== w || c.height !== h) {
    c.width = w
    c.height = h
  }
  const ctx = c.getContext('2d')
  const green = hexToRgb(cssVar('--green', '#9dff6b'))
  const bg = hexToRgb(cssVar('--panel-2', '#0f1317'))

  rCtx = ctx
  rLut = buildLut(state.scheme, green, bg)
  rInner = bg
  rImg = ctx.createImageData(w, h)
  rY = 0
  rMaxIter = Math.max(1, Math.round(Number(state.maxIter) || 1))
  rInvSqrtIter = 1 / Math.sqrt(rMaxIter)
  const re = Math.max(2, Number(state.escape) || 2)
  rEscSq = re * re
  rLogR = Math.log(re)
  rSmooth = !!state.smooth
  rCyclic = !!state.cyclic
  rFast = !!state.fast
  rStart = performance.now()
  rowsPerChunk = 24
  rendering.value = true
  progress.value = 0
  rafId = requestAnimationFrame(renderChunk)
}

function renderChunk() {
  rafId = 0
  if (!rImg || !rCtx) return
  const { w, h } = size.value
  const unit = state.width / w
  const hh = (h * unit) / 2
  const centerX = state.cx
  const centerY = state.cy
  const maxIter = rMaxIter
  const escSq = rEscSq
  const logR = rLogR
  const lut = rLut
  const inner = rInner
  const data = rImg.data
  const smooth = rSmooth
  const cyclic = rCyclic
  const fast = rFast
  const invSqrtIter = rInvSqrtIter

  const yStart = Math.min(h, rY)
  const yEnd = Math.min(h, yStart + rowsPerChunk)
  const chunkStart = performance.now()

  for (let y = yStart; y < yEnd; y++) {
    const ci = centerY + hh - (y + 0.5) * unit
    let idx = y * w * 4
    for (let x = 0; x < w; x++) {
      const cr = centerX + (x + 0.5 - w / 2) * unit
      let zr = 0
      let zi = 0
      let zr2 = 0
      let zi2 = 0
      let i = 0
      let escaped = false

      if (!(fast && inInterior(cr, ci))) {
        for (; i < maxIter; i++) {
          zi = 2 * zr * zi + ci
          zr = zr2 - zi2 + cr
          zr2 = zr * zr
          zi2 = zi * zi
          if (zr2 + zi2 > escSq) {
            escaped = true
            break
          }
        }
      }

      if (!escaped) {
        data[idx] = inner[0]
        data[idx + 1] = inner[1]
        data[idx + 2] = inner[2]
        data[idx + 3] = 255
      } else {
        let v = i
        if (smooth) {
          const logZn = Math.log(zr2 + zi2) / 2
          if (logZn > logR) {
            const nu = Math.log(logZn / logR) / Math.LN2
            const sm = i + 1 - nu
            if (Number.isFinite(sm)) v = sm
          }
        }
        let t
        if (cyclic) {
          t = (v * 0.02) % 1
          if (t < 0) t += 1
        } else {
          t = Math.sqrt(v > 0 ? v : 0) * invSqrtIter
        }
        if (t > 1) t = 1
        const p = ((t * 1023) | 0) * 3
        data[idx] = lut[p]
        data[idx + 1] = lut[p + 1]
        data[idx + 2] = lut[p + 2]
        data[idx + 3] = 255
      }
      idx += 4
    }
  }

  rCtx.putImageData(rImg, 0, 0, 0, yStart, w, Math.max(0, yEnd - yStart))
  rY = yEnd
  progress.value = Math.round((rY / h) * 100)

  /* 按实测耗时比例逼近单帧预算：便宜视图一步放大，昂贵视图一步缩小 */
  const cost = performance.now() - chunkStart
  if (cost > 1) rowsPerChunk = clamp(Math.round((rowsPerChunk * FRAME_BUDGET) / cost), CHUNK_MIN, CHUNK_MAX)

  if (rY < h) {
    rafId = requestAnimationFrame(renderChunk)
  } else {
    rendering.value = false
    progress.value = 100
    renderMs.value = Math.round(performance.now() - rStart)
  }
}

/* ---------- 视图操作 ---------- */
function clampWidth(w) {
  return clamp(Number(w) || BASE_WIDTH, 1e-14, 8)
}

/* 以画布归一化坐标 (fx, fy) 为锚点缩放，factor < 1 表示放大 */
function zoomAt(fx, fy, factor) {
  const { w, h } = size.value
  const oldW = state.width
  const newW = clampWidth(oldW * factor)
  const k = newW / oldW
  state.cx = state.cx + (fx - 0.5) * oldW - (fx - 0.5) * newW
  state.cy = state.cy - (fy - 0.5) * oldW * (h / w) + (fy - 0.5) * newW * (h / w)
  state.width = newW
  presetKey.value = ''
}

function zoomCenter(factor) {
  zoomAt(0.5, 0.5, factor)
}

function panByPixels(dx, dy) {
  const { w, h } = size.value
  state.cx = state.cx - (dx / w) * state.width
  state.cy = state.cy + (dy / h) * state.width * (h / w)
  presetKey.value = ''
}

function resetView() {
  state.cx = -0.75
  state.cy = 0
  state.width = BASE_WIDTH
  state.maxIter = 300
  state.escape = 4
  presetKey.value = 'full'
  flashSuccess('视图已重置')
}

function applyPreset(p) {
  state.cx = p.cx
  state.cy = p.cy
  state.width = clampWidth(p.width)
  state.maxIter = p.iter
  presetKey.value = p.key
  flashSuccess(`已切换到「${p.label}」视点`)
}

/* ---------- 鼠标 / 触控交互 ---------- */
let panState = null

function canvasPoint(clientX, clientY) {
  const c = canvasRef.value
  if (!c) return { fx: 0.5, fy: 0.5, inside: false }
  const r = c.getBoundingClientRect()
  const fx = (clientX - r.left) / r.width
  const fy = (clientY - r.top) / r.height
  return { fx, fy, inside: fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1 }
}

function complexAt(fx, fy) {
  const { w, h } = size.value
  const re = state.cx + (fx - 0.5) * state.width
  const im = state.cy - (fy - 0.5) * state.width * (h / w)
  return { re, im }
}

function onWheel(e) {
  e.preventDefault()
  const { fx, fy } = canvasPoint(e.clientX, e.clientY)
  const factor = clamp(Math.exp(Math.abs(e.deltaY) * 0.0018), 0.2, 5)
  zoomAt(fx, fy, e.deltaY > 0 ? factor : 1 / factor)
}

function onMouseDown(e) {
  if (e.button !== 0) return
  e.preventDefault()
  const c = canvasRef.value
  if (c) c.focus()
  panState = { x: e.clientX, y: e.clientY }
  dragging.value = true
  dragOffset.x = 0
  dragOffset.y = 0
  const move = (ev) => {
    if (!panState) return
    const dx = ev.clientX - panState.x
    const dy = ev.clientY - panState.y
    dragOffset.x = dx
    dragOffset.y = dy
  }
  const up = (ev) => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
    if (!panState) return
    const dx = ev.clientX - panState.x
    const dy = ev.clientY - panState.y
    panState = null
    dragging.value = false
    dragOffset.x = 0
    dragOffset.y = 0
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panByPixels(dx, dy)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function onHover(e) {
  if (dragging.value) return
  const { fx, fy, inside } = canvasPoint(e.clientX, e.clientY)
  if (!inside) return
  const { re, im } = complexAt(fx, fy)
  hoverText.value = `Re ${fmtCoord(re)}  Im ${fmtCoord(im)}`
}

function onMouseLeave() {
  if (!dragging.value) hoverText.value = '把鼠标移到画布上查看复平面坐标…'
}

function onDblClick(e) {
  const { fx, fy } = canvasPoint(e.clientX, e.clientY)
  zoomAt(fx, fy, e.shiftKey ? 2 : 0.5)
}

/* 触控：单指平移、双指缩放 */
function onTouchStart(e) {
  if (e.touches.length === 1) {
    panState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY }
    dragging.value = true
    dragOffset.x = 0
    dragOffset.y = 0
  } else if (e.touches.length === 2) {
    const [a, b] = e.touches
    panState = {
      mode: 'pinch',
      d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1
    }
    dragging.value = false
    dragOffset.x = 0
    dragOffset.y = 0
  }
}

function onTouchMove(e) {
  e.preventDefault()
  if (!panState) return
  if (panState.mode === 'pan' && e.touches.length === 1) {
    const dx = e.touches[0].clientX - panState.x
    const dy = e.touches[0].clientY - panState.y
    dragOffset.x = dx
    dragOffset.y = dy
  } else if (panState.mode === 'pinch' && e.touches.length === 2) {
    const [a, b] = e.touches
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1
    const factor = clamp(panState.d / d, 0.05, 20)
    const { fx, fy } = canvasPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
    zoomAt(fx, fy, factor)
    panState.d = d
  }
}

function onTouchEnd() {
  if (panState && panState.mode === 'pan') {
    const { x: dx, y: dy } = dragOffset
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panByPixels(dx, dy)
  }
  panState = null
  dragging.value = false
  dragOffset.x = 0
  dragOffset.y = 0
}

function onKeyDown(e) {
  const step = 0.12
  const { w, h } = size.value
  let handled = true
  switch (e.key) {
    case 'ArrowLeft':
      state.cx -= state.width * step
      break
    case 'ArrowRight':
      state.cx += state.width * step
      break
    case 'ArrowUp':
      state.cy += state.width * (h / w) * step
      break
    case 'ArrowDown':
      state.cy -= state.width * (h / w) * step
      break
    case '+':
    case '=':
      zoomCenter(0.8)
      break
    case '-':
    case '_':
      zoomCenter(1.25)
      break
    case '0':
      resetView()
      return
    default:
      handled = false
  }
  if (handled) {
    e.preventDefault()
    presetKey.value = ''
  }
}

/* ---------- 输入框手动设置坐标 ---------- */
function syncInputs() {
  inRe.value = String(state.cx)
  inIm.value = String(state.cy)
  inWidth.value = String(state.width)
}

function applyCoord(field, e) {
  const raw = String(e.target.value).trim()
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    error.value = '坐标不是合法数字，已还原'
    setTimeout(() => (error.value = ''), 2200)
    syncInputs()
    return
  }
  if (field === 'width') {
    if (n <= 0) {
      error.value = '视点宽度必须大于 0，已还原'
      setTimeout(() => (error.value = ''), 2200)
      syncInputs()
      return
    }
    state.width = clampWidth(n)
  } else if (field === 're') {
    state.cx = n
  } else {
    state.cy = n
  }
  presetKey.value = ''
  syncInputs()
}

/* ---------- 复制 / 导出 ---------- */
function viewText() {
  const { h, w } = size.value
  return [
    '# 曼德博集合视图参数',
    `center.re = ${state.cx}`,
    `center.im = ${state.cy}`,
    `width     = ${state.width}`,
    `height    = ${(state.width * h) / w}`,
    `maxIter   = ${state.maxIter}`,
    `escape    = ${state.escape}`,
    `scheme    = ${state.scheme}`,
    `smooth    = ${state.smooth}`,
    `zoom      = ${BASE_WIDTH / state.width}x`
  ].join('\n')
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => flashSuccess('已复制到剪贴板'))
      .catch(() => legacyCopy(text))
  } else {
    legacyCopy(text)
  }
}

function legacyCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    flashSuccess('已复制到剪贴板')
  } catch (err) {
    flashError('复制失败，请手动选择复制')
  }
}

function copyView() {
  copyText(viewText())
}

async function copyImage() {
  const c = canvasRef.value
  if (!c) return
  if (!navigator.clipboard || !window.ClipboardItem) {
    flashError('当前浏览器不支持复制图片，请使用「导出 PNG」')
    return
  }
  try {
    const blob = await new Promise((resolve, reject) => {
      c.toBlob((bl) => (bl ? resolve(bl) : reject(new Error('PNG 生成失败'))), 'image/png')
    })
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('图片已复制到剪贴板')
  } catch (err) {
    flashError('复制图片失败：' + (err && err.message ? err.message : '未知错误'))
  }
}

function downloadPng() {
  const c = canvasRef.value
  if (!c) return
  const link = document.createElement('a')
  link.download = `mandelbrot_${fmtCoord(state.cx).replace(/[^0-9a-z.+-]/gi, '')}_${zoomText.value.replace('×', 'x')}.png`
  link.href = c.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

function flashError(msg) {
  error.value = msg
  setTimeout(() => (error.value = ''), 2500)
}

/* ---------- 监听与生命周期 ---------- */
watch(
  () => [
    state.cx,
    state.cy,
    state.width,
    state.maxIter,
    state.escape,
    state.scheme,
    state.smooth,
    state.fast,
    state.cyclic
  ],
  () => {
    syncInputs()
    scheduleRender()
  }
)

watch(resKey, () => scheduleRender(0))

onMounted(() => {
  const c = canvasRef.value
  if (c) {
    c.addEventListener('wheel', onWheel, { passive: false })
    c.addEventListener('mousedown', onMouseDown)
    c.addEventListener('mousemove', onHover)
    c.addEventListener('mouseleave', onMouseLeave)
    c.addEventListener('touchstart', onTouchStart, { passive: true })
    c.addEventListener('touchmove', onTouchMove, { passive: false })
    c.addEventListener('touchend', onTouchEnd)
    c.addEventListener('keydown', onKeyDown)
  }
  startRender()
})

onBeforeUnmount(() => {
  const c = canvasRef.value
  if (c) {
    c.removeEventListener('wheel', onWheel)
    c.removeEventListener('mousedown', onMouseDown)
    c.removeEventListener('mousemove', onHover)
    c.removeEventListener('mouseleave', onMouseLeave)
    c.removeEventListener('touchstart', onTouchStart)
    c.removeEventListener('touchmove', onTouchMove)
    c.removeEventListener('touchend', onTouchEnd)
    c.removeEventListener('keydown', onKeyDown)
  }
  clearTimeout(renderTimer)
  clearTimeout(successTimer)
  cancelAnimationFrame(rafId)
  rafId = 0
  rImg = null
  rCtx = null
  rLut = null
})
</script>

<style scoped>
/* 预设视点按钮 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}

.preset-btn {
  border-radius: 0;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  padding: 8px 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.preset-btn:hover {
  color: var(--green);
  border-color: var(--green);
}

.preset-btn.active {
  color: var(--green);
  border-color: var(--green);
  background: var(--green-soft);
}

/* 滑动条行 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-wrapper .range-input {
  flex: 1;
  min-width: 0;
  margin: 6px 0;
}

.range-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  min-width: 48px;
  text-align: right;
  flex-shrink: 0;
}

/* 复选框组 */
.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
}

/* 坐标输入 */
.coord-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}

.coord-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.coord-name {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--muted);
  text-transform: uppercase;
}

/* 预览区 */
.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: crosshair;
  touch-action: none;
}

canvas:focus-visible {
  outline: 1px solid var(--green);
  outline-offset: 1px;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

.render-bar {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 3px;
  background: var(--panel);
  border: 1px solid var(--line);
}

.render-bar span {
  display: block;
  height: 100%;
  background: var(--green);
  transition: width 0.08s linear;
}

.hint-line {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted);
}

.coord-readout {
  margin-top: 6px;
  padding: 10px 40px 10px 12px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  min-height: 40px;
}

.warn-line {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--warning);
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--muted);
  font-family: var(--mono);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--green);
  word-break: break-all;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .coord-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  .range-value {
    font-size: 12px;
    min-width: 40px;
  }
  .stat-value {
    font-size: 13px;
  }
}
</style>
