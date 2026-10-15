<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📐 CSS Clamp 计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：参数配置 -->
          <div class="tool-col">
            <label class="tool-label">生成模式：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="mode" value="fluid" />
                <span>流体自适应（推荐）</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="mode" value="simple" />
                <span>手动 min / preferred / max</span>
              </label>
            </div>

            <!-- 流体模式：按两个视口断点自动计算首选值 -->
            <template v-if="mode === 'fluid'">
              <label class="tool-label">小屏视口宽度（px）：</label>
              <input v-model="fVwMin" type="number" min="1" class="code-input-sm" placeholder="320" />

              <label class="tool-label">大屏视口宽度（px）：</label>
              <input v-model="fVwMax" type="number" min="1" class="code-input-sm" placeholder="1440" />

              <label class="tool-label">小屏尺寸（px）：</label>
              <input v-model="fSizeMin" type="number" min="0" step="0.5" class="code-input-sm" placeholder="16" />

              <label class="tool-label">大屏尺寸（px）：</label>
              <input v-model="fSizeMax" type="number" min="0" step="0.5" class="code-input-sm" placeholder="24" />

              <div class="tpl-hint">
                💡 首选值由两点线性插值自动算出（视口 {{ fVwMin || 0 }}px 时取
                {{ fSizeMin || 0 }}px，{{ fVwMax || 0 }}px 时取 {{ fSizeMax || 0 }}px）
              </div>
            </template>

            <!-- 手动模式 -->
            <template v-else>
              <label class="tool-label">最小值 min：</label>
              <div class="val-row">
                <input v-model="minVal" type="number" step="0.5" class="code-input-sm val-input" placeholder="16" />
                <select v-model="minUnit" class="unit-select">
                  <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>

              <label class="tool-label">首选值 preferred：</label>
              <div class="val-row">
                <input v-model="prefVal" type="number" step="0.5" class="code-input-sm val-input" placeholder="2.5" />
                <select v-model="prefUnit" class="unit-select">
                  <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>

              <label class="tool-label">最大值 max：</label>
              <div class="val-row">
                <input v-model="maxVal" type="number" step="0.5" class="code-input-sm val-input" placeholder="24" />
                <select v-model="maxUnit" class="unit-select">
                  <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>
            </template>

            <label class="tool-label">应用属性：</label>
            <select v-model="property" class="unit-select prop-select">
              <option value="font-size">font-size（字号）</option>
              <option value="padding">padding（内边距）</option>
              <option value="margin">margin（外边距）</option>
              <option value="gap">gap（间距）</option>
              <option value="width">width（宽度）</option>
              <option value="height">height（高度）</option>
            </select>

            <label class="tool-label">CSS 选择器：</label>
            <input v-model="selector" class="code-input-sm" placeholder=".responsive-title" />
          </div>

          <!-- 右栏：结果 + CSS + 预览 -->
          <div class="tool-col">
            <label class="tool-label">
              clamp() 表达式：
              <button class="copy-btn" title="复制 clamp 值" :disabled="!clampValue" @click="copyClamp">📋</button>
            </label>
            <div class="result-display clamp-result">{{ clampValue || '—' }}</div>

            <label class="tool-label">
              CSS 代码：
              <button class="copy-btn" title="复制 CSS" :disabled="!generatedCSS" @click="copyCSS">📋</button>
            </label>
            <textarea
              :value="generatedCSS"
              readonly
              rows="7"
              class="code-input output"
              placeholder="配置参数后自动生成 CSS..."
            ></textarea>

            <label class="tool-label">实时预览（视口 {{ previewWidth }}px）：</label>
            <input
              type="range"
              v-model.number="previewWidth"
              min="280"
              max="1920"
              step="1"
              class="range-input"
            />
            <div class="preview-frame">
              <iframe
                :srcdoc="previewDoc"
                :style="{ width: previewWidth + 'px' }"
                class="preview-iframe"
                title="clamp 实时预览"
              ></iframe>
            </div>
            <div class="tpl-hint">🖱️ 拖动滑块改变预览视口宽度，观察元素的实时缩放效果</div>
          </div>
        </div>

        <!-- 全宽：不同宽度下的解析值（仅流体模式） -->
        <template v-if="mode === 'fluid' && fluidOK">
          <label class="tool-label">不同视口宽度下的解析值：</label>
          <div class="resolve-list">
            <div v-for="w in tableWidths" :key="w" class="resolve-item">
              <span class="resolve-w">{{ w }}px</span>
              <span class="resolve-bar-wrap">
                <span class="resolve-bar" :style="{ width: barWidth(w) + '%' }"></span>
              </span>
              <span class="resolve-v">{{ resolvedAt(w).toFixed(2) }}px</span>
            </div>
          </div>
        </template>

        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!generatedCSS" @click="copyCSS">📋 复制 CSS</button>
          <button class="tool-button" :disabled="!clampValue" @click="copyClamp">📋 复制 clamp()</button>
          <button class="tool-button danger" @click="reset">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { copyText } from '../../utils/clipboard'

