<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📈 Lissajous 曲线可视化器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：参数控制 -->
          <div class="tool-col">
            <label class="tool-label">频率比 a：{{ fmt(a) }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="a" min="1" max="12" step="0.5" class="range-input" />
              <span class="range-value">{{ fmt(a) }}</span>
            </div>

            <label class="tool-label">频率比 b：{{ fmt(b) }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="b" min="1" max="12" step="0.5" class="range-input" />
              <span class="range-value">{{ fmt(b) }}</span>
            </div>

            <label class="tool-label">相位差 δ：{{ Math.round(phase) }}°</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="phase" min="0" max="360" step="1" class="range-input" />
              <span class="range-value">{{ Math.round(phase) }}°</span>
            </div>

            <label class="tool-label">振幅 A：{{ fmt(amp) }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="amp" min="0.2" max="1" step="0.05" class="range-input" />
              <span class="range-value">{{ fmt(amp) }}</span>
            </div>

            <label class="tool-label">采样点数：{{ samples }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="samples" min="400" max="6000" step="100" class="range-input" />
              <span class="range-value">{{ samples }}</span>
            </div>

            <label class="tool-label">线宽：{{ lineWidth }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="lineWidth" min="0.5" max="4" step="0.5" class="range-input" />
              <span class="range-value">{{ lineWidth }}</span>
            </div>

            <label class="tool-label">发光强度：{{ glow }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="glow" min="0" max="20" step="1" class="range-input" />
              <span class="range-value">{{ glow }}</span>
            </div>

            <label class="tool-label">配色：</label>
            <div class="radio-group">
              <label v-for="s in schemeOptions" :key="s.key" class="radio-label">
                <input type="radio" v-model="scheme" :value="s.key" />
                <span>{{ s.label }}</span>
              </label>
            </div>

            <label class="tool-label">相位动画：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="animating" />
                <span>自动推进相位</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showGrid" />
                <span>显示网格与坐标轴</span>
              </label>
            </div>

            <label class="tool-label">动画速度：{{ speed }} °/s</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="speed" min="10" max="300" step="10" class="range-input" :disabled="!animating" />
              <span class="range-value">{{ speed }}</span>
            </div>
          </div>

          <!-- 右栏：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="canvas-wrapper">
              <canvas ref="canvasRef" width="800" height="800"></canvas>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
            </div>

            <label class="tool-label">曲线方程：</label>
            <div class="result-display formula-display">
              <div class="formula-line">x = {{ fmt(amp) }} · sin({{ fmt(a) }}t + {{ Math.round(phase) }}°)</div>
              <div class="formula-line">y = {{ fmt(amp) }} · sin({{ fmt(b) }}t)</div>
              <button class="copy-btn" style="top: 8px; right: 8px" @click="copyFormula" title="复制公式">📋</button>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">化简频率比</span>
            <span class="stat-value">{{ ratioLabel }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">闭合周期（×2π）</span>
            <span class="stat-value">{{ cycles }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">绘制采样点</span>
            <span class="stat-value">{{ drawCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">曲线弧长 / R</span>
            <span class="stat-value">{{ arcLen }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">渲染耗时</span>
            <span class="stat-value">{{ renderTime }}ms</span>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="toggleAnimate">
            {{ animating ? '⏸ 暂停动画' : '▶ 相位动画' }}
          </button>
          <button class="tool-button" @click="reset">重置参数</button>
          <button class="tool-button" @click="copyImage">复制图片</button>
          <button class="tool-button" @click="downloadPng">导出 PNG</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 状态 ---------- */
const canvasRef = ref(null)
const a = ref(3)
const b = ref(2)
const phase = ref(90)
const amp = ref(0.9)
const samples = ref(2000)
const lineWidth = ref(1.5)
const glow = ref(10)
const scheme = ref('neon')
const animating = ref(false)
const showGrid = ref(true)
const speed = ref(60)

const renderTime = ref(0)
const drawCount = ref(0)
const arcLen = ref('0.00')
const error = ref('')
const success = ref('')

const schemeOptions = [
  { key: 'neon', label: '霓虹绿' },
  { key: 'fade', label: '亮度渐变' },
  { key: 'spectrum', label: '相位光谱' },
  { key: 'wire', label: '细线描边' }
]

let renderTimer = null
let successTimer = null
let rafId = 0
let lastTs = 0

/* ---------- 数学工具 ---------- */
function gcd(x, y) {
  x = Math.abs(x)
  y = Math.abs(y)
  while (y) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

/* 频率比有理化（支持 0.5 步进）
 * 以 2a、2b 的有理数化求闭合周期：
 * x = A·sin(a·t + δ)、y = A·sin(b·t) 在 t = 2π·cycles 时闭合 */
const ratioInfo = computed(() => {
  const sa = Math.max(1, Math.round(Number(a.value) * 2))
  const sb = Math.max(1, Math.round(Number(b.value) * 2))
  const g = gcd(sa, sb) || 1
  return { an: sa / g, bn: sb / g, cycles: g % 2 === 0 ? 1 : 2 }
})

const ratioLabel = computed(() => `${ratioInfo.value.an} : ${ratioInfo.value.bn}`)
const cycles = computed(() => ratioInfo.value.cycles)

function fmt(v) {
  const n = Number(v)
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '0'
}

/* ---------- 颜色工具 ---------- */
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

function rgba(c, alpha = 1) {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`
}

function mixColor(c1, c2, t) {
  const k = Math.max(0, Math.min(1, t))
  return [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k]
}

/* 按相位取色：光谱模式保持在绿色系区间（H 70° → 165°） */
function phaseColor(green, t) {
  const k = Math.max(0, Math.min(1, t))
  if (scheme.value === 'spectrum') {
    const h = 70 + 95 * Math.abs(Math.sin(k * Math.PI))
    return `hsl(${h.toFixed(1)}, 100%, 62%)`
  }
  /* fade：暗绿 → 亮绿白，沿曲线渐亮 */
  const dark = mixColor([10, 22, 12], green, 0.12)
  return rgba(mixColor(dark, [236, 255, 226], k), 0.95)
}

/* ---------- 渲染 ---------- */
function buildPoints(W, H) {
  const R = (Math.min(W, H) / 2) * 0.86 * Number(amp.value)
  const cx = W / 2
  const cy = H / 2
  const tMax = Math.PI * 2 * ratioInfo.value.cycles
  const maxPts = 12000
  const perCycle = Math.max(60, Math.round(Number(samples.value)))
  const n = Math.min(maxPts, Math.max(200, perCycle * ratioInfo.value.cycles))
  const pts = new Float32Array(n * 2)
  const ph = (Number(phase.value) * Math.PI) / 180
  const av = Number(a.value)
  const bv = Number(b.value)
  for (let i = 0; i < n; i++) {
    const t = (tMax * i) / (n - 1)
    pts[2 * i] = cx + R * Math.sin(av * t + ph)
    pts[2 * i + 1] = cy - R * Math.sin(bv * t)
  }
  return { pts, n, R }
}

function drawGrid(ctx, W, H, lineColor, green) {
  const cx = W / 2
  const cy = H / 2
  ctx.save()
  ctx.strokeStyle = lineColor
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, H)
  ctx.moveTo(0, cy)
  ctx.lineTo(W, cy)
  ctx.stroke()

  ctx.globalAlpha = 0.35
  const R = (Math.min(W, H) / 2) * 0.86
  ctx.setLineDash([6, 8])
  for (const f of [0.5, 1]) {
    ctx.beginPath()
    ctx.arc(cx, cy, R * f, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.globalAlpha = 0.9
  ctx.fillStyle = rgba(green, 0.8)
  ctx.font = '20px monospace'
  ctx.fillText('+X', W - 52, cy - 10)
  ctx.fillText('+Y', cx + 12, 26)
  ctx.restore()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const t0 = performance.now()

  const green = hexToRgb(cssVar('--green', '#9dff6b'))
  const bg = hexToRgb(cssVar('--panel-2', '#12160f'))
  const lineColor = cssVar('--line', '#2b3a2a')

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = rgba(bg, 1)
  ctx.fillRect(0, 0, W, H)

  if (showGrid.value) drawGrid(ctx, W, H, lineColor, green)

  const { pts, n, R } = buildPoints(W, H)
  drawCount.value = n

  /* 弧长（以 R 为单位归一化） */
  let len = 0
  for (let i = 1; i < n; i++) {
    const dx = pts[2 * i] - pts[2 * i - 2]
    const dy = pts[2 * i + 1] - pts[2 * i - 1]
    len += Math.hypot(dx, dy)
  }
  arcLen.value = R > 0 ? (len / R).toFixed(2) : '0.00'

  const lw = Math.max(0.5, Number(lineWidth.value)) * 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  /* 发光底纹 */
  if (Number(glow.value) > 0) {
    ctx.save()
    ctx.shadowBlur = Number(glow.value) * 3
    ctx.shadowColor = rgba(green, 0.95)
    ctx.strokeStyle = rgba(green, 0.3)
    ctx.lineWidth = lw * 1.8
    ctx.beginPath()
    ctx.moveTo(pts[0], pts[1])
    for (let i = 1; i < n; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1])
    ctx.stroke()
    ctx.restore()
  }

  /* 主曲线 */
  if (scheme.value === 'neon' || scheme.value === 'wire') {
    ctx.save()
    ctx.strokeStyle = scheme.value === 'wire' ? rgba(green, 0.8) : rgba(green, 1)
    ctx.lineWidth = scheme.value === 'wire' ? Math.max(0.6, lw * 0.6) : lw
    if (scheme.value === 'neon' && Number(glow.value) === 0) {
      ctx.shadowBlur = 6
      ctx.shadowColor = rgba(green, 0.8)
    }
    ctx.beginPath()
    ctx.moveTo(pts[0], pts[1])
    for (let i = 1; i < n; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1])
    ctx.stroke()
    ctx.restore()
  } else {
    ctx.save()
    ctx.lineWidth = lw
    for (let i = 1; i < n; i++) {
      ctx.strokeStyle = phaseColor(green, i / (n - 1))
      ctx.beginPath()
      ctx.moveTo(pts[2 * i - 2], pts[2 * i - 1])
      ctx.lineTo(pts[2 * i], pts[2 * i + 1])
      ctx.stroke()
    }
    ctx.restore()
  }

  renderTime.value = Math.round(performance.now() - t0)
}

function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(draw, 30)
}

/* ---------- 动画 ---------- */
function frame(ts) {
  if (!animating.value) return
  if (!lastTs) lastTs = ts
  const dt = Math.min(120, ts - lastTs) / 1000
  lastTs = ts
  if (dt > 0) {
    let p = Number(phase.value) + Number(speed.value) * dt
    while (p >= 360) p -= 360
    phase.value = Math.round(p * 10) / 10
  }
  draw()
  rafId = requestAnimationFrame(frame)
}

function startAnim() {
  cancelAnimationFrame(rafId)
  lastTs = 0
  rafId = requestAnimationFrame(frame)
}

function stopAnim() {
  cancelAnimationFrame(rafId)
  rafId = 0
  lastTs = 0
}

function toggleAnimate() {
  animating.value = !animating.value
  if (animating.value) startAnim()
  else stopAnim()
}

/* ---------- 交互 ---------- */
function reset() {
  a.value = 3
  b.value = 2
  phase.value = 90
  amp.value = 0.9
  samples.value = 2000
  lineWidth.value = 1.5
  glow.value = 10
  scheme.value = 'neon'
  showGrid.value = true
  speed.value = 60
  scheduleRender()
  flashSuccess('参数已重置')
}

function formulaText() {
  return `x = ${fmt(amp.value)} * sin(${fmt(a.value)}t + ${Math.round(phase.value)}deg)\ny = ${fmt(amp.value)} * sin(${fmt(b.value)}t)`
}

function copyFormula() {
  copyText(formulaText())
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
  } catch (e) {
    error.value = '复制失败，请手动选择复制'
    setTimeout(() => (error.value = ''), 2500)
  }
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  if (!navigator.clipboard || !window.ClipboardItem) {
    error.value = '当前浏览器不支持复制图片，请使用「导出 PNG」'
    setTimeout(() => (error.value = ''), 2500)
    return
  }
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((bl) => (bl ? resolve(bl) : reject(new Error('PNG 生成失败'))), 'image/png')
    })
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('图片已复制到剪贴板')
  } catch (e) {
    error.value = '复制图片失败：' + (e && e.message ? e.message : '未知错误')
    setTimeout(() => (error.value = ''), 2500)
  }
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `lissajous_${fmt(a.value)}_${fmt(b.value)}_${Math.round(phase.value)}deg.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

/* ---------- 生命周期 ---------- */
watch([a, b, phase, amp, samples, lineWidth, glow, scheme, showGrid], () => {
  /* 动画进行中由 requestAnimationFrame 负责重绘，避免重复渲染 */
  if (animating.value) return
  scheduleRender()
})

watch(animating, (v) => {
  if (v) startAnim()
  else stopAnim()
})

onMounted(() => draw())

onBeforeUnmount(() => {
  clearTimeout(renderTimer)
  clearTimeout(successTimer)
  stopAnim()
})
</script>

<style scoped>
/* 复选框组 */
.options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;
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
  min-width: 46px;
  text-align: right;
  flex-shrink: 0;
}

/* 预览区 */
.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
}

canvas {
  width: 100%;
  max-width: 420px;
  height: auto;
  aspect-ratio: 1 / 1;
  background: var(--panel-2);
  border: 1px solid var(--line);
  display: block;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

/* 公式 */
.formula-display {
  padding: 12px 40px 12px 12px;
  line-height: 1.7;
}

.formula-line {
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
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
  font-size: 15px;
  color: var(--green);
  word-break: break-all;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 40px;
  }
  .stat-value {
    font-size: 13px;
  }
}
</style>
