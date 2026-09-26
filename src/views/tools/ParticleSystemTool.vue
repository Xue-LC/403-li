<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>✨ 粒子系统编辑器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">发射器位置：</label>
            <div class="pos-grid">
              <div class="pos-field">
                <span class="pos-name">X</span>
                <input type="range" class="range-input" v-model.number="emitterX" min="0" max="100" step="1" />
                <span class="range-value">{{ emitterX }}%</span>
              </div>
              <div class="pos-field">
                <span class="pos-name">Y</span>
                <input type="range" class="range-input" v-model.number="emitterY" min="0" max="100" step="1" />
                <span class="range-value">{{ emitterY }}%</span>
              </div>
            </div>

            <label class="tool-label">发射角度：{{ angle }}°</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="angle" min="0" max="360" step="1" />
              <span class="range-value">{{ angle }}°</span>
            </div>

            <label class="tool-label">扩散角：{{ spread }}°</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="spread" min="0" max="360" step="1" />
              <span class="range-value">{{ spread }}°</span>
            </div>

            <label class="tool-label">初始速度：{{ speed }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="speed" min="0" max="600" step="5" />
              <span class="range-value">{{ speed }}</span>
            </div>

            <label class="tool-label">重力：{{ gravity }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="gravity" min="-400" max="400" step="5" />
              <span class="range-value">{{ gravity }}</span>
            </div>

            <label class="tool-label">空气阻力：{{ Math.round(drag * 100) }}%</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="drag" min="0" max="1" step="0.01" />
              <span class="range-value">{{ Math.round(drag * 100) }}%</span>
            </div>

            <label class="tool-label">粒子数量上限：{{ maxParticles }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="maxParticles" min="50" max="3000" step="50" />
              <span class="range-value">{{ maxParticles }}</span>
            </div>

            <label class="tool-label">发射速率：{{ emitRate }}/s</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="emitRate" min="10" max="2000" step="10" />
              <span class="range-value">{{ emitRate }}/s</span>
            </div>

            <label class="tool-label">粒子大小：{{ size }}</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="size" min="1" max="12" step="0.5" />
              <span class="range-value">{{ size }}</span>
            </div>

            <label class="tool-label">生命周期：{{ lifeMin }}s ~ {{ lifeMax }}s</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="lifeMin" min="0.3" max="5" step="0.1" />
              <span class="range-value">{{ lifeMin }}s</span>
            </div>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="lifeMax" min="0.5" max="8" step="0.1" />
              <span class="range-value">{{ lifeMax }}s</span>
            </div>

            <label class="tool-label">拖尾残留：{{ Math.round(trail * 100) }}%</label>
            <div class="slider-wrapper">
              <input type="range" class="range-input" v-model.number="trail" min="0" max="0.95" step="0.05" />
              <span class="range-value">{{ Math.round(trail * 100) }}%</span>
            </div>

            <label class="tool-label">颜色渐变：</label>
            <div class="color-fields">
              <div class="color-field">
                <input type="color" v-model="colorA" class="color-input" />
                <span class="color-hex">{{ colorA }}</span>
              </div>
              <div class="color-field">
                <input type="color" v-model="colorB" class="color-input" />
                <span class="color-hex">{{ colorB }}</span>
              </div>
            </div>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="glow" />
                <span>发光叠加（additive）</span>
              </label>
            </div>

            <label class="tool-label">预设：</label>
            <div class="radio-group">
              <label v-for="p in presets" :key="p.key" class="radio-label">
                <input type="radio" v-model="preset" :value="p.key" @change="applyPreset(p.key)" />
                <span>{{ p.label }}</span>
              </label>
            </div>
          </div>

          <!-- 右栏：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="canvas-wrapper">
              <canvas ref="canvasRef" @click="moveEmitter"></canvas>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
            </div>
            <div class="canvas-hint">点击画布可移动发射器位置</div>
            <div class="stats-row">
              <span>粒子 {{ particles.length }} / {{ maxParticles }}</span>
              <span>{{ fps }} FPS</span>
              <span :class="running ? 'stat-running' : 'stat-paused'">{{ running ? '▶ 运行中' : '⏸ 已暂停' }}</span>
            </div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="toggleRun">{{ running ? '⏸ 暂停' : '▶ 播放' }}</button>
          <button class="tool-button" @click="step">⏭ 单步</button>
          <button class="tool-button danger" @click="clearParticles">🗑 清空</button>
        </div>
        <div class="button-group button-group-3">
          <button class="tool-button" @click="randomize">🎲 随机参数</button>
          <button class="tool-button" @click="burst">💥 爆发</button>
          <button class="tool-button" @click="downloadPng">⬇ 导出 PNG</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 可复用工具函数 ---------- */

function parseHex(hex) {
  const h = String(hex).replace('#', '')
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16)
    ]
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ]
}

function lerpColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ]
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/* 兼容 #hex / rgb() / rgba()，解析为 [r, g, b] */
function toRgb(str) {
  const s = String(str).trim()
  if (s.startsWith('#')) {
    const h = s.replace('#', '')
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16)
      ]
    }
    if (h.length === 6) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
      ]
    }
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const parts = m[1].split(',').map((x) => parseFloat(x.trim()))
    if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
      return [parts[0], parts[1], parts[2]]
    }
  }
  return [13, 18, 15]
}

/* ---------- 组件状态 ---------- */

const canvasRef = ref(null)

const emitterX = ref(50)
const emitterY = ref(50)
const angle = ref(-90)
const spread = ref(25)
const speed = ref(220)
const gravity = ref(300)
const drag = ref(0.02)
const maxParticles = ref(800)
const emitRate = ref(400)
const size = ref(3)
const lifeMin = ref(1)
const lifeMax = ref(2.5)
const trail = ref(0.3)
const glow = ref(false)
const colorA = ref('#9dff6b')
const colorB = ref('#ff5e7d')
const preset = ref('fountain')

const running = ref(true)
const fps = ref(0)
const error = ref('')
const success = ref('')

const presets = [
  { key: 'custom', label: '自定义' },
  { key: 'fountain', label: '喷泉' },
  { key: 'rain', label: '雨幕' },
  { key: 'nebula', label: '星云' },
  { key: 'burst', label: '爆发' }
]

const PRESET_CONFIG = {
  fountain: { angle: -90, spread: 25, speed: 220, gravity: 300, drag: 0.02, maxParticles: 800, emitRate: 400, size: 3, lifeMin: 1, lifeMax: 2.5, trail: 0.3, glow: false, colorA: '#9dff6b', colorB: '#ff5e7d' },
  rain: { angle: 90, spread: 8, speed: 420, gravity: 80, drag: 0, maxParticles: 1000, emitRate: 600, size: 2, lifeMin: 1.5, lifeMax: 2.5, trail: 0.4, glow: false, colorA: '#7dffd4', colorB: '#9dff6b' },
  nebula: { angle: 0, spread: 360, speed: 30, gravity: -12, drag: 0.05, maxParticles: 1200, emitRate: 150, size: 5, lifeMin: 3, lifeMax: 6, trail: 0.75, glow: true, colorA: '#ffe66d', colorB: '#9dff6b' },
  burst: { angle: -90, spread: 60, speed: 320, gravity: 160, drag: 0.06, maxParticles: 900, emitRate: 700, size: 4, lifeMin: 0.8, lifeMax: 1.6, trail: 0.5, glow: true, colorA: '#ff5e7d', colorB: '#ffb347' }
}

/* ---------- 粒子模拟 ---------- */

const W = 640
const H = 640
const particles = []

let ctx = null
let bgRgb = [13, 18, 15]
let rafId = null
let lastTime = 0
let spawnAcc = 0
let frameCount = 0
let fpsTime = 0
let successTimer = null

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = W
  canvas.height = H
  ctx = canvas.getContext('2d')
  bgRgb = toRgb(cssVar('--panel-2', '#0d1210'))
}