const mode = ref('fluid')
const units = ['px', 'rem', 'em', '%', 'vw', 'vh', 'vmin', 'vmax', 'ch']

// 流体模式参数
const fVwMin = ref('320')
const fVwMax = ref('1440')
const fSizeMin = ref('16')
const fSizeMax = ref('24')

// 手动模式参数
const minVal = ref('16')
const minUnit = ref('px')
const prefVal = ref('2.5')
const prefUnit = ref('vw')
const maxVal = ref('24')
const maxUnit = ref('px')

const property = ref('font-size')
const selector = ref('.responsive-title')
const previewWidth = ref(768)

const error = ref('')
const success = ref('')
let successTimer = null

const DEFAULT_STATE = {
  mode: 'fluid',
  fVwMin: '320',
  fVwMax: '1440',
  fSizeMin: '16',
  fSizeMax: '24',
  minVal: '16',
  minUnit: 'px',
  prefVal: '2.5',
  prefUnit: 'vw',
  maxVal: '24',
  maxUnit: 'px',
  property: 'font-size',
  selector: '.responsive-title',
  previewWidth: 768
}

/** 数字格式化：去掉多余的 0 和小数点 */
function fmt(n, digits = 4) {
  if (!isFinite(n)) return '0'
  return String(Number(Number(n).toFixed(digits)))
}

/** 是否为有效数字字符串 */
function isNum(v) {
  const s = String(v).trim()
  if (!s) return false
  return isFinite(Number(s))
}

/** 组合「数值 + 单位」，非法返回空串 */
function withUnit(v, u) {
  if (!isNum(v)) return ''
  return `${fmt(Number(v))}${u}`
}

/** 流体模式线性插值结果 */
const fluid = computed(() => {
  if (mode.value !== 'fluid') return null
  if (![fVwMin, fVwMax, fSizeMin, fSizeMax].every(r => isNum(r.value))) return null
  const vwMin = Number(fVwMin.value)
  const vwMax = Number(fVwMax.value)
  const sMin = Number(fSizeMin.value)
  const sMax = Number(fSizeMax.value)
  if (vwMax <= vwMin) return null
  const perPx = (sMax - sMin) / (vwMax - vwMin)
  return {
    vwMin,
    vwMax,
    sMin,
    sMax,
    perPx,
    intercept: sMin - perPx * vwMin,
    vwCoef: perPx * 100
  }
})

const fluidOK = computed(() => fluid.value !== null)

const minStr = computed(() => {
  if (mode.value === 'fluid') return fluid.value ? `${fmt(fluid.value.sMin)}px` : ''
  return withUnit(minVal.value, minUnit.value)
})

const maxStr = computed(() => {
  if (mode.value === 'fluid') return fluid.value ? `${fmt(fluid.value.sMax)}px` : ''
  return withUnit(maxVal.value, maxUnit.value)
})

const preferredStr = computed(() => {
  if (mode.value === 'simple') return withUnit(prefVal.value, prefUnit.value)
  const f = fluid.value
  if (!f) return ''
  const b = f.vwCoef
  const a = f.intercept
  if (Math.abs(a) < 0.005) return `${fmt(b)}vw`
  if (a > 0) return `calc(${fmt(b)}vw + ${fmt(a)}px)`
  return `calc(${fmt(b)}vw - ${fmt(Math.abs(a))}px)`
})

