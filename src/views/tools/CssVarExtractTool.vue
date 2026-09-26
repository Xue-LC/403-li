<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎨 CSS Variable 提取器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- 双栏：输入 / 提取结果 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              CSS / SCSS 源码：
              <button
                class="copy-btn label-copy-btn"
                title="复制输入源码"
                :disabled="!input.trim()"
                @click="copyInput"
              >📋</button>
            </label>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              placeholder="粘贴 CSS / SCSS 代码，自动提取所有 -- 自定义属性&#10;&#10;示例：&#10;:root {&#10;  --color-primary: #9dff6b;&#10;  --spacing-md: 16px;&#10;  --font-mono: 'Maple Mono', monospace;&#10;}&#10;&#10;.card {&#10;  --radius: 0px;&#10;  color: var(--color-primary);&#10;  padding: var(--spacing-md);&#10;}"
            ></textarea>
            <div class="field-hint">💡 输入后自动实时提取，支持 CSS / SCSS 嵌套结构</div>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              提取结果：{{ displayVars.length }} 个
              <button
                class="copy-btn label-copy-btn"
                title="复制全部变量（当前筛选结果）"
                :disabled="displayVars.length === 0"
                @click="copyAll"
              >📋</button>
            </label>
            <div v-if="!input.trim()" class="code-input output output-empty">
              提取结果将显示在这里...
            </div>
            <div v-else-if="vars.length === 0" class="code-input output output-empty">
              未找到 CSS 变量定义
              <span class="empty-sub">CSS 变量格式：--name: value;，需写在 { } 规则块内</span>
            </div>
            <div v-else-if="displayVars.length === 0" class="code-input output output-empty">
              没有匹配的变量
              <span class="empty-sub">试试调整搜索关键词或筛选条件</span>
            </div>
            <div v-else class="var-list">
              <div v-for="v in displayVars" :key="v.name" class="var-item">
                <div class="var-row">
                  <span class="var-name" :title="v.name">{{ v.name }}</span>
                  <span
                    class="var-usage"
                    :class="{ 'var-usage--zero': v.usage === 0 }"
                    :title="v.usage === 0 ? '未被 var() 引用' : 'var() 引用次数'"
                  >{{ v.usage }}</span>
                  <button class="copy-btn var-copy" title="复制该变量" @click="copyVar(v)">📋</button>
                </div>
                <div class="var-value" :title="v.value">{{ v.value || '（空值）' }}</div>
                <div class="var-selector" :title="v.selectors.join('\n')">
                  <span class="sel-icon">@</span>
                  {{ v.selectors[0] }}<template v-if="v.selectors.length > 1"> +{{ v.selectors.length - 1 }}</template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索 / 筛选 / 排序（双栏外，全宽） -->
        <div class="filter-bar">
          <div class="filter-row">
            <input
              v-model="search"
              class="code-input-sm filter-search"
              placeholder="🔍 按变量名搜索..."
            />
            <div class="filter-sort">
              <span class="filter-label">排序</span>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="name" />
                <span>名称</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="sortMode" value="usage" />
                <span>引用次数</span>
              </label>
            </div>
          </div>
          <div class="filter-row">
            <span class="filter-label">筛选</span>
            <label class="radio-label">
              <input type="radio" v-model="filter" value="all" />
              <span>全部</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="filter" value="used" />
              <span>已使用</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="filter" value="unused" />
              <span>未使用</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="filter" value="root" />
              <span>定义在 :root</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="filter" value="rule" />
              <span>定义在规则内</span>
            </label>
          </div>
        </div>

        <!-- 统计 -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">变量总数</span>
              <span class="stat-value">{{ vars.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">引用总次数</span>
              <span class="stat-value">{{ totalUsage }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">未使用变量</span>
              <span class="stat-value" :class="{ 'stat-value--warn': unusedCount > 0 }">{{ unusedCount }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" :disabled="displayVars.length === 0" @click="exportRoot">
            📤 导出 :root 块
          </button>
          <button class="tool-button" :disabled="displayVars.length === 0" @click="exportJson">
            📤 导出 JSON
          </button>
          <button class="tool-button" @click="loadSample">
            🧪 载入示例
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const search = ref('')
const filter = ref('all')
const sortMode = ref('name')
const vars = ref([])
const error = ref('')
const success = ref('')
let successTimer = null

/**
 * 在块内容中扫描 --name: value; 声明（跳过嵌套子块区域与字符串字面量）
 */
function scanBlockDecls(content, selector) {
  const decls = []
  let i = 0
  let str = ''
  const n = content.length
  while (i < n) {
    const c = content[i]
    // 跳过字符串字面量内的内容（如 content: "--a: 1" 不应被提取）
    if (str) {
      if (c === str) str = ''
      i++
      continue
    }
    if (c === '"' || c === "'") {
      str = c
      i++
      continue
    }
    if (
      c === '-' && content[i + 1] === '-' &&
      !/[a-zA-Z0-9_-]/.test(content[i - 1] || '')
    ) {
      let j = i + 2
      while (j < n && /[a-zA-Z0-9_-]/.test(content[j])) j++
      if (j < n && content[j] === ':') {
        const name = content.slice(i, j)
        // 读取值：遇到 ; } { 结束，括号深度与引号内不结束
        let k = j + 1
        let value = ''
        let depth = 0
        let quote = ''
        while (k < n) {
          const vc = content[k]
          if (quote) {
            value += vc
            if (vc === quote) quote = ''
          } else if (vc === '"' || vc === "'") {
            quote = vc
            value += vc
          } else if (vc === '(') {
            depth++
            value += vc
          } else if (vc === ')') {
            depth = Math.max(0, depth - 1)
            value += vc
          } else if ((vc === ';' || vc === '}' || vc === '{') && depth === 0) {
            break
          } else {
            value += vc
          }
          k++
        }
        decls.push({ name, value: value.trim(), selector })
        i = k
        continue
      }
    }
    i++
  }
  return decls
}

/**
 * 清理选择器文本：去掉 SCSS 行注释残留、顶层 $var 赋值
 * 与嵌套规则前声明的 -- 变量（SCSS 中声明可先于子规则出现）
 */
function cleanSelector(s) {
  return s
    .replace(/\$[a-zA-Z_-][a-zA-Z0-9_-]*\s*:[^;{}]*;?/g, ' ')
    .replace(/--[a-zA-Z0-9_-]+\s*:[^;{}]*;?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 解析 CSS / SCSS 文本，返回变量列表：
 * [{ name, value, selectors: [], usage }]
 */
function parseCssVars(text) {
  // 去掉块注释与 SCSS 行注释，避免注释里的 --x: y 被误提取
  // （行注释仅在行首/空白/;{} 后触发，避免误伤 url(https://...) 等）
  const clean = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[\s;{}])\/\/[^\n]*/g, '$1')

  // 括号匹配收集规则块（支持 SCSS 嵌套）
  const blocks = []
  const stack = []
  let segStart = 0
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (ch === '{') {
      stack.push({ selector: cleanSelector(clean.slice(segStart, i)), openIndex: i + 1 })
      segStart = i + 1
    } else if (ch === '}') {
      const b = stack.pop()
      if (b) {
        blocks.push({
          selector: b.selector,
          openIndex: b.openIndex,
          closeIndex: i,
          path: stack.map(s => s.selector).concat(b.selector)
        })
      }
      segStart = i + 1
    }
  }

  // 计算每个块的子块（用于屏蔽嵌套区域，避免重复提取）
  for (const block of blocks) {
    block.children = blocks.filter(b =>
      b !== block && b.openIndex >= block.openIndex && b.closeIndex <= block.closeIndex
    )
  }

  const decls = []
  for (const block of blocks) {
    const arr = clean.slice(block.openIndex, block.closeIndex).split('')
    for (const child of block.children) {
      const s = child.openIndex - block.openIndex
      const e = child.closeIndex - block.openIndex
      for (let k = s; k <= e; k++) {
        if (arr[k] !== undefined) arr[k] = ' '
      }
    }
    decls.push(...scanBlockDecls(arr.join(''), block.path.join(' ')))
  }

  // 统计 var(--name) 引用次数
  const usageMap = {}
  const useRe = /var\(\s*(--[a-zA-Z0-9_-]+)/g
  let m
  while ((m = useRe.exec(clean)) !== null) {
    usageMap[m[1]] = (usageMap[m[1]] || 0) + 1
  }

  // 按变量名聚合
  const byName = new Map()
  for (const d of decls) {
    let entry = byName.get(d.name)
    if (!entry) {
      entry = { name: d.name, value: d.value, selectors: [], usage: usageMap[d.name] || 0 }
      byName.set(d.name, entry)
    }
    if (!entry.selectors.includes(d.selector)) entry.selectors.push(d.selector)
  }
  return Array.from(byName.values())
}

// 实时提取
watch(input, val => {
  vars.value = val.trim() ? parseCssVars(val) : []
})

// 当前展示的变量（搜索 + 筛选 + 排序）
const displayVars = computed(() => {
  let list = vars.value
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(v => v.name.toLowerCase().includes(q))
  switch (filter.value) {
    case 'used':
      list = list.filter(v => v.usage > 0)
      break
    case 'unused':
      list = list.filter(v => v.usage === 0)
      break
    case 'root':
      list = list.filter(v => v.selectors.some(s => s.includes(':root')))
      break
    case 'rule':
      list = list.filter(v => !v.selectors.some(s => s.includes(':root')))
      break
  }
  list = [...list]
  if (sortMode.value === 'usage') {
    list.sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name))
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return list
})

const totalUsage = computed(() => vars.value.reduce((s, v) => s + v.usage, 0))
const unusedCount = computed(() => vars.value.filter(v => v.usage === 0).length)

// ---- 复制 / 导出 ----
function flash(msg) {
  error.value = ''
  success.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { success.value = '' }, 3000)
}

function failCopy() {
  success.value = ''
  error.value = '复制失败，请手动选择文本复制'
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { error.value = '' }, 3000)
}

async function copyInput() {
  if (!input.value.trim()) return
  const ok = await copyText(input.value)
  ok ? flash('已复制输入源码') : failCopy()
}

async function copyAll() {
  const lines = displayVars.value.map(v => `${v.name}: ${v.value};`)
  const ok = await copyText(lines.join('\n'))
  ok ? flash(`已复制 ${lines.length} 个变量`) : failCopy()
}

async function copyVar(v) {
  const ok = await copyText(`${v.name}: ${v.value};`)
  ok ? flash(`已复制 ${v.name}`) : failCopy()
}

async function doExport(text, msg) {
  const ok = await copyText(text)
  ok ? flash(msg) : failCopy()
}

function exportRoot() {
  if (!displayVars.value.length) return
  const lines = displayVars.value.map(v => `  ${v.name}: ${v.value};`)
  const out = `:root {\n${lines.join('\n')}\n}`
  const scope = isFiltered() ? '（当前筛选结果）' : ''
  doExport(out, `已导出 ${displayVars.value.length} 个变量为 :root 块${scope}，已复制到剪贴板`)
}

function exportJson() {
  if (!displayVars.value.length) return
  const obj = {}
  for (const v of displayVars.value) obj[v.name] = v.value
  const scope = isFiltered() ? '（当前筛选结果）' : ''
  doExport(JSON.stringify(obj, null, 2), `已导出 ${displayVars.value.length} 个变量为 JSON${scope}，已复制到剪贴板`)
}

function isFiltered() {
  return search.value.trim() !== '' || filter.value !== 'all'
}

// ---- 示例 / 清空 ----
const SAMPLE = `:root {
  --color-primary: #9dff6b;
  --color-bg: #0d1117;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --font-mono: 'Maple Mono NF CN', monospace;
  --radius: 0px;
}

.theme-dark {
  --color-bg: #0f1317;
  --color-primary: #9dff6b;
}

.card {
  --card-padding: var(--spacing-md);
  background: var(--color-bg);
  color: var(--color-primary);
  padding: var(--card-padding);
  border-radius: var(--radius);
}

.card--compact {
  --card-padding: var(--spacing-sm);
  padding: var(--card-padding);
}

.legacy-box {
  background: #ffffff;
  border: 1px solid #cccccc;
}`

function loadSample() {
  input.value = SAMPLE
  flash('已载入示例，可直接修改')
}

function clear() {
  input.value = ''
  search.value = ''
  filter.value = 'all'
  sortMode.value = 'name'
  vars.value = []
  error.value = ''
  success.value = ''
  clearTimeout(successTimer)
}
</script>

<style scoped>
/* 标签内联复制按钮 */
.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  vertical-align: middle;
  font-size: 14px;
}
.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.field-hint {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

/* 空状态 */
.output-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
  cursor: default;
}
.empty-sub {
  font-size: 12px;
  color: var(--dim);
}

/* 变量结果列表 */
.var-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}
.var-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
}
.var-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.var-name {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}
.var-usage {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 1px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.var-usage--zero {
  color: var(--red);
  border-color: var(--red);
}
.var-copy {
  position: static;
  flex-shrink: 0;
  font-size: 13px;
  padding: 2px 4px;
}
.var-value {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  margin-top: 6px;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.6;
}
.var-selector {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 6px;
  word-break: break-all;
  line-height: 1.6;
}
.sel-icon {
  color: var(--green);
  margin-right: 2px;
}

/* 筛选栏 */
.filter-bar {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-search {
  flex: 1;
  min-width: 200px;
}
.filter-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  margin-right: 4px;
}
.filter-sort {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 统计网格 */
.stats-section {
  margin-top: 12px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-item {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-family: var(--mono);
  font-size: 16px;
  color: var(--accent);
  font-weight: bold;
}
.stat-value--warn {
  color: var(--warning);
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .filter-search {
    min-width: 100%;
  }
  .var-list {
    max-height: 360px;
  }
}
</style>