function spawn(randAngle, randSpeed) {
  const a = randAngle * (Math.PI / 180)
  const sp = randSpeed
  const life = lifeMin.value + Math.random() * Math.max(0.01, lifeMax.value - lifeMin.value)
  particles.push({
    x: (emitterX.value / 100) * W,
    y: (emitterY.value / 100) * H,
    vx: Math.cos(a) * sp,
    vy: Math.sin(a) * sp,
    life,
    maxLife: life,
    size: size.value * (0.6 + Math.random() * 0.8)
  })
}

function spawnFromEmitter() {
  const a = angle.value - spread.value / 2 + Math.random() * spread.value
  const sp = speed.value * (0.5 + Math.random())
  spawn(a, sp)
}

function update(dt, doSpawn) {
  if (doSpawn) {
    spawnAcc += emitRate.value * dt
    while (spawnAcc >= 1 && particles.length < maxParticles.value) {
      spawnFromEmitter()
      spawnAcc -= 1
    }
    if (particles.length >= maxParticles.value) spawnAcc = 0
  }

  const g = gravity.value
  const damp = Math.max(0, 1 - drag.value * dt)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= dt
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    p.vy += g * dt
    p.vx *= damp
    p.vy *= damp
    p.x += p.vx * dt
    p.y += p.vy * dt
  }
}

function draw() {
  if (!ctx) return

  /* 拖尾：按残留比例半透明覆盖背景 */
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = Math.min(1, Math.max(0.05, 1 - trail.value))
  ctx.fillStyle = `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 1

  if (glow.value) ctx.globalCompositeOperation = 'lighter'

  const ca = parseHex(colorA.value)
  const cb = parseHex(colorB.value)

  for (const p of particles) {
    const t = 1 - p.life / p.maxLife
    const c = lerpColor(ca, cb, t)
    const s = p.size * (0.4 + 0.6 * (p.life / p.maxLife))
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife))
    ctx.fillStyle = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  drawEmitterMarker()
}

/* 发射器十字标记 */
function drawEmitterMarker() {
  if (!ctx) return
  const x = (emitterX.value / 100) * W
  const y = (emitterY.value / 100) * H
  ctx.strokeStyle = cssVar('--green', '#9dff6b')
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - 10, y)
  ctx.lineTo(x + 10, y)
  ctx.moveTo(x, y - 10)
  ctx.lineTo(x, y + 10)
  ctx.stroke()
}

/* 全量清空（含拖尾残留） */
function wipe() {
  if (!ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`
  ctx.fillRect(0, 0, W, H)
  drawEmitterMarker()
}

function frame(ts) {
  rafId = requestAnimationFrame(frame)
  if (!lastTime) lastTime = ts
  let dt = (ts - lastTime) / 1000
  lastTime = ts
  if (dt > 0.05) dt = 0.05

  frameCount++
  if (ts - fpsTime >= 500) {
    fps.value = Math.round((frameCount * 1000) / (ts - fpsTime))
    frameCount = 0
    fpsTime = ts
  }

  if (running.value) {
    update(dt, true)
    draw()
  } else {
    /* 暂停时仅刷新发射器标记，保持画面冻结 */
    drawEmitterMarker()
  }
}

/* ---------- 交互 ---------- */

function toggleRun() {
  running.value = !running.value
  if (running.value) lastTime = 0
}

function step() {
  update(1 / 60, true)
  draw()
}

function clearParticles() {
  particles.length = 0
  spawnAcc = 0
  wipe()
}

function burst() {
  const n = Math.min(maxParticles.value, Math.floor(maxParticles.value * 0.6))
  for (let i = 0; i < n; i++) {
    if (particles.length >= maxParticles.value) break
    spawn(Math.random() * 360, speed.value * (0.3 + Math.random() * 1.4))
  }
}

