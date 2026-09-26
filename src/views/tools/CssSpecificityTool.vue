<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🎯 CSS 优先级计算器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入选择器（每行一个）：</label>
            <textarea
              v-model="input"
              rows="12"
              class="code-input"
              placeholder="输入 CSS 选择器，每行一个…&#10;&#10;示例：&#10;#main .content p&#10;div.container > ul li:first-child&#10;.box:hover&#10;* + p&#10;a[href^=&quot;https&quot;]&#10;nav ul li a.active"
              @input="onInput"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              优先级结果：
              <button
                class="copy-btn" title="复制结果" @click="copyResults"
                v-if="results.length > 0"
                style="position: static; display: inline; margin-left: 8px;"
              >📋</button>
            </label>
            <div class="specificity-output" v-if="results.length > 0">
              <div
                v-for="(item, idx) in sortedResults"
                :key="idx"
                class="specificity-row"
                :class="{ 'specificity-row--top': idx === 0 && sortedResults.length > 1 }"
              >
                <span class="specificity-rank">{{ idx + 1 }}</span>
                <span class="specificity-selector" :title="item.selector">{{ item.selector }}</span>
                <span class="specificity-score">
                  <span class="spec-a">ID:{{ item.a }}</span>
                  <span class="spec-b">CLS:{{ item.b }}</span>
                  <span class="spec-c">TAG:{{ item.c }}</span>
                </span>
                <span class="specificity-total">
                  ({{ item.a }}, {{ item.b }}, {{ item.c }})
                  <span v-if="item.important" class="spec-important">❗!important</span>
                </span>
              </div>
            </div>
            <textarea
              v-else
              readonly
              rows="12"
              class="code-input output"
              placeholder="计算结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 排序方式 -->
        <div class="radio-group" style="margin-bottom: 12px;" v-if="results.length > 0">
          <span style="font-family: 'MapleMono NF CN', monospace; font-size: 12px; color: var(--muted); margin-right: 8px;">排序：</span>
          <label class="radio-label">
            <input type="radio" v-model="sortMode" value="desc" />
            <span>优先级从高到低</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="sortMode" value="asc" />
            <span>优先级从低到高</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="sortMode" value="input" />
            <span>按输入顺序</span>
          </label>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button primary" @click="calculate" :disabled="!input.trim()">
            🔍 计算
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <!-- 说明 -->
        <details style="margin-top: 12px; font-family: 'MapleMono NF CN', monospace; font-size: 12px; color: var(--muted);">
          <summary style="cursor: pointer; color: var(--green);">📖 选择器优先级规则</summary>
          <div style="padding: 8px 12px; background: var(--panel-2); border: 1px solid var(--line); margin-top: 8px; line-height: 1.8;">
            <div><strong>a (ID)</strong> — #id 选择器的数量</div>
            <div><strong>b (类/属性/伪类)</strong> — .class, [attr], :hover, :nth-child() 等的数量</div>
            <div><strong>c (元素/伪元素)</strong> — div, p, ::before, ::after 等的数量</div>
            <div style="margin-top: 4px; color: var(--green);">
              ⚠ 通配符 *、组合器 (+, &gt;, ~, ' ')、:where() 不计入优先级
            </div>
            <div style="color: var(--green);">
              ⚠ :not()、:is()、:has() 取括号内最高优先级
            </div>
          </div>
        </details>

        <div v-if="error" class="status-error">
          ❌ {{ error }}
        </div>
        <div v-if="success" class="status-success">
          ✅ {{ success }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const results = ref([])
const error = ref('')
const success = ref('')
const sortMode = ref('desc')

// Compute sorted results
const sortedResults = computed(() => {
  const r = [...results.value]
  if (sortMode.value === 'desc') {
    r.sort((a, b) => {
      if (b.a !== a.a) return b.a - a.a
      if (b.b !== a.b) return b.b - a.b
      if (b.c !== a.c) return b.c - a.c
      return a.idx - b.idx
    })
  } else if (sortMode.value === 'asc') {
    r.sort((a, b) => {
      if (a.a !== b.a) return a.a - b.a
      if (a.b !== b.b) return a.b - b.b
      if (a.c !== b.c) return a.c - b.c
      return a.idx - b.idx
    })
  }
  // input order: keep original index order
  return r
})

// Count ID selectors: # preceded by a non-alphanumeric, or start of string
function countIds(selector) {
  const matches = selector.match(/#[a-zA-Z_][\w-]*/g)
  return matches ? matches.length : 0
}

// Count class selectors: . preceded by non-digit, followed by identifier
function countClasses(selector) {
  // Match .className but not .5 (decimal) — class must start with letter/_/-
  // We also need to handle escaping like .\3c etc. but keep it simple
  const matches = selector.match(/\.([a-zA-Z_-][\w-]*)/g)
  return matches ? matches.length : 0
}

// Count attribute selectors: [attr], [attr=val], etc.
function countAttributes(selector) {
  const matches = selector.match(/\[[^\]]+\]/g)
  return matches ? matches.length : 0
}

// Count pseudo-classes (those with : but not :: and not pseudo-elements)
// Pseudo-classes: :hover, :focus, :nth-child(), :not(), :is(), :has(), :first-child, :last-child, etc.
function countPseudoClasses(selector) {
  // Match :pseudo but NOT ::pseudo-element
  // We look for : that is not followed by another :
  // Also not after a : that's part of ::before/::after/::placeholder etc.
  const matches = selector.match(/(?<!:):([a-zA-Z][\w-]*)(\([^)]*\))?/g)
  if (!matches) return 0
  // Filter out known pseudo-elements (shouldn't match due to negative lookbehind but be safe)
  return matches.length
}

