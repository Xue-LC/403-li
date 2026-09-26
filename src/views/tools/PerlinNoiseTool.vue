<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌀 Perlin 噪声可视化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：参数控制 -->
          <div class="tool-col">
            <label class="tool-label">随机种子 (Seed)：</label>
            <div class="seed-row">
              <input
                class="code-input-sm seed-input"
                v-model.number="seed"
                type="number"
                placeholder="0"
                @keyup.enter="scheduleRender(true)"
              />
              <button class="tool-button seed-btn" @click="randomSeed" title="随机种子">🎲</button>
              <button class="tool-button seed-btn" @click="copySeed" title="复制种子">📋</button>
            </div>

            <label class="tool-label">缩放 (Scale)：{{ scale }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="scale" min="0.5" max="16" step="0.1" class="range-input" />
              <span class="range-value">{{ scale }}</span>
            </div>

            <label class="tool-label">频率 (Frequency)：{{ freq }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="freq" min="0.5" max="8" step="0.1" class="range-input" />
              <span class="range-value">{{ freq }}</span>
            </div>

            <label class="tool-label">振幅 (Amplitude)：{{ amp }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="amp" min="0.1" max="2" step="0.05" class="range-input" />
              <span class="range-value">{{ amp }}</span>
            </div>

            <label class="tool-label">分形八度 (Octaves)：{{ octaves }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="octaves" min="1" max="8" step="1" class="range-input" />
              <span class="range-value">{{ octaves }}</span>
            </div>

            <label class="tool-label">分辨率：</label>
            <div class="radio-group">
              <label v-for="s in sizes" :key="s" class="radio-label">
                <input type="radio" v-model="size" :value="s" />
                <span>{{ s }}×{{ s }}</span>
              </label>
            </div>

            <label class="tool-label">配色方案：</label>
            <div class="radio-group">
              <label v-for="s in schemeOptions" :key="s.key" class="radio-label">
                <input type="radio" v-model="scheme" :value="s.key" />
                <span>{{ s.label }}</span>
              </label>
            </div>
          </div>

          <!-- 右栏：实时预览 -->
          <div class="tool-col">
            <label class="tool-label">实时预览：</label>
            <div class="canvas-wrapper">
              <canvas ref="canvasRef"></canvas>
              <button class="copy-btn canvas-copy" @click="copyImage" title="复制图片">📋</button>
            </div>
            <div v-if="renderTime" class="render-info">
              render {{ size }}×{{ size }} · {{ renderTime }}ms
            </div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="scheduleRender(true)">重新生成</button>
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 可复用工具函数 ---------- */

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* 经典 2D Perlin 噪声（Ken Perlin 改进版） */
class PerlinNoise {
  constructor(seed) {
    const rand = mulberry32(seed >>> 0)
    const p = new Uint8Array(256)
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      const tmp = p[i]
      p[i] = p[j]
      p[j] = tmp
    }
    this.perm = new Uint8Array(512)
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  lerp(a, b, t) {
    return a + t * (b - a)
  }

  grad(hash, x, y) {
    const h = hash & 7
    const u = h < 4 ? x : y
    const v = h < 4 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v)
  }

  noise2(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.perm[X] + Y
    const B = this.perm[X + 1] + Y
    return this.lerp(
      this.lerp(this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y), u),
      this.lerp(this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1), u),
      v
    )
  }

  /* 分形叠加（fBm），返回 [-1, 1] */
  fbm(x, y, octaves) {
    let amp = 1
    let freq = 1
    let sum = 0
    let norm = 0
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise2(x * freq, y * freq)
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return sum / norm
  }
}

/* 颜色工具 */
function parseHex(hex) {
  const h = hex.replace('#', '')
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

function makeStops(stops) {
  return (t) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const t0 = stops[i][0]
      const c0 = stops[i][1]
      const t1 = stops[i + 1][0]
      const c1 = stops[i + 1][1]
      if (t <= t1) {
        const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0)
        return lerpColor(c0, c1, Math.min(1, Math.max(0, k)))
      }
    }
    return stops[stops.length - 1][1]
  }
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/* ---------- 组件状态 ---------- */

