<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 CSS 命名颜色浏览器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 搜索 + 排序 + 分组筛选（全宽） -->
        <div class="cnc-filter">
          <div class="cnc-search-row">
            <div class="cnc-search-wrap">
              <input
                v-model="query"
                class="code-input-sm cnc-search"
                placeholder="🔍 搜索颜色名 / HEX / RGB，如 tomato、#ff6347、255,99,71"
              />
              <button
                class="copy-btn cnc-search-copy"
                title="复制当前筛选结果清单"
                :disabled="!filtered.length"
                @click="copyList"
              >📋</button>
            </div>
            <select v-model="sortBy" class="cnc-select" title="排序方式">
              <option value="name">按名称排序</option>
              <option value="hue">按色相排序</option>
              <option value="light">按明度排序</option>
            </select>
            <span class="cnc-count">{{ filtered.length }} / {{ namedColors.length }}</span>
          </div>
          <div class="cnc-chips">
            <button
              v-for="g in groups"
              :key="g.key"
              type="button"
              class="cnc-chip"
              :class="{ active: group === g.key }"
              @click="group = g.key"
            >
              {{ g.label }}<span class="cnc-chip-num">{{ groupCount(g.key) }}</span>
            </button>
          </div>
        </div>

        <!-- 双栏：颜色网格 / 颜色详情 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              颜色列表：{{ filtered.length }} 个
            </label>
            <div v-if="!filtered.length" class="code-input output cnc-empty">
              没有匹配的颜色
              <span class="cnc-empty-sub">换个关键词试试，或把分组切回「全部」</span>
            </div>
            <div v-else class="cnc-grid">
              <button
                v-for="c in filtered"
                :key="c.name"
                type="button"
                class="cnc-swatch"
                :class="{ active: selected && selected.name === c.name }"
                :title="`${c.name} · ${c.hex}`"
                @click="select(c)"
              >
                <span class="cnc-swatch-color" :style="{ backgroundColor: c.hex }"></span>
                <span class="cnc-swatch-name">{{ c.name }}</span>
                <span class="cnc-swatch-hex">{{ c.hex }}</span>
              </button>
            </div>
          </div>

          <div class="tool-col">
            <label class="tool-label">
              颜色详情
              <button
                class="copy-btn cnc-label-copy"
                title="复制全部格式"
                :disabled="!selected"
                @click="copyAll"
              >📋</button>
            </label>
            <div v-if="!selected" class="code-input output cnc-empty">
              点击左侧色块查看详情
              <span class="cnc-empty-sub">含 HEX / RGB / HSL / CMYK、对比度与相近色</span>
            </div>
            <div v-else class="cnc-detail">
              <div class="cnc-preview" :style="{ backgroundColor: selected.hex }">
                <span class="cnc-preview-name" :style="{ color: previewTextColor }">
                  {{ selected.name }}
                </span>
              </div>

              <div class="cnc-values">
                <div class="cnc-value-row" v-for="v in valueRows" :key="v.label">
                  <span class="cnc-value-label">{{ v.label }}</span>
                  <span class="cnc-value-text">{{ v.value }}</span>
                  <button
                    class="copy-btn cnc-value-copy"
                    :title="`复制 ${v.label}`"
                    @click="copy(v.value, v.label + ' 已复制')"
                  >📋</button>
                </div>
              </div>

              <div class="cnc-contrast">
                <div class="cnc-contrast-row">
                  <span class="cnc-contrast-label">对白色对比度</span>
                  <span class="cnc-contrast-val">{{ contrastWhite.toFixed(2) }} : 1</span>
                  <span class="cnc-badge" :class="badgeClass(contrastWhite)">{{ badgeText(contrastWhite) }}</span>
                </div>
                <div class="cnc-contrast-row">
                  <span class="cnc-contrast-label">对黑色对比度</span>
                  <span class="cnc-contrast-val">{{ contrastBlack.toFixed(2) }} : 1</span>
                  <span class="cnc-badge" :class="badgeClass(contrastBlack)">{{ badgeText(contrastBlack) }}</span>
                </div>
              </div>

              <div class="cnc-similar">
                <div class="cnc-sub-title">相近颜色</div>
                <div class="cnc-similar-row">
                  <button
                    v-for="s in similar"
                    :key="s.name"
                    type="button"
                    class="cnc-similar-swatch"
                    :class="{ active: selected && selected.name === s.name }"
                    :style="{ backgroundColor: s.hex }"
                    :title="`${s.name} · ${s.hex}`"
                    @click="select(s)"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!selected" @click="copySelectedHex">
            📋 复制 HEX
          </button>
          <button class="tool-button" :disabled="!selected" @click="copyAll">
            📋 复制全部格式
          </button>
          <button class="tool-button danger" @click="reset">🗑️ 重置</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { copyText } from '../../utils/clipboard'