// Count pseudo-elements: ::before, ::after, ::first-line, ::first-letter, ::placeholder, etc.
function countPseudoElements(selector) {
  const matches = selector.match(/::[a-zA-Z][\w-]*/g)
  return matches ? matches.length : 0
}

// Count type (element) selectors
function countTypeSelectors(selector) {
  // We need to be careful not to count pseudo-class/element names
  // Element selectors are bare words at the start of selector or after combinators
  // Remove pseudo-classes/elements first
  let cleanSelector = selector
    .replace(/::[a-zA-Z][\w-]*/g, '') // pseudo-elements
    .replace(/(?<!:):[a-zA-Z][\w-]*(\([^)]*\))?/g, '') // pseudo-classes (with optional parens)
    .replace(/\[[^\]]+\]/g, '') // attribute selectors
    .replace(/#[a-zA-Z_][\w-]*/g, '') // IDs
    .replace(/\.[a-zA-Z_-][\w-]*/g, '') // classes

  // Now find standalone element names — words that are tag names
  // Match words that are not inside special contexts
  // Actual element selectors: start of string, or after space/combinator, or after )
  const matches = cleanSelector.match(/(?:^|[>\s+~(])\s*([a-zA-Z][\w-]*)/g)
  if (!matches) return 0

  // Filter out common HTML tag name patterns
  const htmlTags = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
    'b', 'base', 'blockquote', 'body', 'br', 'button',
    'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
    'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
    'em', 'embed',
    'fieldset', 'figcaption', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
    'i', 'iframe', 'img', 'input', 'ins',
    'kbd',
    'label', 'legend', 'li', 'link',
    'main', 'map', 'mark', 'menu', 'meta', 'meter',
    'nav', 'noscript',
    'object', 'ol', 'optgroup', 'option', 'output',
    'p', 'picture', 'pre', 'progress',
    'q',
    'rp', 'rt', 'ruby',
    's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
    'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
    'u', 'ul',
    'var', 'video',
    'wbr'
  ])

  // Also match custom elements like my-component
  const customElementRegex = /[a-zA-Z][\w-]*-[a-zA-Z][\w-]*/

  let count = 0
  for (const match of matches) {
    const word = match.replace(/^[>\s+~(]*\s*/, '').trim()
    if (!word) continue
    if (htmlTags.has(word.toLowerCase()) || customElementRegex.test(word)) {
      count++
    }
  }
  return count
}

// Handle :not(), :is(), :has() — extract inner selector and compute its specificity
function getPseudoSelectorSpecificity(selector) {
  // Look for :not(), :is(), :has() patterns
  const pseudoRegex = /:([a-zA-Z][\w-]*)\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g
  let match
  let totalA = 0
  let totalB = 0
  let totalC = 0

  while ((match = pseudoRegex.exec(selector)) !== null) {
    const pseudoName = match[1].toLowerCase()
    const innerSelector = match[2]

    // :where() has zero specificity contribution
    if (pseudoName === 'where') continue

    // :not(), :is(), :has() — take the highest specificity inside
    if (pseudoName === 'not' || pseudoName === 'is' || pseudoName === 'has' || pseudoName === 'matches') {
      const inner = calculateSingle(innerSelector)
      totalA = Math.max(totalA, inner.a)
      totalB = Math.max(totalB, inner.b)
      totalC = Math.max(totalC, inner.c)
    }
    // For :nth-child, :nth-last-child, :nth-of-type, :nth-last-of-type,
    // :lang, :dir — they are pseudo-classes counted in b, handled elsewhere
  }

  return { a: totalA, b: totalB, c: totalC }
}

