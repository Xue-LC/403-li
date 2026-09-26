<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🌿 L-System 分形生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <div class="tool-two-col">
          <!-- 左栏：参数控制 -->
          <div class="tool-col">
            <label class="tool-label">预设图案：</label>
            <div class="radio-group preset-group">
              <label v-for="p in presets" :key="p.key" class="radio-label preset-item">
                <input type="radio" v-model="presetKey" :value="p.key" />
                <span>{{ p.label }}</span>
              </label>
            </div>

            <label class="tool-label">公理 (Axiom)：</label>
            <input
              class="code-input-sm"
              v-model="axiom"
              spellcheck="false"
              placeholder="如 F / FX / F--F--F"
            />

            <label class="tool-label">生成规则（每行一条，如 F=F+F--F+F）：</label>
            <div class="input-with-copy rules-wrap">
              <textarea
                class="code-input rules-input"
                v-model="rulesText"
                rows="5"
                spellcheck="false"
                placeholder="F=F[+F]F[-F]F&#10;X=X+YF+"
              ></textarea>
              <button class="copy-btn" @click="copyRules" title="复制规则">📋</button>
            </div>

            <label class="tool-label">迭代次数：{{ iterations }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="iterations" min="0" max="12" step="1" class="range-input" />
              <span class="range-value">{{ iterations }}</span>
            </div>

            <div class="param-row">
              <div class="param-cell">
                <label class="tool-label">转角 (°)：</label>
                <input class="code-input-sm" v-model.number="angle" type="number" step="0.5" placeholder="60" />
              </div>
              <div class="param-cell">
                <label class="tool-label">初始方向 (°)：</label>
                <input class="code-input-sm" v-model.number="initialAngle" type="number" step="15" placeholder="-90" />
              </div>
            </div>

            <label class="tool-label">线宽：{{ strokeWidth }}</label>
            <div class="slider-wrapper">
              <input type="range" v-model.number="strokeWidth" min="0.5" max="4" step="0.5" class="range-input" />
              <span class="range-value">{{ strokeWidth }}</span>
            </div>

            <label class="tool-label">线条颜色：</label>
            <div class="radio-group">
              <label v-for="c in colorOptions" :key="c.key" class="radio-label">
                <input type="radio" v-model="colorKey" :value="c.key" />
                <span>{{ c.label }}</span>
              </label>
            </div>
          </div>

          <!-- 右栏：SVG 预览 -->
          <div class="tool-col">
            <label class="tool-label">SVG 预览：</label>
            <div class="ls-preview">
              <svg
                v-if="pathD"
                class="ls-svg"
                :viewBox="viewBoxStr"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path :d="pathD" fill="none" :class="'ls-path ' + colorKey"
                  :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div v-else class="ls-empty">等待生成…</div>
              <button class="copy-btn ls-copy" @click="copySvg" title="复制 SVG 代码">📋</button>
            </div>
            <div v-if="stats" class="render-info">
              {{ stats.segments }} 条线段 · 字符串 {{ stats.length }} 字符 · 迭代 {{ stats.iterations }} 次
            </div>

            <label class="tool-label">扩展字符串（前 {{ previewLimit }} 字符）：</label>
            <div class="input-with-copy">
              <textarea class="code-input output expanded-out" :value="expandedPreview" readonly rows="4"></textarea>
              <button class="copy-btn" @click="copyExpanded" title="复制完整字符串">📋</button>
            </div>
          </div>
        </div>

        <!-- 全宽按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="render()">重新生成</button>
          <button class="tool-button" @click="copySvg">复制 SVG</button>
          <button class="tool-button" @click="exportSvg">导出 SVG</button>
          <button class="tool-button danger" @click="resetPreset">重置</button>
        </div>

        <div class="hint-line">提示：迭代次数过高会导致生成变慢，字符串超过 20 万字符或线段超过 8 万条时将自动停止并提示。</div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

/* ---------- 预设 ---------- */

const presets = [
  {
    key: 'koch-snow',
    label: 'Koch 雪花',
    axiom: 'F--F--F',
    rules: ['F=F+F--F+F'],
    angle: 60,
    initialAngle: 0,
    iterations: 5
  },
  {
    key: 'dragon',
    label: '龙曲线',
    axiom: 'FX',
    rules: ['X=X+YF+', 'Y=-FX-Y'],
    angle: 90,
    initialAngle: 0,
    iterations: 12
  },
  {
    key: 'sierpinski',
    label: '谢尔宾斯基三角',
    axiom: 'F-G-G',
    rules: ['F=F-G+F+G-F', 'G=GG'],
    angle: 120,
    initialAngle: 0,
    iterations: 6
  },
  {
    key: 'tree',
    label: '分形树',
    axiom: 'F',
    rules: ['F=FF-[-F+F+F]+[+F-F-F]'],
    angle: 22.5,
    initialAngle: -90,
    iterations: 5
  },
  {
    key: 'plant',
    label: '蕨类植物',
    axiom: 'X',
    rules: ['X=F[+X]F[-X]+X', 'F=FF'],
    angle: 25,
    initialAngle: -90,
    iterations: 6
  },
  {
    key: 'hilbert',
    label: '希尔伯特曲线',
    axiom: 'A',
    rules: ['A=-BF+AFA+FB-', 'B=+AF-BFB-FA+'],
    angle: 90,
    initialAngle: 0,
    iterations: 5
  },
  {
    key: 'koch-curve',
    label: 'Koch 曲线',
    axiom: 'F',
    rules: ['F=F+F-F-F+F'],
    angle: 90,
    initialAngle: 0,
    iterations: 6
  },
  {
    key: 'custom',
    label: '自定义',
    axiom: 'F',
    rules: ['F=F[+F]F[-F]F'],
    angle: 25,
    initialAngle: -90,
    iterations: 4
  }
]

const colorOptions = [
  { key: 'green', label: '主题绿' },
  { key: 'text', label: '亮白' },
  { key: 'muted', label: '暗灰' }
]

const MAX_CHARS = 200000
const MAX_SEGMENTS = 80000
const previewLimit = 1000

/* ---------- 状态 ---------- */

const presetKey = ref('koch-snow')
const axiom = ref('F--F--F')
const rulesText = ref('F=F+F--F+F')
const iterations = ref(5)
const angle = ref(60)
const initialAngle = ref(0)
const strokeWidth = ref(1)
const colorKey = ref('green')

const pathD = ref('')
const viewBoxStr = ref('')
const stats = ref(null)
const expandedPreview = ref('')
const expandedFull = ref('')

const error = ref('')
const success = ref('')
let renderTimer = null
let successTimer = null

/* ---------- 核心算法 ---------- */

function parseRules(text) {
  const rules = {}
  for (const line of String(text || '').split('\n')) {
    const m = line.trim().match(/^([^\s=])\s*=\s*(.+)$/)
    if (m) rules[m[1]] = m[2]
  }
  return rules
}

function generateString(axiomStr, rules, n) {
  let s = axiomStr
  for (let i = 0; i < n; i++) {
    if (s.length > MAX_CHARS) {
      throw new Error(`字符串超过 ${MAX_CHARS} 字符，请降低迭代次数（当前第 ${i} 次迭代）`)
    }
    let next = ''
    for (const ch of s) next += rules[ch] || ch
    s = next
  }
  if (s.length > MAX_CHARS) {
    throw new Error(`字符串超过 ${MAX_CHARS} 字符，请降低迭代次数`)
  }
  return s
}

/* 解释字符串：F/G 前进，+/- 转向，[ 入栈，] 出栈 */
function interpret(s, angleDeg, initDeg) {
  const segs = []
  const rad = (angleDeg * Math.PI) / 180
  let cx = 0
  let cy = 0
  let dir = (initDeg * Math.PI) / 180
  const stack = []
  for (const ch of s) {
    if (ch === 'F' || ch === 'G') {
      const nx = cx + Math.cos(dir)
      const ny = cy + Math.sin(dir)
      segs.push([cx, cy, nx, ny])
      cx = nx
      cy = ny
      if (segs.length > MAX_SEGMENTS) {
        throw new Error(`线段超过 ${MAX_SEGMENTS} 条，请降低迭代次数`)
      }
    } else if (ch === '+') {
      dir += rad
    } else if (ch === '-') {
      dir -= rad
    } else if (ch === '[') {
      stack.push([cx, cy, dir])
    } else if (ch === ']') {
      const st = stack.pop()
      if (st) {
        cx = st[0]
        cy = st[1]
        dir = st[2]
      }
    }
  }
  return segs
}

function buildPathD(segs) {
  let d = ''
  let px = null
  let py = null
  for (const [x1, y1, x2, y2] of segs) {
    const sx1 = x1.toFixed(3)
    const sy1 = y1.toFixed(3)
    const sx2 = x2.toFixed(3)
    const sy2 = y2.toFixed(3)
    if (x1 === px && y1 === py) {
      d += `L${sx2} ${sy2}`
    } else {
      d += `M${sx1} ${sy1}L${sx2} ${sy2}`
    }
    px = x2
    py = y2
  }
  return d
}

function computeViewBox(segs) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x1, y1, x2, y2] of segs) {
    if (x1 < minX) minX = x1
    if (x2 < minX) minX = x2
    if (y1 < minY) minY = y1
    if (y2 < minY) minY = y2
    if (x1 > maxX) maxX = x1
    if (x2 > maxX) maxX = x2
    if (y1 > maxY) maxY = y1
    if (y2 > maxY) maxY = y2
  }
  const w = maxX - minX
  const h = maxY - minY
  const pad = Math.max(w, h) * 0.06 + 0.5
  return [minX - pad, minY - pad, maxX + pad, maxY + pad]
}