defineOptions({ name: 'CssNamedColorsTool' })

/* ============================================================
 * 148 个 CSS 命名颜色（CSS Color Module Level 4）
 * ============================================================ */
const RAW_COLORS = [
  ['aliceblue', '#F0F8FF'], ['antiquewhite', '#FAEBD7'], ['aqua', '#00FFFF'],
  ['aquamarine', '#7FFFD4'], ['azure', '#F0FFFF'], ['beige', '#F5F5DC'],
  ['bisque', '#FFE4C4'], ['black', '#000000'], ['blanchedalmond', '#FFEBCD'],
  ['blue', '#0000FF'], ['blueviolet', '#8A2BE2'], ['brown', '#A52A2A'],
  ['burlywood', '#DEB887'], ['cadetblue', '#5F9EA0'], ['chartreuse', '#7FFF00'],
  ['chocolate', '#D2691E'], ['coral', '#FF7F50'], ['cornflowerblue', '#6495ED'],
  ['cornsilk', '#FFF8DC'], ['crimson', '#DC143C'], ['cyan', '#00FFFF'],
  ['darkblue', '#00008B'], ['darkcyan', '#008B8B'], ['darkgoldenrod', '#B8860B'],
  ['darkgray', '#A9A9A9'], ['darkgreen', '#006400'], ['darkgrey', '#A9A9A9'],
  ['darkkhaki', '#BDB76B'], ['darkmagenta', '#8B008B'], ['darkolivegreen', '#556B2F'],
  ['darkorange', '#FF8C00'], ['darkorchid', '#9932CC'], ['darkred', '#8B0000'],
  ['darksalmon', '#E9967A'], ['darkseagreen', '#8FBC8F'], ['darkslateblue', '#483D8B'],
  ['darkslategray', '#2F4F4F'], ['darkslategrey', '#2F4F4F'], ['darkturquoise', '#00CED1'],
  ['darkviolet', '#9400D3'], ['deeppink', '#FF1493'], ['deepskyblue', '#00BFFF'],
  ['dimgray', '#696969'], ['dimgrey', '#696969'], ['dodgerblue', '#1E90FF'],
  ['firebrick', '#B22222'], ['floralwhite', '#FFFAF0'], ['forestgreen', '#228B22'],
  ['fuchsia', '#FF00FF'], ['gainsboro', '#DCDCDC'], ['ghostwhite', '#F8F8FF'],
  ['gold', '#FFD700'], ['goldenrod', '#DAA520'], ['gray', '#808080'],
  ['green', '#008000'], ['greenyellow', '#ADFF2F'], ['grey', '#808080'],
  ['honeydew', '#F0FFF0'], ['hotpink', '#FF69B4'], ['indianred', '#CD5C5C'],
  ['indigo', '#4B0082'], ['ivory', '#FFFFF0'], ['khaki', '#F0E68C'],
  ['lavender', '#E6E6FA'], ['lavenderblush', '#FFF0F5'], ['lawngreen', '#7CFC00'],
  ['lemonchiffon', '#FFFACD'], ['lightblue', '#ADD8E6'], ['lightcoral', '#F08080'],
  ['lightcyan', '#E0FFFF'], ['lightgoldenrodyellow', '#FAFAD2'], ['lightgray', '#D3D3D3'],
  ['lightgreen', '#90EE90'], ['lightgrey', '#D3D3D3'], ['lightpink', '#FFB6C1'],
  ['lightsalmon', '#FFA07A'], ['lightseagreen', '#20B2AA'], ['lightskyblue', '#87CEFA'],
  ['lightslategray', '#778899'], ['lightslategrey', '#778899'], ['lightsteelblue', '#B0C4DE'],
  ['lightyellow', '#FFFFE0'], ['lime', '#00FF00'], ['limegreen', '#32CD32'],
  ['linen', '#FAF0E6'], ['magenta', '#FF00FF'], ['maroon', '#800000'],
  ['mediumaquamarine', '#66CDAA'], ['mediumblue', '#0000CD'], ['mediumorchid', '#BA55D3'],
  ['mediumpurple', '#9370DB'], ['mediumseagreen', '#3CB371'], ['mediumslateblue', '#7B68EE'],
  ['mediumspringgreen', '#00FA9A'], ['mediumturquoise', '#48D1CC'], ['mediumvioletred', '#C71585'],
  ['midnightblue', '#191970'], ['mintcream', '#F5FFFA'], ['mistyrose', '#FFE4E1'],
  ['moccasin', '#FFE4B5'], ['navajowhite', '#FFDEAD'], ['navy', '#000080'],
  ['oldlace', '#FDF5E6'], ['olive', '#808000'], ['olivedrab', '#6B8E23'],
  ['orange', '#FFA500'], ['orangered', '#FF4500'], ['orchid', '#DA70D6'],
  ['palegoldenrod', '#EEE8AA'], ['palegreen', '#98FB98'], ['paleturquoise', '#AFEEEE'],
  ['palevioletred', '#DB7093'], ['papayawhip', '#FFEFD5'], ['peachpuff', '#FFDAB9'],
  ['peru', '#CD853F'], ['pink', '#FFC0CB'], ['plum', '#DDA0DD'],
  ['powderblue', '#B0E0E6'], ['purple', '#800080'], ['rebeccapurple', '#663399'],
  ['red', '#FF0000'], ['rosybrown', '#BC8F8F'], ['royalblue', '#4169E1'],
  ['saddlebrown', '#8B4513'], ['salmon', '#FA8072'], ['sandybrown', '#F4A460'],
  ['seagreen', '#2E8B57'], ['seashell', '#FFF5EE'], ['sienna', '#A0522D'],
  ['silver', '#C0C0C0'], ['skyblue', '#87CEEB'], ['slateblue', '#6A5ACD'],
  ['slategray', '#708090'], ['slategrey', '#708090'], ['snow', '#FFFAFA'],
  ['springgreen', '#00FF7F'], ['steelblue', '#4682B4'], ['tan', '#D2B48C'],
  ['teal', '#008080'], ['thistle', '#D8BFD8'], ['tomato', '#FF6347'],
  ['turquoise', '#40E0D0'], ['violet', '#EE82EE'], ['wheat', '#F5DEB3'],
  ['white', '#FFFFFF'], ['whitesmoke', '#F5F5F5'], ['yellow', '#FFFF00'],
  ['yellowgreen', '#9ACD32']
]