function calculateSingle(selector) {
  if (!selector || !selector.trim()) {
    return { a: 0, b: 0, c: 0, important: false }
  }

  let s = selector.trim()

  // Check for !important
  const important = /!\s*important/i.test(s)
  s = s.replace(/!\s*important/i, '').trim()

  // Check if it's inline style
  if (/^\s*\{/.test(s)) {
    return { a: 1, b: 0, c: 0, important, inline: true }
  }

  // Get pseudo selector contributions (:not/:is/:has)
  const pseudoSpec = getPseudoSelectorSpecificity(s)

  // Count components
  const idCount = countIds(s)
  const classCount = countClasses(s)
  const attrCount = countAttributes(s)
  const pseudoClassCount = countPseudoClasses(s)
  const pseudoElementCount = countPseudoElements(s)
  const typeCount = countTypeSelectors(s)

  // a = IDs + pseudo-specific from :not/:is/:has
  const a = idCount + pseudoSpec.a
  // b = classes + attributes + pseudo-classes + pseudo-specific from :not/:is/:has
  const b = classCount + attrCount + pseudoClassCount + pseudoSpec.b
  // c = type selectors + pseudo-elements + pseudo-specific from :not/:is/:has
  const c = typeCount + pseudoElementCount + pseudoSpec.c

  return { a, b, c, important }
}

function onInput() {
  // Auto-calculate on input (debounced by user typing)
  const trimmed = input.value.trim()
  if (trimmed) {
    calculate()
  }
}

function calculate() {
  error.value = ''
  success.value = ''

  const trimmed = input.value.trim()
  if (!trimmed) {
    error.value = '请输入至少一个 CSS 选择器'
    return
  }

  try {
    // Split by newlines, filter empty lines
    const lines = trimmed.split(/\n/).map(l => l.trim()).filter(l => l !== '')

    if (lines.length === 0) {
      error.value = '请输入至少一个 CSS 选择器'
      return
    }

    // Handle comma-separated selectors: if a line has commas, split them
    const selectors = []
    for (const line of lines) {
      // Split by comma, but be careful with commas inside :is() / :not() / attr selectors
      const parts = splitSelectors(line)
      for (const part of parts) {
        const s = part.trim()
        if (s) selectors.push(s)
      }
    }

    if (selectors.length === 0) {
      error.value = '请输入至少一个有效的 CSS 选择器'
      return
    }

    results.value = selectors.map((selector, idx) => {
      const spec = calculateSingle(selector)
      return {
        selector,
        a: spec.a,
        b: spec.b,
        c: spec.c,
        important: spec.important,
        inline: spec.inline,
        idx
      }
    })

    success.value = `已计算 ${results.value.length} 个选择器`
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = e.message || '计算失败'
  }
}

// Split selectors by comma, but not inside parens or brackets
function splitSelectors(str) {
  const result = []
  let depth = 0
  let current = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '(' || ch === '[') {
      depth++
      current += ch
    } else if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1)
      current += ch
    } else if (ch === ',' && depth === 0) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) result.push(current)
  return result
}

async function copyResults() {
  if (results.value.length === 0) return
  const text = sortedResults.value.map((item, idx) => {
    const imp = item.important ? ' !important' : ''
    const rank = sortMode.value !== 'input' ? `#${idx + 1} ` : ''
    return `${rank}(${item.a}, ${item.b}, ${item.c})${imp} — ${item.selector}`
  }).join('\n')
  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  results.value = []
  error.value = ''
  success.value = ''
  sortMode.value = 'desc'
}
</script>

<style scoped>
.specificity-output {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
  min-height: 200px;
  max-height: 500px;
}

.specificity-row {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 10px;
  font-family: 'MapleMono NF CN', monospace;
  font-size: 13px;
  border-bottom: 1px solid var(--line);
  transition: background 0.15s;
}

.specificity-row:last-child {
  border-bottom: none;
}

.specificity-row:hover {
  background: rgba(157, 255, 107, 0.04);
}

.specificity-row--top {
  background: rgba(157, 255, 107, 0.06);
}

.specificity-rank {
  color: var(--muted);
  font-size: 11px;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.specificity-selector {
  flex: 1;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.specificity-score {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  font-size: 11px;
}

.spec-a {
  color: #ff6b7d;
  background: rgba(255, 107, 125, 0.1);
  padding: 1px 5px;
  border: 1px solid rgba(255, 107, 125, 0.3);
}

.spec-b {
  color: #ffa500;
  background: rgba(255, 165, 0, 0.1);
  padding: 1px 5px;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.spec-c {
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
  padding: 1px 5px;
  border: 1px solid rgba(79, 195, 247, 0.3);
}

.specificity-total {
  color: var(--green);
  white-space: nowrap;
  font-size: 12px;
  flex-shrink: 0;
}

.spec-important {
  color: var(--red);
  font-weight: bold;
}

@media (max-width: 640px) {
  .specificity-row {
    flex-wrap: wrap;
    font-size: 12px;
    padding: 6px 8px;
    gap: 6px;
  }

  .specificity-selector {
    width: 100%;
    order: -1;
  }

  .specificity-output {
    min-height: 150px;
    max-height: 350px;
  }
}
</style>
