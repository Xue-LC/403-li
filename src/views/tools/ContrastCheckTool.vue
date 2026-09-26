<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 颜色对比度检查器</span>
      <span>WCAG 2.1</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左栏：颜色输入 -->
          <div class="tool-col">
            <label class="tool-label">前景色 (文本色)：</label>
            <div class="cc-input-row">
              <ColorPicker v-model="fgPicker" />
              <div class="input-with-copy cc-hex-wrap">
                <input
                  type="text"
                  v-model="fgInput"
                  @input="onFgInput"
                  @blur="onFgBlur"
                  placeholder="#ffffff"
                  class="code-input-sm"
                />
                <button class="copy-btn" @click="doCopy(fgInput)" title="复制前景色">📋</button>
              </div>
            </div>

            <div class="cc-color-preview" :style="{ background: validFg }">
              <span class="cc-preview-label" :style="{ color: validBg }">前景色预览</span>
            </div>

            <label class="tool-label cc-mt">背景色：</label>
            <div class="cc-input-row">
              <ColorPicker v-model="bgPicker" />
              <div class="input-with-copy cc-hex-wrap">
                <input
                  type="text"
                  v-model="bgInput"
                  @input="onBgInput"
                  @blur="onBgBlur"
                  placeholder="#1a1a2e"
                  class="code-input-sm"
                />
                <button class="copy-btn" @click="doCopy(bgInput)" title="复制背景色">📋</button>
              </div>
            </div>

            <div class="cc-color-preview" :style="{ background: validBg }">
              <span class="cc-preview-label" :style="{ color: validFg }">背景色预览</span>
            </div>

            <!-- 预设颜色组 -->
            <label class="tool-label cc-mt">预设颜色对：</label>
            <div class="cc-preset-grid">
              <button
                v-for="preset in presets"
                :key="preset.label"
                class="cc-preset-btn"
                @click="applyPreset(preset)"
                :title="preset.label"
              >
                <span
                  class="cc-preset-swatch"
                  :style="{ background: preset.bg, color: preset.fg }"
                >Aa</span>
                <span class="cc-preset-label">{{ preset.label }}</span>
              </button>
            </div>

            <!-- 交换按钮 -->
            <div class="button-group">
              <button class="tool-button" @click="swapColors">🔄 交换前景/背景</button>
            </div>
          </div>

          <!-- 右栏：结果 -->
          <div class="tool-col">
            <label class="tool-label">对比度结果：</label>

            <div v-if="!validFg || !validBg" class="cc-placeholder">
              请输入有效的前景色和背景色 (#RRGGBB)
            </div>

            <template v-else>
              <!-- 对比度数值 -->
              <div class="cc-ratio-display">
                <div class="cc-ratio-bar">
                  <div class="cc-ratio-fill" :style="ratioBarStyle"></div>
                </div>
                <div class="cc-ratio-value" :style="{ color: ratioColor }">
                  {{ ratioDisplay }}:1
                </div>
              </div>

              <!-- WCAG 评级 -->
              <div class="cc-wcag-grid">
                <div class="cc-wcag-item" :class="{ pass: ratio >= 4.5 }">
                  <span class="cc-wcag-label">AA 正常文本</span>
                  <span class="cc-wcag-badge" :class="ratio >= 4.5 ? 'pass' : 'fail'">
                    {{ ratio >= 4.5 ? '✅ 通过' : '❌ 未通过' }}
                  </span>
                  <span class="cc-wcag-threshold">≥ 4.5:1</span>
                </div>
                <div class="cc-wcag-item" :class="{ pass: ratio >= 3 }">
                  <span class="cc-wcag-label">AA 大文本</span>
                  <span class="cc-wcag-badge" :class="ratio >= 3 ? 'pass' : 'fail'">
                    {{ ratio >= 3 ? '✅ 通过' : '❌ 未通过' }}
                  </span>
                  <span class="cc-wcag-threshold">≥ 3:1</span>
                </div>
                <div class="cc-wcag-item" :class="{ pass: ratio >= 7 }">
                  <span class="cc-wcag-label">AAA 正常文本</span>
                  <span class="cc-wcag-badge" :class="ratio >= 7 ? 'pass' : 'fail'">
                    {{ ratio >= 7 ? '✅ 通过' : '❌ 未通过' }}
                  </span>
                  <span class="cc-wcag-threshold">≥ 7:1</span>
                </div>
                <div class="cc-wcag-item" :class="{ pass: ratio >= 4.5 }">
                  <span class="cc-wcag-label">AAA 大文本</span>
                  <span class="cc-wcag-badge" :class="ratio >= 4.5 ? 'pass' : 'fail'">
                    {{ ratio >= 4.5 ? '✅ 通过' : '❌ 未通过' }}
                  </span>
                  <span class="cc-wcag-threshold">≥ 4.5:1</span>
                </div>
              </div>

              <!-- 文本预览 -->
              <label class="tool-label">文本预览：</label>
              <div class="cc-text-preview" :style="{ background: validBg }">
                <p class="cc-preview-normal" :style="{ color: validFg }">
                  正常文本 — The quick brown fox jumps over the lazy dog.
                </p>
                <p class="cc-preview-large" :style="{ color: validFg }">
                  大文本 — 敏捷的棕色狐狸跳过了懒狗。
                </p>
                <p class="cc-preview-small" :style="{ color: validFg }">
                  小号文本 — 这是一段小号文字用于测试可读性。
                </p>
              </div>

              <!-- 颜色信息 -->
              <div class="cc-color-info">
                <div class="cc-info-item">
                  <span class="cc-info-dot" :style="{ background: validFg }"></span>
                  <span class="cc-info-label">前景</span>
                  <span class="cc-info-value">{{ validFg }}</span>
                  <span class="cc-info-rgb">{{ fgRgb }}</span>
                </div>
                <div class="cc-info-item">
                  <span class="cc-info-dot" :style="{ background: validBg }"></span>
                  <span class="cc-info-label">背景</span>
                  <span class="cc-info-value">{{ validBg }}</span>
                  <span class="cc-info-rgb">{{ bgRgb }}</span>
                </div>
              </div>

              <!-- 建议 -->
              <div v-if="ratio < 4.5" class="cc-suggestions">
                <label class="tool-label">💡 改进建议：</label>
                <div class="cc-suggest-grid">
                  <button
                    v-for="sug in suggestions"
                    :key="sug.hex"
                    class="cc-suggest-item"
                    @click="applySuggestion(sug)"
                  >
                    <div class="cc-suggest-swatch" :style="{ background: sug.hex }"></div>
                    <div class="cc-suggest-info">
                      <span class="cc-suggest-hex">{{ sug.hex }}</span>
                      <span class="cc-suggest-ratio">对比度 {{ sug.ratio }}:1</span>
                    </div>
                  </button>
                </div>
              </div>
            </template>
          </div>
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
const fgPicker = ref('#ffffff')
const bgPicker = ref('#1a1a2e')
const fgInput = ref('#ffffff')
const bgInput = ref('#1a1a2e')
const error = ref('')
const successMsg = ref('')

watch(fgPicker, (val) => { fgInput.value = val })
watch(bgPicker, (val) => { bgInput.value = val })

const presets = [
  { label: '白 / 深蓝', fg: '#ffffff', bg: '#1a1a2e' },
  { label: '黑 / 白', fg: '#000000', bg: '#ffffff' },
  { label: '绿 / 深色', fg: '#9dff6b', bg: '#12121f' },
  { label: '黄 / 深色', fg: '#ffdd57', bg: '#1a1a2e' },
  { label: '灰 / 白', fg: '#767676', bg: '#ffffff' },
  { label: '白 / 蓝', fg: '#ffffff', bg: '#2563eb' }
]

// --- helpers ---
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  }
}

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function calcContrast(fgHex, bgHex) {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  const l1 = relativeLuminance(fg.r, fg.g, fg.b)
  const l2 = relativeLuminance(bg.r, bg.g, bg.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// --- computed ---
const validFg = computed(() => isValidHex(fgInput.value) ? fgInput.value.toLowerCase() : '')
const validBg = computed(() => isValidHex(bgInput.value) ? bgInput.value.toLowerCase() : '')

const ratio = computed(() => {
  if (!validFg.value || !validBg.value) return 0
  return calcContrast(validFg.value, validBg.value)
})

const ratioDisplay = computed(() => ratio.value ? ratio.value.toFixed(1) : '0')

const fgRgb = computed(() => {
  if (!validFg.value) return ''
  const { r, g, b } = hexToRgb(validFg.value)
  return `rgb(${r}, ${g}, ${b})`
})

const bgRgb = computed(() => {
  if (!validBg.value) return ''
  const { r, g, b } = hexToRgb(validBg.value)
  return `rgb(${r}, ${g}, ${b})`
})

const ratioColor = computed(() => {
  if (ratio.value >= 7) return 'var(--green)'
  if (ratio.value >= 4.5) return 'var(--green)'
  if (ratio.value >= 3) return 'var(--accent)'
  return 'var(--red)'
})

const ratioBarStyle = computed(() => {
  const pct = Math.min(100, (ratio.value / 7) * 100)
  let color = 'var(--red)'
  if (ratio.value >= 7) color = 'var(--green)'
  else if (ratio.value >= 4.5) color = 'var(--green)'
  else if (ratio.value >= 3) color = 'var(--accent)'
  return { width: pct + '%', background: color }
})

// --- suggestions (generate alternative foregrounds) ---
const suggestions = computed(() => {
  if (!validBg.value || ratio.value >= 4.5) return []

  const bg = hexToRgb(validBg.value)
  const bgLum = relativeLuminance(bg.r, bg.g, bg.b)
  const isDarkBg = bgLum < 0.18

  // Generate candidates by stepping towards better contrast
  const candidates = []

  if (isDarkBg) {
    // Dark background: suggest lighter foregrounds
    const currentFg = validFg.value ? hexToRgb(validFg.value) : { r: 128, g: 128, b: 128 }
    const steps = [
      { r: 255, g: 255, b: 255 },
      { r: 224, g: 255, b: 200 },
      { r: 255, g: 245, b: 200 },
      { r: 200, g: 230, b: 255 },
      { r: 255, g: 220, b: 220 }
    ]
    for (const c of steps) {
      const hex = rgbToHex(c.r, c.g, c.b)
      const r = calcContrast(hex, validBg.value)
      candidates.push({ hex, ratio: r.toFixed(1) })
    }
  } else {
    // Light background: suggest darker foregrounds
    const steps = [
      { r: 0, g: 0, b: 0 },
      { r: 30, g: 30, b: 30 },
      { r: 50, g: 50, b: 50 },
      { r: 70, g: 70, b: 70 },
      { r: 90, g: 30, b: 30 }
    ]
    for (const c of steps) {
      const hex = rgbToHex(c.r, c.g, c.b)
      const r = calcContrast(hex, validBg.value)
      candidates.push({ hex, ratio: r.toFixed(1) })
    }
  }

  // Also try pushing current FG toward better contrast
  if (validFg.value) {
    const fg = hexToRgb(validFg.value)
    const step = isDarkBg ? 40 : -40
    for (let i = 1; i <= 3; i++) {
      const r = Math.max(0, Math.min(255, fg.r + step * i))
      const g = Math.max(0, Math.min(255, fg.g + step * i))
      const b = Math.max(0, Math.min(255, fg.b + step * i))
      const hex = rgbToHex(r, g, b)
      const contrast = calcContrast(hex, validBg.value)
      if (contrast >= 3) {
        candidates.unshift({ hex, ratio: contrast.toFixed(1) })
      }
    }
  }

  // Deduplicate and sort by ratio descending
  const seen = new Set()
  return candidates
    .filter(c => !seen.has(c.hex) && seen.add(c.hex))
    .sort((a, b) => Number(b.ratio) - Number(a.ratio))
    .slice(0, 5)
})

// --- input handlers ---
function onFgPicker() {
  fgInput.value = fgPicker.value
  error.value = ''
}

function onBgPicker() {
  bgInput.value = bgPicker.value
  error.value = ''
}

function onFgInput() {
  const v = fgInput.value.trim()
  if (isValidHex(v)) {
    fgPicker.value = v.toLowerCase()
    error.value = ''
  }
}

function onBgInput() {
  const v = bgInput.value.trim()
  if (isValidHex(v)) {
    bgPicker.value = v.toLowerCase()
    error.value = ''
  }
}

function onFgBlur() {
  const v = fgInput.value.trim()
  if (!isValidHex(v)) {
    fgInput.value = fgPicker.value
    if (v.length > 0) error.value = '无效的前景色格式（需要 #RRGGBB）'
  } else {
    fgInput.value = v.toLowerCase()
    fgPicker.value = v.toLowerCase()
    error.value = ''
  }
}

function onBgBlur() {
  const v = bgInput.value.trim()
  if (!isValidHex(v)) {
    bgInput.value = bgPicker.value
    if (v.length > 0) error.value = '无效的背景色格式（需要 #RRGGBB）'
  } else {
    bgInput.value = v.toLowerCase()
    bgPicker.value = v.toLowerCase()
    error.value = ''
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const v = Math.max(0, Math.min(255, Math.round(x)))
    return v.toString(16).padStart(2, '0')
  }).join('')
}

// --- actions ---
function swapColors() {
  const tmpFg = fgInput.value
  const tmpFgP = fgPicker.value
  fgInput.value = bgInput.value
  fgPicker.value = bgPicker.value
  bgInput.value = tmpFg
  bgPicker.value = tmpFgP
  error.value = ''
}

function applyPreset(preset) {
  fgInput.value = preset.fg
  fgPicker.value = preset.fg
  bgInput.value = preset.bg
  bgPicker.value = preset.bg
  error.value = ''
}

function applySuggestion(sug) {
  fgInput.value = sug.hex
  fgPicker.value = sug.hex
  error.value = ''
}

async function doCopy(text) {
  const ok = await copyText(text)
  if (ok) {
    successMsg.value = `已复制 ${text}`
    setTimeout(() => { successMsg.value = '' }, 2000)
  }
}
</script>

<style scoped>
/* --- input row --- */
.cc-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cc-native-picker {
  width: 48px;
  height: 40px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}

.cc-hex-wrap {
  flex: 1;
  min-width: 140px;
}

.cc-mt {
  margin-top: 14px;
}

/* --- color preview swatches --- */
.cc-color-preview {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  text-align: center;
}

.cc-preview-label {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: bold;
}

/* --- presets --- */
.cc-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 6px;
}

