<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 颜色混合器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：控制面板 -->
          <div class="tool-col">
            <label class="tool-label">颜色 A：</label>
            <div class="color-input-row">
              <ColorPicker v-model="pickerA" />
              <div class="input-with-copy color-hex-wrap">
                <input
                  type="text"
                  v-model="hexA"
                  @input="onHexAInput"
                  @blur="onHexABlur"
                  class="code-input-sm"
                  placeholder="#9dff6b"
                  spellcheck="false"
                />
                <button class="copy-btn" @click="copy(hexA)" title="复制 HEX">📋</button>
              </div>
            </div>

            <label class="tool-label">颜色 B：</label>
            <div class="color-input-row">
              <ColorPicker v-model="pickerB" />
              <div class="input-with-copy color-hex-wrap">
                <input
                  type="text"
                  v-model="hexB"
                  @input="onHexBInput"
                  @blur="onHexBBlur"
                  class="code-input-sm"
                  placeholder="#ff6b9d"
                  spellcheck="false"
                />
                <button class="copy-btn" @click="copy(hexB)" title="复制 HEX">📋</button>
              </div>
            </div>

            <label class="tool-label">混合比例：{{ ratio }}%</label>
            <input type="range" v-model.number="ratio" min="0" max="100" class="range-input" />

            <label class="tool-label">混合模式：</label>
            <div class="mode-grid">
              <button
                v-for="m in modes"
                :key="m.value"
                :class="['mode-btn', { active: mode === m.value }]"
                @click="mode = m.value"
              >
                <span class="mode-cn">{{ m.cn }}</span>
                <span class="mode-en">{{ m.value }}</span>
              </button>
            </div>

            <label class="tool-label">混合空间：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="space" value="rgb" />
                <span>RGB 线性</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="space" value="hsl" />
                <span>HSL 色相</span>
              </label>
            </div>
            <div v-if="space === 'hsl' && mode !== 'normal'" class="space-hint">
              ⚠️ HSL 空间仅作用于「普通」混合，当前模式按 RGB 计算
            </div>
          </div>

          <!-- 右栏：预览 / 结果 -->
          <div class="tool-col">
            <label class="tool-label">渐变预览（{{ modeLabel }}）：</label>
            <div class="gradient-wrap">
              <div class="end-swatch">
                <span class="swatch-chip" :style="{ '--sw': hexA }"></span>
                <span class="swatch-hex">{{ hexA }}</span>
              </div>
              <canvas ref="gradientCanvas" class="gradient-canvas" height="48"></canvas>
              <div class="end-swatch">
                <span class="swatch-chip" :style="{ '--sw': hexB }"></span>
                <span class="swatch-hex">{{ hexB }}</span>
              </div>
            </div>
            <div class="ratio-mark">▼ 当前混合位置：{{ ratio }}%（{{ spaceLabel }}）</div>

            <label class="tool-label">混合结果：</label>
            <div
              class="result-swatch"
              :style="{ '--res': resultHex }"
              :title="`点击复制 ${resultHex}`"
              @click="copy(resultHex)"
            ></div>

            <label class="tool-label">输出格式：</label>
            <div class="output-row">
              <span class="output-key">HEX</span>
              <div class="input-with-copy">
                <input class="code-input-sm" :value="resultHex" readonly />
                <button class="copy-btn" @click="copy(resultHex)" title="复制 HEX">📋</button>
              </div>
            </div>
            <div class="output-row">
              <span class="output-key">RGB</span>
              <div class="input-with-copy">
                <input class="code-input-sm" :value="resultRgb" readonly />
                <button class="copy-btn" @click="copy(resultRgb)" title="复制 RGB">📋</button>
              </div>
            </div>
            <div class="output-row">
              <span class="output-key">HSL</span>
              <div class="input-with-copy">
                <input class="code-input-sm" :value="resultHsl" readonly />
                <button class="copy-btn" @click="copy(resultHsl)" title="复制 HSL">📋</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 全宽操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copyAll">📋 复制全部格式</button>
          <button class="tool-button" @click="swap">⇄ 交换 A / B</button>
          <button class="tool-button danger" @click="reset">🗑️ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'
import ColorPicker from '../../components/ColorPicker.vue'

// --- state ---
const pickerA = ref('#9dff6b')
const pickerB = ref('#ff6b9d')
const hexA = ref('#9dff6b')
const hexB = ref('#ff6b9d')
const ratio = ref(50)
const mode = ref('normal')
const space = ref('rgb')
const error = ref('')
const success = ref('')
const gradientCanvas = ref(null)

