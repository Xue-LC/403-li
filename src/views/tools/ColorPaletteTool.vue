<template>
  <section class="tool-pane">
    <div class="tool-pane-head"><span>🎨 调色板生成器</span><span>在线工具</span></div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：颜色输入 + 方案选择 -->
          <div class="tool-col">
            <label class="tool-label">基础颜色：</label>
            <div class="color-input-row">
              <ColorPicker v-model="pickerColor" />
              <div class="input-with-copy color-hex-wrap">
                <input
                  type="text"
                  v-model="hexInput"
                  @input="onHexInput"
                  @blur="onHexBlur"
                  placeholder="#9dff6b"
                  class="code-input-sm"
                />
                <button class="copy-btn" @click="doCopy(hexInput)" title="复制 HEX">📋</button>
              </div>
            </div>

            <label class="tool-label">配色方案：</label>
            <div class="radio-group scheme-group">
              <label class="radio-label" v-for="s in schemes" :key="s.value">
                <input type="radio" v-model="schemeType" :value="s.value" />
                <span>{{ s.label }}</span>
              </label>
            </div>

            <label class="tool-label">色相偏移：{{ hueOffset }}°</label>
            <input type="range" v-model.number="hueOffset" min="0" max="60" class="range-input" />

            <label class="tool-label">饱和度偏移：{{ satOffset }}%</label>
            <input type="range" v-model.number="satOffset" min="-30" max="30" class="range-input" />

            <label class="tool-label">亮度偏移：{{ lightOffset }}%</label>
            <input type="range" v-model.number="lightOffset" min="-30" max="30" class="range-input" />
          </div>

          <!-- 右栏：调色板结果 -->
          <div class="tool-col">
            <label class="tool-label">生成配色（{{ paletteResult.length }} 色）：</label>
            <div class="palette-grid">
              <div
                v-for="(color, i) in paletteResult"
                :key="i"
                class="palette-item"
                :style="{ '--swatch-bg': color.hex }"
                @click="doCopy(color.hex)"
                :title="`点击复制 ${color.hex}`"
              >
                <div class="swatch"></div>
                <div class="swatch-info">
                  <span class="swatch-hex">{{ color.hex }}</span>
                  <span class="swatch-rgb">rgb({{ color.r }}, {{ color.g }}, {{ color.b }})</span>
                  <span class="swatch-contrast">
                    <span class="contrast-badge" :class="wcagGrade(color.contrastWhite)">白底 {{ color.contrastWhite }}:1</span>
                    <span class="contrast-badge" :class="wcagGrade(color.contrastBlack)">黑底 {{ color.contrastBlack }}:1</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="paletteResult.length === 0" class="palette-empty">
              选择一个基础颜色开始生成调色板
            </div>
          </div>
        </div>

        <!-- 批量复制按钮 -->
        <div class="button-group button-group-2" v-if="paletteResult.length > 0">
          <button class="tool-button primary" @click="copyCssVars">📋 复制 CSS 变量</button>
          <button class="tool-button" @click="copyTailwind">📋 复制 Tailwind 配置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="successMsg" class="status-success">✅ {{ successMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'
import ColorPicker from '../../components/ColorPicker.vue'

// --- state ---
const pickerColor = ref('#9dff6b')
const hexInput = ref('#9dff6b')
const schemeType = ref('complementary')
const hueOffset = ref(0)
const satOffset = ref(0)
const lightOffset = ref(0)
const error = ref('')
const successMsg = ref('')

watch(pickerColor, (val) => {
  hexInput.value = val
  error.value = ''
})

const schemes = [
  { value: 'complementary', label: '互补色 (Complementary)' },
  { value: 'analogous', label: '类比色 (Analogous)' },
  { value: 'triadic', label: '三角色 (Triadic)' },
  { value: 'split-complementary', label: '分裂互补 (Split-Complementary)' },
  { value: 'tetradic', label: '四角色 (Tetradic)' },
  { value: 'monochromatic', label: '单色系 (Monochromatic)' }
]

// --- helpers ---

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return { r, g, b }
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
  let h = 0, s = 0, l = (max + min) / 2
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
  h = h % 360
  if (h < 0) h += 360
  s /= 100; l /= 100
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h / 360 + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h / 360) * 255),
    b: Math.round(hue2rgb(p, q, h / 360 - 1/3) * 255)
  }
}

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(r1, g1, b1, r2, g2, b2) {
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(1)
}

// --- palette generation ---

const palette = computed(() => {
  const hex = hexInput.value.trim()
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return []

  const { r, g, b } = hexToRgb(hex)
  const baseHsl = rgbToHsl(r, g, b)

  const hues = generateHues(baseHsl.h, schemeType.value)
  const colors = hues.map(h => {
    const adjH = (h + hueOffset.value) % 360
    const adjS = Math.max(0, Math.min(100, baseHsl.s + satOffset.value))
    const adjL = Math.max(0, Math.min(100, baseHsl.l + lightOffset.value))
    const rgb = hslToRgb(adjH, adjS, adjL)
    const cWhite = contrastRatio(rgb.r, rgb.g, rgb.b, 255, 255, 255)
    const cBlack = contrastRatio(rgb.r, rgb.g, rgb.b, 0, 0, 0)
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      r: rgb.r, g: rgb.g, b: rgb.b,
      contrastWhite: Number(cWhite),
      contrastBlack: Number(cBlack)
    }
  })

  return colors
})