.cc-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  color: var(--text);
  transition: border-color 0.2s;
}

.cc-preset-btn:hover {
  border-color: var(--green);
}

.cc-preset-swatch {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid var(--line);
}

.cc-preset-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
}

/* --- ratio display --- */
.cc-placeholder {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 13px;
  text-align: center;
  padding: 32px 12px;
  border: 1px dashed var(--line);
  background: var(--panel-2);
}

.cc-ratio-display {
  margin-bottom: 12px;
}

.cc-ratio-bar {
  height: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  position: relative;
}

.cc-ratio-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}

.cc-ratio-value {
  font-family: var(--mono);
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  margin-top: 6px;
  transition: color 0.3s ease;
}

/* --- WCAG grid --- */
.cc-wcag-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
}

.cc-wcag-item {
  padding: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cc-wcag-item.pass {
  border-color: var(--green);
  background: var(--green-soft);
}

.cc-wcag-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
}

.cc-wcag-badge {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: bold;
}

.cc-wcag-badge.pass {
  color: var(--green);
}

.cc-wcag-badge.fail {
  color: var(--red);
}

.cc-wcag-threshold {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
}

/* --- text preview --- */
.cc-text-preview {
  padding: 14px;
  border: 1px solid var(--line);
  margin-bottom: 12px;
}