const modes = [
  { value: 'normal', cn: '普通' },
  { value: 'multiply', cn: '正片叠底' },
  { value: 'screen', cn: '滤色' },
  { value: 'overlay', cn: '叠加' },
  { value: 'darken', cn: '变暗' },
  { value: 'lighten', cn: '变亮' },
  { value: 'difference', cn: '差值' },
  { value: 'exclusion', cn: '排除' }
]

const modeLabel = computed(() => {
  const m = modes.find(x => x.value === mode.value)
  return m ? `${m.cn} (${m.value})` : mode.value
})

const spaceLabel = computed(() => (space.value === 'hsl' ? 'HSL' : 'RGB'))

// --- color helpers ---

function parseHex(hex) {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex.trim())
  if (!m) return null
  return {
    r: parseInt(m[1].slice(0, 2), 16),
    g: parseInt(m[1].slice(2, 4), 16),
    b: parseInt(m[1].slice(4, 6), 16)
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const v = Math.max(0, Math.min(255, Math.round(x)))
    return v.toString(16).padStart(2, '0')
  }).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  s /= 100; l /= 100
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h / 360) * 255),
    b: Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255)
  }
}

/** 单通道混合：normal 直接插值，其余模式先算模式结果再按比例从 A 插值 */
function blendChannel(a, b, blendMode, t) {
  let v
  switch (blendMode) {
    case 'normal':
      return Math.round(a + (b - a) * t)
    case 'multiply':
      v = a * b / 255
      break
    case 'screen':
      v = 255 - (255 - a) * (255 - b) / 255
      break
    case 'overlay':
      v = a < 128 ? (2 * a * b / 255) : (255 - 2 * (255 - a) * (255 - b) / 255)
      break
    case 'darken':
      v = Math.min(a, b)
      break
    case 'lighten':
      v = Math.max(a, b)
      break
    case 'difference':
      v = Math.abs(a - b)
      break
    case 'exclusion':
      v = a + b - 2 * a * b / 255
      break
    default:
      v = a
  }
  return Math.round(a + (v - a) * t)
}

/** HSL 空间下沿色相环最短弧线插值 */
function mixHsl(hslA, hslB, t) {
  let d = hslB.h - hslA.h
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return {
    h: hslA.h + d * t,
    s: hslA.s + (hslB.s - hslA.s) * t,
    l: hslA.l + (hslB.l - hslA.l) * t
  }
}

/** 按当前模式 + 空间混合两个 RGB 颜色 */
function mixColor(rgbA, rgbB, t) {
  if (mode.value === 'normal' && space.value === 'hsl') {
    const m = mixHsl(rgbToHsl(rgbA.r, rgbA.g, rgbA.b), rgbToHsl(rgbB.r, rgbB.g, rgbB.b), t)
    return hslToRgb(m.h, m.s, m.l)
  }
  return {
    r: blendChannel(rgbA.r, rgbB.r, mode.value, t),
    g: blendChannel(rgbA.g, rgbB.g, mode.value, t),
    b: blendChannel(rgbA.b, rgbB.b, mode.value, t)
  }
}

// --- computed results ---

const result = computed(() => {
  const a = parseHex(hexA.value)
  const b = parseHex(hexB.value)
  if (!a || !b) return null
  return mixColor(a, b, ratio.value / 100)
})

const resultHex = computed(() => {
  const c = result.value
  return c ? rgbToHex(c.r, c.g, c.b) : '#000000'
})

const resultRgb = computed(() => {
  const c = result.value
  return c ? `rgb(${c.r}, ${c.g}, ${c.b})` : 'rgb(0, 0, 0)'
})

const resultHsl = computed(() => {
  const c = result.value
  if (!c) return 'hsl(0, 0%, 0%)'
  const hsl = rgbToHsl(c.r, c.g, c.b)
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
})

// --- gradient canvas ---