/* ---------- 渲染 ---------- */

function render() {
  clearTimeout(successTimer)
  success.value = ''
  try {
    const ax = String(axiom.value || '').trim()
    if (!ax) throw new Error('公理不能为空，请填写 F / FX 等起始字符串')

    const rules = parseRules(rulesText.value)
    if (Object.keys(rules).length === 0) {
      throw new Error('规则格式不正确，每行应为「字符=替换串」，如 F=F+F--F+F')
    }

    const n = Math.max(0, Math.min(12, Math.floor(Number(iterations.value) || 0)))
    const ang = Number(angle.value) || 0
    const init = Number(initialAngle.value) || 0

    const s = generateString(ax, rules, n)
    const segs = interpret(s, ang, init)
    if (segs.length === 0) {
      throw new Error('未生成任何线段，请检查公理和规则（需要包含 F 或 G 前进字符）')
    }

    const d = buildPathD(segs)
    const vb = computeViewBox(segs)

    pathD.value = d
    viewBoxStr.value = vb.map((v) => v.toFixed(3)).join(' ')
    expandedFull.value = s
    expandedPreview.value = s.length > previewLimit ? s.slice(0, previewLimit) + ` …（共 ${s.length} 字符）` : s
    stats.value = { segments: segs.length, length: s.length, iterations: n }
    error.value = ''
  } catch (e) {
    pathD.value = ''
    viewBoxStr.value = ''
    stats.value = null
    expandedFull.value = ''
    expandedPreview.value = ''
    error.value = e && e.message ? e.message : '生成失败，请检查参数'
  }
}