.cc-preview-normal {
  font-size: 16px;
  line-height: 1.5;
  margin: 0 0 8px;
}

.cc-preview-large {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.4;
  margin: 0 0 6px;
}

.cc-preview-small {
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

/* --- color info --- */
.cc-color-info {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.cc-info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  align-items: center;
}

.cc-info-dot {
  width: 14px;
  height: 14px;
  border: 1px solid var(--line);
  flex-shrink: 0;
}

.cc-info-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
}

.cc-info-value {
  font-family: var(--mono);
  font-size: 15px;
  font-weight: bold;
  color: var(--text);
}

.cc-info-rgb {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* --- suggestions --- */
.cc-suggestions {
  margin-top: 4px;
}

.cc-suggest-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 6px;
}

.cc-suggest-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  cursor: pointer;
  color: var(--text);
  transition: border-color 0.2s;
  width: 100%;
  text-align: left;
}

.cc-suggest-item:hover {
  border-color: var(--green);
}

.cc-suggest-swatch {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  flex-shrink: 0;
}

.cc-suggest-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.cc-suggest-hex {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: bold;
  color: var(--text);
}

.cc-suggest-ratio {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* --- responsive --- */
@media (max-width: 640px) {
  .cc-ratio-value {
    font-size: 28px;
  }

  .cc-wcag-grid {
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .cc-preset-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .cc-preview-large {
    font-size: 18px;
  }
}

@media (max-width: 375px) {
  .cc-preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