function drawGradient() {
  const canvas = gradientCanvas.value
  if (!canvas) return
  const a = parseHex(hexA.value)
  const b = parseHex(hexB.value)
  if (!a || !b) return
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')
  if (w === 0 || h === 0) return
  const img = ctx.createImageData(w, h)
  for (let x = 0; x < w; x++) {
    const t = w <= 1 ? 0 : x / (w - 1)
    const c = mixColor(a, b, t)
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4
      img.data[i] = c.r
      img.data[i + 1] = c.g
      img.data[i + 2] = c.b
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  // 比例指示线 + 顶部三角
  const rx = Math.round((ratio.value / 100) * (w - 1))
  ctx.fillStyle = 'rgba(157,255,107,0.9)'
  ctx.fillRect(rx, 0, 2, h)
  ctx.beginPath()
  ctx.moveTo(rx, 0)
  ctx.lineTo(rx - 6, 8)
  ctx.lineTo(rx + 6, 8)
  ctx.closePath()
  ctx.fill()
}

function resizeCanvas() {
  const canvas = gradientCanvas.value
  if (!canvas) return
  const w = Math.max(10, Math.floor(canvas.clientWidth))
  if (canvas.width !== w) canvas.width = w
  drawGradient()
}

watch([hexA, hexB, ratio, mode, space], () => {
  error.value = ''
  drawGradient()
}, { flush: 'post' })

// --- input handlers ---

watch(pickerA, v => { hexA.value = v })
watch(pickerB, v => { hexB.value = v })

function onHexAInput() {
  const c = parseHex(hexA.value)
  if (c) pickerA.value = rgbToHex(c.r, c.g, c.b).toLowerCase()
}

function onHexABlur() {
  const c = parseHex(hexA.value)
  if (!c) {
    error.value = '颜色 A 格式无效，应为 #RRGGBB'
    hexA.value = pickerA.value
  } else {
    hexA.value = rgbToHex(c.r, c.g, c.b).toLowerCase()
    pickerA.value = hexA.value
  }
}

function onHexBInput() {
  const c = parseHex(hexB.value)
  if (c) pickerB.value = rgbToHex(c.r, c.g, c.b).toLowerCase()
}

function onHexBBlur() {
  const c = parseHex(hexB.value)
  if (!c) {
    error.value = '颜色 B 格式无效，应为 #RRGGBB'
    hexB.value = pickerB.value
  } else {
    hexB.value = rgbToHex(c.r, c.g, c.b).toLowerCase()
    pickerB.value = hexB.value
  }
}

// --- actions ---

function swap() {
  const ha = hexA.value, pa = pickerA.value
  hexA.value = hexB.value
  pickerA.value = pickerB.value
  hexB.value = ha
  pickerB.value = pa
}

function reset() {
  pickerA.value = '#9dff6b'
  pickerB.value = '#ff6b9d'
  hexA.value = '#9dff6b'
  hexB.value = '#ff6b9d'
  ratio.value = 50
  mode.value = 'normal'
  space.value = 'rgb'
  error.value = ''
  success.value = ''
}

async function copy(text) {
  if (!text) return
  const ok = await copyText(text)
  if (ok) {
    success.value = `已复制 ${text}`
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyAll() {
  const text = `HEX: ${resultHex.value}\nRGB: ${resultRgb.value}\nHSL: ${resultHsl.value}\n比例: ${ratio.value}% / ${modeLabel.value}`
  await copy(text)
}

// --- lifecycle ---

onMounted(() => {
  requestAnimationFrame(resizeCanvas)
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
.color-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.color-hex-wrap {
  flex: 1;
  min-width: 140px;
}

/* 混合模式按钮网格 */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 4px;
  font-family: inherit;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.mode-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

.mode-btn.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.mode-cn {
  font-size: 13px;
  line-height: 1.2;
}

.mode-en {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--muted);
}

.mode-btn.active .mode-en {
  color: var(--green);
}

.space-hint {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

/* 渐变预览 */
.gradient-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.end-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 62px;
  flex-shrink: 0;
}

.swatch-chip {
  width: 30px;
  height: 30px;
  background: var(--sw);
  border: 1px solid var(--line);
}

.swatch-hex {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
  text-align: center;
}

.gradient-canvas {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 48px;
  display: block;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.ratio-mark {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

/* 结果色块 */
.result-swatch {
  height: 64px;
  background: var(--res);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.result-swatch:hover {
  box-shadow: 0 0 16px var(--green-glow);
}

/* 输出格式行 */
.output-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.output-row + .output-row {
  margin-top: 8px;
}

.output-key {
  width: 42px;
  flex-shrink: 0;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
}

.output-row .input-with-copy {
  flex: 1;
  min-width: 0;
}

@media (max-width: 640px) {
  .mode-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-btn {
    padding: 8px 4px;
  }

  .gradient-wrap {
    gap: 6px;
  }

  .end-swatch {
    min-width: 52px;
  }

  .swatch-chip {
    width: 26px;
    height: 26px;
  }

  .gradient-canvas {
    height: 40px;
  }

  .result-swatch {
    height: 52px;
  }
}
</style>