function generateHues(baseH, type) {
  switch (type) {
    case 'complementary':
      return [baseH, (baseH + 180) % 360]
    case 'analogous':
      return [((baseH - 30) + 360) % 360, baseH, (baseH + 30) % 360]
    case 'triadic':
      return [baseH, (baseH + 120) % 360, (baseH + 240) % 360]
    case 'split-complementary':
      return [baseH, (baseH + 150) % 360, (baseH + 210) % 360]
    case 'tetradic':
      return [baseH, (baseH + 90) % 360, (baseH + 180) % 360, (baseH + 270) % 360]
    case 'monochromatic':
      return [baseH, baseH, baseH, baseH, baseH]
    default:
      return [baseH]
  }
}

// For monochromatic, we adjust lightness manually after HSL calc
// Actually let me handle monochromatic with lightness variations
const monoPalette = computed(() => {
  if (schemeType.value !== 'monochromatic') return null
  const hex = hexInput.value.trim()
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null
  const { r, g, b } = hexToRgb(hex)
  const baseHsl = rgbToHsl(r, g, b)
  const adjH = (baseHsl.h + hueOffset.value) % 360
  const adjS = Math.max(0, Math.min(100, baseHsl.s + satOffset.value))

  const lightnesses = [
    Math.min(95, baseHsl.l + 30 + lightOffset.value),
    Math.min(90, baseHsl.l + 15 + lightOffset.value * 0.5),
    baseHsl.l + lightOffset.value * 0,
    Math.max(10, baseHsl.l - 15 + lightOffset.value * 0.5),
    Math.max(5, baseHsl.l - 30 + lightOffset.value)
  ]

  return lightnesses.map(l => {
    const adjL = Math.max(0, Math.min(100, l))
    const rgb = hslToRgb(adjH, adjS, adjL)
    const cWhite = contrastRatio(rgb.r, rgb.g, rgb.b, 255, 255, 255)
    const cBlack = contrastRatio(rgb.r, rgb.g, rgb.b, 0, 0, 0)
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      r: rgb.r, g: rgb.g, b: rgb.b,
      contrastWhite: Number(cWhite),
      contrastBlack: Number(cBlack)
    }
  })
})

const paletteResult = computed(() => {
  return monoPalette.value || palette.value
})

// --- WCAG grading ---

function wcagGrade(ratio) {
  if (ratio >= 7) return 'grade-aaa'
  if (ratio >= 4.5) return 'grade-aa'
  if (ratio >= 3) return 'grade-aa-large'
  return 'grade-fail'
}

// --- input handlers ---

function onPickerChange() {
  hexInput.value = pickerColor.value
  error.value = ''
}

function onHexInput() {
  const hex = hexInput.value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    pickerColor.value = hex.toLowerCase()
    error.value = ''
  }
}

function onHexBlur() {
  const hex = hexInput.value.trim()
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    error.value = '无效的 HEX 格式（需要 #RRGGBB）'
    hexInput.value = pickerColor.value
  } else {
    hexInput.value = hex.toLowerCase()
    pickerColor.value = hex.toLowerCase()
    error.value = ''
  }
}

// --- copy ---

async function doCopy(text) {
  const ok = await copyText(text)
  if (ok) {
    successMsg.value = `已复制 ${text}`
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}

async function copyCssVars() {
  const vars = paletteResult.value.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')
  const css = `:root {\n${vars}\n}`
  await doCopy(css)
}

async function copyTailwind() {
  const colors = paletteResult.value.map((c, i) => `        ${i + 1}00: '${c.hex}',`).join('\n')
  const tw = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${colors}\n        }\n      }\n    }\n  }\n}`
  await doCopy(tw)
}

// --- init ---
onPickerChange()
</script>

<style scoped>
.color-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.native-picker {
  width: 48px;
  height: 40px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.color-hex-wrap {
  flex: 1;
  min-width: 140px;
}

.scheme-group {
  flex-direction: column;
  gap: 6px;
}

/* palette grid */
.palette-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-empty {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  text-align: center;
  padding: 32px 12px;
  border: 1px dashed var(--line);
  background: var(--panel-2);
}

.palette-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}

.palette-item:hover {
  border-color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.swatch {
  width: 44px;
  height: 44px;
  background: var(--swatch-bg);
  border: 1px solid var(--line);
  flex-shrink: 0;
  position: relative;
}

.swatch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.swatch-hex {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--text);
  font-weight: bold;
}

.swatch-rgb {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.swatch-contrast {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.contrast-badge {
  font-family: var(--mono);
  font-size: 10px;
  padding: 1px 6px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
}

.contrast-badge.grade-aaa {
  border-color: var(--green);
  color: var(--green);
  background: var(--green-soft);
}

.contrast-badge.grade-aa {
  border-color: var(--green-soft);
  color: var(--green);
}

.contrast-badge.grade-aa-large {
  border-color: var(--accent);
  color: var(--accent);
  opacity: 0.7;
}

.contrast-badge.grade-fail {
  border-color: var(--red);
  color: var(--red);
}

@media (max-width: 640px) {
  .color-input-row {
    flex-direction: row;
  }

  .swatch {
    width: 36px;
    height: 36px;
  }

  .swatch-hex {
    font-size: 13px;
  }
}
</style>