/* ---------------- 颜色工具函数 ---------------- */
function hexToRgb (hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

function rgbToHsl ({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToCmyk ({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  }
}

function relativeLuminance ({ r, g, b }) {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrastRatio (a, b) {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

function groupOf (hsl) {
  const { h, s } = hsl
  if (s < 12) return 'neutral'
  if (h >= 345 || h < 15) return 'red'
  if (h < 45) return 'orange'
  if (h < 70) return 'yellow'
  if (h < 165) return 'green'
  if (h < 200) return 'cyan'
  if (h < 255) return 'blue'
  if (h < 290) return 'purple'
  return 'pink'
}

/* ---------------- 预计算颜色数据 ---------------- */
const namedColors = RAW_COLORS.map(([name, hex]) => {
  const rgb = hexToRgb(hex)
  const hsl = rgbToHsl(rgb)
  const cmyk = rgbToCmyk(rgb)
  return {
    name,
    hex,
    rgb,
    hsl,
    cmyk,
    group: groupOf(hsl),
    luminance: relativeLuminance(rgb)
  }
})

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

/* ---------------- 状态 ---------------- */
const query = ref('')
const sortBy = ref('hue')
const group = ref('all')
const selectedName = ref('tomato')
const error = ref('')
const success = ref('')
let timer = null

const groups = [
  { key: 'all', label: '全部' },
  { key: 'red', label: '红' },
  { key: 'orange', label: '橙' },
  { key: 'yellow', label: '黄' },
  { key: 'green', label: '绿' },
  { key: 'cyan', label: '青' },
  { key: 'blue', label: '蓝' },
  { key: 'purple', label: '紫' },
  { key: 'pink', label: '粉' },
  { key: 'neutral', label: '中性' }
]

/* ---------------- 计算属性 ---------------- */
const matched = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = namedColors
  if (group.value !== 'all') {
    list = list.filter((c) => c.group === group.value)
  }
  if (q) {
    list = list.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      if (c.hex.toLowerCase().includes(q)) return true
      const rgbStr = `${c.rgb.r},${c.rgb.g},${c.rgb.b}`
      const rgbSpaced = `${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}`
      if (rgbStr.includes(q) || rgbSpaced.includes(q)) return true
      if (`rgb(${rgbStr})`.includes(q)) return true
      return false
    })
  }
  return list
})

const filtered = computed(() => {
  const list = [...matched.value]
  if (sortBy.value === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'hue') {
    list.sort((a, b) => {
      if (a.group === 'neutral' && b.group !== 'neutral') return 1
      if (b.group === 'neutral' && a.group !== 'neutral') return -1
      if (a.hsl.h !== b.hsl.h) return a.hsl.h - b.hsl.h
      return a.luminance - b.luminance
    })
  } else {
    list.sort((a, b) => a.luminance - b.luminance)
  }
  return list
})

const selected = computed(() => namedColors.find((c) => c.name === selectedName.value) || null)

const selectedRgb = computed(() => (selected.value ? selected.value.rgb : WHITE))

const contrastWhite = computed(() => contrastRatio(selectedRgb.value, WHITE))
const contrastBlack = computed(() => contrastRatio(selectedRgb.value, BLACK))

const previewTextColor = computed(() =>
  contrastRatio(selectedRgb.value, WHITE) >= contrastRatio(selectedRgb.value, BLACK)
    ? '#ffffff'
    : '#000000'
)

const valueRows = computed(() => {
  if (!selected.value) return []
  const c = selected.value
  const { r, g, b } = c.rgb
  const { h, s, l } = c.hsl
  const { c: cc, m, y, k } = c.cmyk
  return [
    { label: 'HEX', value: c.hex },
    { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
    { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
    { label: 'CMYK', value: `cmyk(${cc}%, ${m}%, ${y}%, ${k}%)` }
  ]
})

const similar = computed(() => {
  if (!selected.value) return []
  const base = selected.value.rgb
  return namedColors
    .filter((c) => c.name !== selected.value.name)
    .map((c) => ({
      c,
      d:
        Math.pow(c.rgb.r - base.r, 2) +
        Math.pow(c.rgb.g - base.g, 2) +
        Math.pow(c.rgb.b - base.b, 2)
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
    .map((x) => x.c)
})

/* ---------------- 方法 ---------------- */
function groupCount (key) {
  if (key === 'all') return namedColors.length
  return namedColors.filter((c) => c.group === key).length
}

function badgeText (ratio) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA 大字'
  return '不达标'
}

function badgeClass (ratio) {
  if (ratio >= 4.5) return 'ok'
  if (ratio >= 3) return 'mid'
  return 'bad'
}

function flash (msg) {
  success.value = msg
  error.value = ''
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { success.value = '' }, 2000)
}

async function copy (text, msg) {
  const ok = await copyText(text)
  if (ok) flash(msg)
  else error.value = '复制失败，请手动选择文本复制'
}

function select (color) {
  selectedName.value = color.name
  error.value = ''
}

function copySelectedHex () {
  if (selected.value) copy(selected.value.hex, `${selected.value.name} 的 HEX 已复制`)
}

function copyAll () {
  if (!selected.value) return
  const c = selected.value
  const { r, g, b } = c.rgb
  const { h, s, l } = c.hsl
  const { c: cc, m, y, k } = c.cmyk
  const text = [
    `name: ${c.name}`,
    `hex:  ${c.hex}`,
    `rgb:  rgb(${r}, ${g}, ${b})`,
    `hsl:  hsl(${h}, ${s}%, ${l}%)`,
    `cmyk: cmyk(${cc}%, ${m}%, ${y}%, ${k}%)`
  ].join('\n')
  copy(text, `${c.name} 的全部格式已复制`)
}

function copyList () {
  if (!filtered.value.length) return
  const text = filtered.value.map((c) => `${c.hex}  ${c.name}`).join('\n')
  copy(text, `已复制 ${filtered.value.length} 个颜色清单`)
}

function reset () {
  query.value = ''
  group.value = 'all'
  sortBy.value = 'hue'
  selectedName.value = 'tomato'
  error.value = ''
  success.value = ''
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
/* ---------------- 筛选栏 ---------------- */
.cnc-search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.cnc-search-wrap {
  position: relative;
  flex: 1 1 260px;
  min-width: 200px;
}

.cnc-search {
  width: 100%;
  padding-right: 44px;
}

.cnc-search-copy {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.cnc-select {
  flex: 0 0 auto;
  height: 40px;
  padding: 0 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.cnc-select:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 2px var(--green-soft);
}

.cnc-select option {
  background: var(--panel);
  color: var(--text);
}

.cnc-count {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
}

.cnc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.cnc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  color: var(--muted);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.cnc-chip:hover {
  border-color: var(--green);
  color: var(--text);
}

.cnc-chip.active {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.cnc-chip-num {
  font-size: 11px;
  opacity: 0.7;
}

/* ---------------- 颜色网格 ---------------- */
.cnc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
  max-height: 560px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--green) var(--panel-2);
}

.cnc-grid::-webkit-scrollbar {
  width: 8px;
}

.cnc-grid::-webkit-scrollbar-track {
  background: var(--panel-2);
}

.cnc-grid::-webkit-scrollbar-thumb {
  background: var(--green);
}

.cnc-swatch {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s;
}

.cnc-swatch:hover {
  border-color: var(--green);
}

.cnc-swatch.active {
  border-color: var(--green);
  box-shadow: 0 0 0 1px var(--green);
}

.cnc-swatch-color {
  display: block;
  height: 34px;
  border: 1px solid var(--line);
}

.cnc-swatch-name {
  color: var(--text);
  font-size: 11px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cnc-swatch-hex {
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.5px;
}

/* ---------------- 空状态 ---------------- */
.cnc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  color: var(--muted);
}

.cnc-empty-sub {
  color: var(--muted);
  opacity: 0.7;
  font-size: 12px;
}

/* ---------------- 详情面板 ---------------- */
.cnc-label-copy {
  margin-left: 8px;
  vertical-align: middle;
}

.cnc-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cnc-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 110px;
  border: 1px solid var(--line);
}

.cnc-preview-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
}

.cnc-values {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
}

.cnc-value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
}

.cnc-value-row:last-child {
  border-bottom: none;
}

.cnc-value-label {
  flex: 0 0 46px;
  color: var(--green);
  font-size: 12px;
  letter-spacing: 0.5px;
}

.cnc-value-text {
  flex: 1 1 auto;
  color: var(--text);
  font-size: 13px;
  word-break: break-all;
}

.cnc-value-copy {
  flex: 0 0 auto;
}

/* ---------------- 对比度 ---------------- */
.cnc-contrast {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--line);
}

.cnc-contrast-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.cnc-contrast-label {
  flex: 1 1 auto;
  color: var(--muted);
}

.cnc-contrast-val {
  color: var(--text);
  letter-spacing: 0.5px;
}

.cnc-badge {
  flex: 0 0 auto;
  min-width: 54px;
  padding: 2px 6px;
  text-align: center;
  font-size: 10px;
  border: 1px solid var(--line);
}

.cnc-badge.ok {
  background: var(--green-soft);
  border-color: var(--green);
  color: var(--green);
}

.cnc-badge.mid {
  border-color: var(--green);
  color: var(--green);
}

.cnc-badge.bad {
  color: var(--muted);
}

/* ---------------- 相近色 ---------------- */
.cnc-sub-title {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.cnc-similar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cnc-similar-swatch {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.12s;
}

.cnc-similar-swatch:hover {
  border-color: var(--green);
  transform: translateY(-2px);
}

.cnc-similar-swatch.active {
  border-color: var(--green);
  box-shadow: 0 0 0 1px var(--green);
}

/* ---------------- 移动端 ---------------- */
@media (max-width: 640px) {
  .cnc-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    max-height: none;
  }

  .cnc-preview {
    height: 90px;
  }

  .cnc-preview-name {
    font-size: 16px;
  }

  .cnc-select {
    width: 100%;
    flex: 1 1 100%;
  }
}
</style>