const clampValue = computed(() => {
  if (error.value) return ''
  if (!minStr.value || !preferredStr.value || !maxStr.value) return ''
  return `clamp(${minStr.value}, ${preferredStr.value}, ${maxStr.value})`
})

function validate() {
  if (mode.value === 'simple') {
    if (!isNum(minVal.value)) return '请输入有效的最小值（min）'
    if (!isNum(prefVal.value)) return '请输入有效的首选值（preferred）'
    if (!isNum(maxVal.value)) return '请输入有效的最大值（max）'
    if (Number(minVal.value) > Number(maxVal.value)) return '最小值不应大于最大值'
    return ''
  }
  if (!isNum(fVwMin.value) || Number(fVwMin.value) <= 0) return '小屏视口宽度必须是大于 0 的数字'
  if (!isNum(fVwMax.value) || Number(fVwMax.value) <= 0) return '大屏视口宽度必须是大于 0 的数字'
  if (Number(fVwMax.value) <= Number(fVwMin.value)) return '大屏视口宽度必须大于小屏视口宽度'
  if (!isNum(fSizeMin.value) || Number(fSizeMin.value) < 0) return '小屏尺寸必须是不小于 0 的数字'
  if (!isNum(fSizeMax.value) || Number(fSizeMax.value) < 0) return '大屏尺寸必须是不小于 0 的数字'
  if (Number(fSizeMax.value) < Number(fSizeMin.value)) return '大屏尺寸不应小于小屏尺寸'
  return ''
}

const generatedCSS = computed(() => {
  if (error.value || !clampValue.value) return ''
  const sel = (selector.value || '').trim() || '.responsive-title'
  return `/* 403.li CSS clamp() 生成器 */\n${sel} {\n  ${property.value}: ${clampValue.value};\n}\n`
})

/** 各断点解析值 */
const tableWidths = computed(() => {
  const set = new Set([320, 375, 480, 640, 768, 900, 1024, 1280, 1440, 1920])
  const f = fluid.value
  if (f) {
    set.add(Math.round(f.vwMin))
    set.add(Math.round(f.vwMax))
  }
  return [...set].filter(w => w >= 240 && w <= 2560).sort((a, b) => a - b)
})

function resolvedAt(w) {
  const f = fluid.value
  if (!f) return 0
  if (w <= f.vwMin) return f.sMin
  if (w >= f.vwMax) return f.sMax
  return f.intercept + f.perPx * w
}

const maxResolved = computed(() => {
  if (!fluid.value) return 1
  return Math.max(fluid.value.sMin, fluid.value.sMax, 0.001)
})

function barWidth(w) {
  const v = resolvedAt(w)
  return Math.max(2, Math.min(100, (v / maxResolved.value) * 100))
}

/** 预览区 CSS 规则（按所选属性生成） */
const previewRule = computed(() => {
  const v = clampValue.value
  if (!v) return ''
  switch (property.value) {
    case 'font-size':
      return `.clamp-demo { font-size: ${v}; line-height: 1.45; }`
    case 'padding':
      return `.clamp-demo { padding: ${v}; }`
    case 'margin':
      return `.clamp-demo { margin: ${v}; }`
    case 'width':
      return `.clamp-demo { width: ${v}; }`
    case 'height':
      return `.clamp-demo { height: ${v}; min-height: 24px; }`
    case 'gap':
      return `.clamp-demo { display: flex; flex-wrap: wrap; gap: ${v}; }`
    default:
      return ''
  }
})