function randomize() {
  emitterX.value = Math.round(5 + Math.random() * 90)
  emitterY.value = Math.round(5 + Math.random() * 90)
  angle.value = Math.round(Math.random() * 360)
  spread.value = Math.round(10 + Math.random() * 120)
  speed.value = Math.round(50 + Math.random() * 350)
  gravity.value = Math.round(-200 + Math.random() * 500)
  drag.value = Math.round(Math.random() * 20) / 100
  emitRate.value = Math.round(100 + Math.random() * 900)
  size.value = Math.round((2 + Math.random() * 6) * 2) / 2
  lifeMin.value = Math.round((0.5 + Math.random() * 2) * 10) / 10
  lifeMax.value = Math.round((lifeMin.value + 0.5 + Math.random() * 3) * 10) / 10
  trail.value = Math.round(Math.random() * 18) / 20
  glow.value = Math.random() > 0.5
  const palette = ['#9dff6b', '#ff5e7d', '#ffb347', '#ffe66d', '#7dffd4']
  colorA.value = palette[Math.floor(Math.random() * palette.length)]
  colorB.value = palette[Math.floor(Math.random() * palette.length)]
  /* 参数变化会自动把预设切到「自定义」 */
}

function moveEmitter(e) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  emitterX.value = Math.round(x * 10) / 10
  emitterY.value = Math.round(y * 10) / 10
}

function applyPreset(key) {
  if (key === 'custom' || !PRESET_CONFIG[key]) return
  const p = PRESET_CONFIG[key]
  angle.value = p.angle
  spread.value = p.spread
  speed.value = p.speed
  gravity.value = p.gravity
  drag.value = p.drag
  maxParticles.value = p.maxParticles
  emitRate.value = p.emitRate
  size.value = p.size
  lifeMin.value = p.lifeMin
  lifeMax.value = p.lifeMax
  trail.value = p.trail
  glow.value = p.glow
  colorA.value = p.colorA
  colorB.value = p.colorB
}

/* ---------- 复制 / 导出 ---------- */

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

function flashError(msg) {
  error.value = msg
  clearTimeout(successTimer)
  setTimeout(() => (error.value = ''), 2500)
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      flashError('当前浏览器不支持复制图片，请使用「导出 PNG」')
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('图片已复制到剪贴板')
  } catch (e) {
    flashError('复制图片失败：' + (e && e.message ? e.message : '未知错误'))
  }
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `particle_system_${preset.value}_${W}x${H}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

/* ---------- 监听 ---------- */

const applyingPreset = ref(false)

const paramRefs = [
  emitterX, emitterY, angle, spread, speed, gravity, drag,
  maxParticles, emitRate, size, lifeMin, lifeMax, trail, glow, colorA, colorB
]

watch(paramRefs, () => {
  if (applyingPreset.value) return
  preset.value = 'custom'
})

watch(lifeMax, (v) => {
  if (v < lifeMin.value) lifeMax.value = lifeMin.value
})

/* ---------- 生命周期 ---------- */

onMounted(() => {
  setupCanvas()
  clearParticles()
  rafId = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* 发射器位置（X / Y 双滑条） */
.pos-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pos-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pos-name {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  width: 16px;
  flex-shrink: 0;
}

.pos-field .range-input {
  flex: 1;
  min-width: 0;
  margin: 6px 0;
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
  min-width: 42px;
  text-align: right;
  flex-shrink: 0;
}

/* 颜色选择 */
.color-fields {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 44px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  border-radius: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 0;
}

.color-input::-moz-color-swatch {
  border: none;
  border-radius: 0;
}

.color-hex {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.options-group {
  margin-top: 6px;
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
  max-width: 520px;
  height: auto;
  aspect-ratio: 1 / 1;
  background: var(--panel-2);
  border: 1px solid var(--line);
  display: block;
  cursor: crosshair;
}

.canvas-copy {
  top: 14px;
  right: 14px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  padding: 6px 8px;
  font-size: 14px;
}

.canvas-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin-top: 6px;
}

/* 状态统计行 */
.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
}

.stat-running {
  color: var(--green);
}

.stat-paused {
  color: var(--red);
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 38px;
  }
  .canvas-hint,
  .stats-row {
    font-size: 11px;
  }
}
</style>