const canvasRef = ref(null)
const seed = ref(Math.floor(Math.random() * 0xffffffff))
const scale = ref(4)
const freq = ref(1)
const amp = ref(1)
const octaves = ref(4)
const size = ref(256)
const scheme = ref('neon')
const renderTime = ref(0)
const error = ref('')
const success = ref('')

const sizes = [128, 256, 512]
const schemeOptions = [
  { key: 'neon', label: '霓虹绿' },
  { key: 'electric', label: '电子绿' },
  { key: 'fire', label: '火焰' },
  { key: 'gray', label: '灰度' }
]

let renderTimer = null
let successTimer = null

/* ---------- 渲染 ---------- */

function buildSchemes() {
  const green = parseHex(cssVar('--green', '#9dff6b'))
  const bg = parseHex(cssVar('--bg', '#0d1117'))
  return {
    neon: makeStops([
      [0, bg],
      [0.55, lerpColor(bg, green, 0.35)],
      [1, green]
    ]),
    electric: makeStops([
      [0, [6, 10, 7]],
      [0.45, lerpColor(bg, green, 0.55)],
      [1, [235, 255, 225]]
    ]),
    fire: makeStops([
      [0, [10, 8, 8]],
      [0.35, [150, 35, 20]],
      [0.7, [235, 130, 40]],
      [1, [255, 225, 110]]
    ]),
    gray: makeStops([
      [0, [8, 10, 9]],
      [1, [235, 235, 235]]
    ])
  }
}

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const t0 = performance.now()
  const n = Number(seed.value)
  const seedNum = Number.isFinite(n) ? Math.floor(n) : 0
  const noise = new PerlinNoise(seedNum)
  const s = Number(size.value) || 256
  const sc = Number(scale.value) || 4
  const fr = Number(freq.value) || 1
  const am = Number(amp.value) || 1
  const oc = Math.min(8, Math.max(1, Math.round(Number(octaves.value) || 4)))

  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(s, s)
  const data = img.data
  const colorFn = buildSchemes()[scheme.value] || buildSchemes().neon

  for (let y = 0; y < s; y++) {
    const ny = y / s
    for (let x = 0; x < s; x++) {
      const nx = x / s
      const v = noise.fbm(nx * sc * fr, ny * sc * fr, oc) * am
      let t = (v + 1) / 2
      if (t < 0) t = 0
      else if (t > 1) t = 1
      const c = colorFn(t)
      const i = (y * s + x) * 4
      data[i] = Math.round(c[0])
      data[i + 1] = Math.round(c[1])
      data[i + 2] = Math.round(c[2])
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  renderTime.value = Math.round(performance.now() - t0)
}

function scheduleRender(force = false) {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, force ? 0 : 40)
}

/* ---------- 交互 ---------- */

function randomSeed() {
  seed.value = Math.floor(Math.random() * 0xffffffff)
  render()
}

function copySeed() {
  const n = Number(seed.value)
  const text = String(Number.isFinite(n) ? Math.floor(n) : 0)
  copyText(text)
}

function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => flashSuccess('已复制到剪贴板'))
    .catch(() => {
      error.value = '复制失败，请手动选择复制'
      clearTimeout(successTimer)
      setTimeout(() => (error.value = ''), 2500)
    })
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas) return
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      error.value = '当前浏览器不支持复制图片，请使用「导出 PNG」'
      setTimeout(() => (error.value = ''), 2500)
      return
    }
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
  const n = Number(seed.value)
  const seedNum = Number.isFinite(n) ? Math.floor(n) : 0
  const link = document.createElement('a')
  link.download = `perlin_noise_${seedNum}_${size.value}x${size.value}.png`
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

watch([seed, scale, freq, amp, octaves, size, scheme], () => scheduleRender())

onMounted(() => render())

onBeforeUnmount(() => {
  clearTimeout(renderTimer)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* 种子输入行 */
.seed-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.seed-input {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
}

.seed-btn {
  height: 40px;
  min-height: 40px;
  padding: 0 14px;
  flex-shrink: 0;
  line-height: 1;
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
  min-width: 34px;
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

.render-info {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin-top: 6px;
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 30px;
  }
  .seed-btn {
    padding: 0 10px;
  }
}
</style>