const previewDoc = computed(() => {
  const rule = previewRule.value
  const inner =
    property.value === 'gap'
      ? '<span class="chip">alpha</span><span class="chip">beta</span><span class="chip">gamma</span><span class="chip">delta</span>'
      : '响应式示例文字 Responsive 0123'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: #0d1117;
  color: #c9d1d9;
  font-family: 'Maple Mono NF CN', 'Monaco', 'Consolas', monospace;
  padding: 16px;
  overflow-x: hidden;
}
.hint { color: #8b949e; font-size: 11px; margin-bottom: 12px; }
.hint b { color: #9dff6b; font-weight: normal; }
.clamp-demo {
  border: 1px dashed rgba(157,255,107,0.4);
  background: rgba(157,255,107,0.06);
  color: #9dff6b;
  overflow-wrap: anywhere;
}
.chip {
  border: 1px solid rgba(157,255,107,0.4);
  background: rgba(157,255,107,0.08);
  color: #9dff6b;
  padding: 4px 8px;
  font-size: 12px;
}
${rule}
</style>
</head>
<body>
  <div class="hint">当前预览视口宽度：<b id="w">0</b>px</div>
  <div class="clamp-demo">${inner}</div>
<script>
function upd() { document.getElementById('w').textContent = window.innerWidth; }
window.addEventListener('resize', upd);
upd();
<\/script>
</body>
</html>`
})

function showSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    success.value = ''
  }, 2500)
}

async function copyCSS() {
  if (!generatedCSS.value) return
  const ok = await copyText(generatedCSS.value)
  if (ok) showSuccess('CSS 代码已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

async function copyClamp() {
  if (!clampValue.value) return
  const ok = await copyText(clampValue.value)
  if (ok) showSuccess('clamp() 表达式已复制到剪贴板')
  else error.value = '复制失败，请手动选择复制'
}

function reset() {
  mode.value = DEFAULT_STATE.mode
  fVwMin.value = DEFAULT_STATE.fVwMin
  fVwMax.value = DEFAULT_STATE.fVwMax
  fSizeMin.value = DEFAULT_STATE.fSizeMin
  fSizeMax.value = DEFAULT_STATE.fSizeMax
  minVal.value = DEFAULT_STATE.minVal
  minUnit.value = DEFAULT_STATE.minUnit
  prefVal.value = DEFAULT_STATE.prefVal
  prefUnit.value = DEFAULT_STATE.prefUnit
  maxVal.value = DEFAULT_STATE.maxVal
  maxUnit.value = DEFAULT_STATE.maxUnit
  property.value = DEFAULT_STATE.property
  selector.value = DEFAULT_STATE.selector
  previewWidth.value = DEFAULT_STATE.previewWidth
  error.value = ''
  success.value = ''
}

// 校验状态随参数实时更新
watchEffect(() => {
  const v = validate()
  if (v !== error.value) error.value = v
})
</script>

<style scoped>
/* 标签内复制按钮定位（.copy-btn 为全局绝对定位） */
.tool-label {
  position: relative;
  padding-right: 34px;
}

/* 数值 + 单位 一行 */
.val-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.val-input {
  flex: 1 1 auto;
  min-width: 0;
}

.unit-select {
  flex: 0 0 92px;
  height: 36px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0 6px;
}

.unit-select:focus {
  outline: 0;
  border-color: var(--green);
  box-shadow: 0 0 12px var(--green-glow);
}

.prop-select {
  flex: none;
  width: 100%;
  height: 40px;
}

/* 提示文字 */
.tpl-hint {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
}

/* clamp 结果展示 */
.clamp-result {
  font-size: 13px;
  word-break: break-all;
  line-height: 1.6;
}

/* 预览区 */
.preview-frame {
  border: 1px solid var(--line);
  background: var(--panel-2);
  overflow-x: auto;
  min-height: 200px;
}

.preview-iframe {
  display: block;
  height: 200px;
  border: 0;
  max-width: none;
}

/* 解析值列表 */
.resolve-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 12px;
}

.resolve-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resolve-w {
  flex: 0 0 62px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}

.resolve-bar-wrap {
  flex: 1 1 auto;
  height: 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  overflow: hidden;
}

.resolve-bar {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--green-soft), var(--green));
  transition: width 0.25s ease;
}

.resolve-v {
  flex: 0 0 74px;
  text-align: right;
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .preview-iframe {
    height: 170px;
  }

  .resolve-w,
  .resolve-v {
    font-size: 11px;
  }

  .resolve-w {
    flex: 0 0 52px;
  }

  .resolve-v {
    flex: 0 0 62px;
  }
}
</style>