function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 40)
}

/* ---------- 预设 / 重置 ---------- */

function applyPreset(key) {
  const p = presets.find((x) => x.key === key)
  if (!p) return
  presetKey.value = p.key
  axiom.value = p.axiom
  rulesText.value = p.rules.join('\n')
  angle.value = p.angle
  initialAngle.value = p.initialAngle
  iterations.value = p.iterations
  error.value = ''
}

function resetPreset() {
  applyPreset('koch-snow')
  strokeWidth.value = 1
  colorKey.value = 'green'
  render()
}

/* ---------- 复制 / 导出 ---------- */

function resolveColor(key) {
  const map = { green: '--green', text: '--text', muted: '--muted' }
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(map[key] || '--green')
    .trim()
  return v || '#9dff6b'
}

function buildSvgCode() {
  if (!pathD.value) return ''
  const vb = viewBoxStr.value.split(' ').map(Number)
  const w = (vb[2] - vb[0]).toFixed(2)
  const h = (vb[3] - vb[1]).toFixed(2)
  const color = resolveColor(colorKey.value)
  const sw = Number(strokeWidth.value) || 1
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr.value}" width="${w}" height="${h}">\n` +
    `  <path d="${pathD.value}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>\n` +
    `</svg>`
  )
}

function copyText(text) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => flashSuccess('已复制到剪贴板'))
    .catch(() => {
      error.value = '复制失败，请手动选择复制'
      setTimeout(() => (error.value = ''), 2500)
    })
}

function copySvg() {
  const code = buildSvgCode()
  if (!code) {
    error.value = '暂无 SVG 可复制，请先生成图案'
    setTimeout(() => (error.value = ''), 2500)
    return
  }
  copyText(code)
}

function copyExpanded() {
  if (!expandedFull.value) {
    error.value = '暂无字符串可复制，请先生成图案'
    setTimeout(() => (error.value = ''), 2500)
    return
  }
  copyText(expandedFull.value)
}

function copyRules() {
  copyText(rulesText.value)
}

function exportSvg() {
  const code = buildSvgCode()
  if (!code) {
    error.value = '暂无 SVG 可导出，请先生成图案'
    setTimeout(() => (error.value = ''), 2500)
    return
  }
  const blob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `lsystem_${presetKey.value}_n${iterations.value}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
  flashSuccess('SVG 已导出')
}

function flashSuccess(msg) {
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => (success.value = ''), 2000)
}

/* ---------- 生命周期 ---------- */

watch([presetKey, axiom, rulesText, iterations, angle, initialAngle, strokeWidth, colorKey], () => {
  scheduleRender()
})

watch(presetKey, (key) => applyPreset(key))

onMounted(() => render())

onBeforeUnmount(() => {
  clearTimeout(renderTimer)
  clearTimeout(successTimer)
})
</script>

<style scoped>
/* 预设单选网格 */
.preset-group {
  gap: 6px 14px;
  margin-bottom: 2px;
}

.preset-item {
  font-size: 13px;
}

/* 规则输入区 */
.rules-wrap {
  align-items: stretch;
}

.rules-input {
  height: 110px;
  resize: vertical;
}

/* 双参数行 */
.param-row {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.param-cell {
  flex: 1;
  min-width: 0;
}

.param-cell .code-input-sm {
  width: 100%;
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

/* SVG 预览区 */
.ls-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
}

.ls-svg {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  display: block;
}

.ls-path.green {
  stroke: var(--green);
}

.ls-path.text {
  stroke: var(--text);
}

.ls-path.muted {
  stroke: var(--muted);
}

.ls-empty {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  padding: 60px 0;
}

.ls-copy {
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
  margin: 6px 0 12px;
}

.expanded-out {
  height: 84px;
  resize: vertical;
}

.hint-line {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .range-value {
    font-size: 12px;
    min-width: 30px;
  }

  .param-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
