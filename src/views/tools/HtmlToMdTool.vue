<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔁 HTML 转 Markdown</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 双栏布局：左 HTML 输入 / 右 Markdown 输出 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">HTML 输入：</label>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              placeholder="粘贴 HTML 代码，自动转换为 Markdown 格式...（支持标题、段落、列表、表格、链接、图片、代码块、引用等）"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">Markdown 输出：</label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 输出选项（全宽，双栏外） -->
        <div class="options-row">
          <div class="option-group">
            <label class="tool-label">输出选项：</label>
            <div class="option-checks">
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.tableMd" />
                <span>表格转 Markdown 表格</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.linkMd" />
                <span>链接输出 [标题](URL)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.imgMd" />
                <span>图片输出 ![alt](src)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.codeLang" />
                <span>代码块保留语言标识</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.removeEmpty" />
                <span>移除所有空行</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-4">
          <button class="tool-button" @click="fillSample">✨ 填入示例</button>
          <button class="tool-button primary" @click="convert" :disabled="!input.trim()">
            ⚡ 转换
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制结果
          </button>
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">
            📋 复制输入
          </button>
        </div>

        <div class="button-group">
          <button class="tool-button danger full-width" @click="clear" :disabled="!input && !output">
            🗑️ 清空
          </button>
        </div>

        <!-- 统计信息 -->
        <div v-if="stats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">输入字符数</span>
              <span class="stat-value">{{ stats.inputChars }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出字符数</span>
              <span class="stat-value">{{ stats.outputChars }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出行数</span>
              <span class="stat-value">{{ stats.lines }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">HTML 元素数</span>
              <span class="stat-value">{{ stats.elements }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const opts = ref({
  tableMd: true,     // 表格转 GFM 表格
  linkMd: true,      // 链接输出 [标题](URL)
  imgMd: true,       // 图片输出 ![alt](src)
  codeLang: true,    // 代码块保留语言标识
  removeEmpty: false // 移除所有空行
})
const error = ref('')
const success = ref(false)

const H_TAGS = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 }

// 需要跳过内容的标签（脚本/样式/模板等）
const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'template', 'iframe', 'svg',
  'head', 'meta', 'link', 'title', 'object', 'embed'
])

// 块级容器：仅递归子节点，不产生自身标记
const CONTAINER_TAGS = new Set([
  'div', 'section', 'article', 'main', 'header', 'footer', 'nav',
  'aside', 'form', 'fieldset', 'figure', 'figcaption', 'details',
  'summary', 'address', 'center'
])

// 块级标签（用于列表项内判断是否包含块级内容）
const BLOCK_TAGS = new Set([
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'blockquote', 'pre', 'table', 'hr', 'section', 'article', 'header',
  'footer', 'nav', 'aside', 'form', 'fieldset', 'dl', 'dt', 'dd',
  'figure', 'figcaption', 'main', 'address', 'details', 'summary', 'center'
])

/**
 * 转义 Markdown 特殊字符（文本节点用，避免破坏输出格式）
 */
function escapeText(t) {
  return t.replace(/([\\`*_\[\]])/g, '\\$1')
}

/**
 * 行内代码片段：含反引号时用双反引号包裹
 */
function codeSpan(code) {
  const c = code.replace(/\r?\n/g, ' ').trim()
  if (!c) return ''
  if (c.includes('`')) return '`` ' + c + ' ``'
  return '`' + c + '`'
}

/**
 * 收集元素的子节点行内文本（避免对元素自身递归）
 */
function childInline(n) {
  let s = ''
  for (const ch of n.childNodes) {
    if (ch.nodeType === Node.TEXT_NODE) {
      s += escapeText(ch.textContent)
    } else if (ch.nodeType === Node.ELEMENT_NODE) {
      s += inlineText(ch)
    }
  }
  return s
}

/**
 * 行内元素转换：返回单个字符串
 * 处理 a / img / strong / em / code / del / 任务复选框 等
 */
function inlineText(node) {
  let out = ''
  const walk = (n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += escapeText(n.textContent)
      return
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return
    const tag = n.tagName.toLowerCase()
    switch (tag) {
      case 'br':
        out += '\n'
        return
      case 'img': {
        const src = (n.getAttribute('src') || '').trim()
        const alt = (n.getAttribute('alt') || '').trim()
        if (opts.value.imgMd && src) out += `![${alt}](${src})`
        else out += alt || ''
        return
      }
      case 'a': {
        const href = (n.getAttribute('href') || '').trim()
        const text = childInline(n)
        if (opts.value.linkMd && href) {
          const title = (n.getAttribute('title') || '').trim()
          out += title ? `[${text}](${href} "${title}")` : `[${text}](${href})`
        } else {
          out += text
        }
        return
      }
      case 'strong':
      case 'b': {
        const t = childInline(n).trim()
        if (t) out += `**${t}**`
        return
      }
      case 'em':
      case 'i': {
        const t = childInline(n).trim()
        if (t) out += `*${t}*`
        return
      }
      case 'code':
        out += codeSpan(n.textContent)
        return
      case 'del':
      case 's':
      case 'strike': {
        const t = childInline(n).trim()
        if (t) out += `~~${t}~~`
        return
      }
      case 'sup': {
        const t = childInline(n).trim()
        if (t) out += `^${t}^`
        return
      }
      case 'sub': {
        const t = childInline(n).trim()
        if (t) out += `~${t}~`
        return
      }
      case 'input': {
        if (n.type === 'checkbox') out += n.checked ? '[x]' : '[ ]'
        return
      }
      default:
        for (const ch of n.childNodes) walk(ch)
    }
  }
  walk(node)
  return out
}

/**
 * 代码块：```lang + 内容 + ```
 */
function handlePre(pre, lines) {
  let code = pre.querySelector('code')
  let lang = ''
  if (opts.value.codeLang && code) {
    const cls = code.getAttribute('class') || ''
    const m = cls.match(/(?:language|lang|highlight)[-:](\w+)/i)
    if (m) lang = m[1]
  }
  if (!code) code = pre
  const body = code.textContent.replace(/\r\n/g, '\n').replace(/\n+$/, '')
  lines.push('```' + lang)
  lines.push(body)
  lines.push('```')
}

/**
 * 表格：首行作为表头，输出 GFM 表格
 */
function handleTable(table, lines) {
  const rows = [...table.querySelectorAll('tr')]
  if (!rows.length) return
  const headerCells = [...rows[0].querySelectorAll('th,td')]
  if (!headerCells.length) return

  if (!opts.value.tableMd) {
    // 不转表格时退化为纯文本行
    for (const tr of rows) {
      const cells = [...tr.querySelectorAll('th,td')]
        .map(c => inlineText(c).replace(/\n/g, ' ').trim())
      if (cells.length) lines.push(cells.join(' | '))
    }
    return
  }

  const colCount = headerCells.length
  const head = headerCells.map(c => inlineText(c).replace(/\n/g, ' ').trim())
  lines.push('| ' + head.join(' | ') + ' |')
  lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |')
  for (let i = 1; i < rows.length; i++) {
    const cells = [...rows[i].querySelectorAll('th,td')]
    const vals = []
    for (let j = 0; j < colCount; j++) {
      const cell = cells[j]
      vals.push(cell ? inlineText(cell).replace(/\n/g, ' ').trim() : '')
    }
    lines.push('| ' + vals.join(' | ') + ' |')
  }
}

/**
 * 列表（ul/ol）：支持嵌套，depth 控制缩进
 */
function handleList(el, lines, depth) {
  const ordered = el.tagName.toLowerCase() === 'ol'
  let idx = 1
  const start = parseInt(el.getAttribute('start') || '', 10)
  if (ordered && !isNaN(start)) idx = start

  for (const li of el.children) {
    if (li.tagName.toLowerCase() !== 'li') continue
    const indent = '  '.repeat(depth)
    const marker = ordered ? idx + '. ' : '- '
    const kids = [...li.childNodes]
    const hasBlock = kids.some(c =>
      c.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(c.tagName.toLowerCase())
    )

    if (!hasBlock) {
      // 纯行内内容：单行输出
      const t = inlineText(li).trim()
      if (t) lines.push(indent + marker + t)
    } else {
      // 含块级内容：多行输出，首行带标记，其余行缩进
      const tmp = []
      for (const c of kids) {
        if (c.nodeType === Node.TEXT_NODE) {
          const t = c.textContent.replace(/\s+/g, ' ').trim()
          if (t) tmp.push(t)
        } else if (c.nodeType === Node.ELEMENT_NODE) {
          const ct = c.tagName.toLowerCase()
          if (ct === 'ul' || ct === 'ol') handleList(c, tmp, depth + 1)
          else if (BLOCK_TAGS.has(ct)) handleBlock(c, tmp, depth)
          else {
            const t = inlineText(c).trim()
            if (t) tmp.push(t)
          }
        }
      }
      const first = tmp.shift() || ''
      lines.push(indent + marker + first)
      for (const l of tmp) {
        for (const sub of l.split('\n')) {
          lines.push(indent + '  ' + sub)
        }
      }
    }
    idx++
  }
}

/**
 * 引用块：每行前缀 '> '
 */
function handleBlockquote(bq, lines, depth) {
  const tmp = []
  walk(bq, tmp, depth)
  for (const l of tmp) {
    lines.push(l ? '> ' + l : '>')
  }
}

/**
 * 块级元素分发
 */
function handleBlock(node, lines, depth) {
  const tag = node.tagName.toLowerCase()
  if (SKIP_TAGS.has(tag) || tag === 'br') return

  if (H_TAGS[tag]) {
    const t = inlineText(node).trim()
    if (t) lines.push('#'.repeat(H_TAGS[tag]) + ' ' + t)
    return
  }
  if (tag === 'p') {
    const t = inlineText(node).trim()
    if (t) lines.push(t)
    return
  }
  if (tag === 'pre') { handlePre(node, lines); return }
  if (tag === 'ul' || tag === 'ol') { handleList(node, lines, depth); return }
  if (tag === 'table') { handleTable(node, lines); return }
  if (tag === 'blockquote') { handleBlockquote(node, lines, depth); return }
  if (tag === 'hr') { lines.push('---'); return }
  if (tag === 'img') {
    const src = (node.getAttribute('src') || '').trim()
    const alt = (node.getAttribute('alt') || '').trim()
    if (opts.value.imgMd && src) lines.push(`![${alt}](${src})`)
    else if (alt) lines.push(alt)
    return
  }
  if (tag === 'li') {
    const t = inlineText(node).trim()
    if (t) lines.push('- ' + t)
    return
  }
  if (tag === 'dt') {
    const t = inlineText(node).trim()
    if (t) lines.push('**' + t + '**')
    return
  }
  if (tag === 'dd') {
    const t = inlineText(node).trim()
    if (t) lines.push('    ' + t)
    return
  }
  if (CONTAINER_TAGS.has(tag)) { walk(node, lines, depth); return }
  // 默认：按行内内容输出
  const t = inlineText(node).trim()
  if (t) lines.push(t)
}

/**
 * 递归遍历容器子节点
 */
function walk(container, lines, depth) {
  for (const child of container.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent.replace(/\s+/g, ' ').trim()
      if (t) lines.push(t)
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    handleBlock(child, lines, depth)
  }
}

/**
 * 后处理：去行尾空白、折叠连续空行、按选项移除空行
 */
function postProcess(md) {
  const lines = md.split('\n').map(l => l.replace(/[ \t]+$/g, ''))
  const joined = opts.value.removeEmpty
    ? lines.join('\n').replace(/\n{3,}/g, '\n\n')
    : lines.join('\n')
  let out = joined.split('\n')
  if (opts.value.removeEmpty) out = out.filter(l => l.trim() !== '')
  while (out.length && out[0] === '') out.shift()
  while (out.length && out[out.length - 1] === '') out.pop()
  return out.join('\n')
}

// 实时转换（纯前端 DOMParser 实现）
const output = computed(() => {
  const html = input.value
  if (!html.trim()) return ''
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc.body) throw new Error('无法解析 HTML 内容')
    const lines = []
    walk(doc.body, lines, 0)
    if (error.value) error.value = ''
    return postProcess(lines.join('\n'))
  } catch (e) {
    error.value = '解析 HTML 失败：' + (e.message || e)
    return ''
  }
})

// 统计信息
const stats = computed(() => {
  const text = output.value
  if (!text) return null
  let elements = 0
  try {
    const doc = new DOMParser().parseFromString(input.value, 'text/html')
    elements = doc.body ? doc.body.getElementsByTagName('*').length : 0
  } catch (e) { /* ignore */ }
  return {
    inputChars: input.value.length,
    outputChars: text.length,
    lines: text.split('\n').length,
    elements
  }
})

function convert() {
  if (!input.value.trim()) {
    error.value = '请先输入 HTML 代码'
    setTimeout(() => { error.value = '' }, 2000)
    return
  }
  if (output.value) {
    success.value = '转换完成'
    setTimeout(() => { success.value = false }, 2000)
  }
}

function fillSample() {
  const sample = [
    '<h1>HTML 转 Markdown</h1>',
    '<p>这是一个<strong>在线工具</strong>，把 <em>HTML</em> 转换为 <code>Markdown</code> 格式，',
    '所有处理都在浏览器本地完成。</p>',
    '<p>访问 <a href="https://403.li" title="403.li 官网">403.li</a> 获取更多在线工具。</p>',
    '<h2>功能特性</h2>',
    '<ul>',
    '  <li>支持标题、段落、列表、表格</li>',
    '  <li>支持链接、图片、代码块、引用</li>',
    '  <li>嵌套列表：',
    '    <ul>',
    '      <li>二级列表项</li>',
    '      <li>另一个二级项</li>',
    '    </ul>',
    '  </li>',
    '  <li><input type="checkbox" checked> 已完成的任务</li>',
    '  <li><input type="checkbox"> 未完成的任务</li>',
    '</ul>',
    '<ol>',
    '  <li>第一步：粘贴 HTML 代码</li>',
    '  <li>第二步：点击转换</li>',
    '</ol>',
    '<blockquote>提示：本工具完全离线运行，不会上传任何数据。</blockquote>',
    '<h3>表格示例</h3>',
    '<table>',
    '  <thead>',
    '    <tr><th>选项</th><th>说明</th></tr>',
    '  </thead>',
    '  <tbody>',
    '    <tr><td>表格</td><td>输出 GFM 表格</td></tr>',
    '    <tr><td>代码块</td><td>保留语言标识</td></tr>',
    '  </tbody>',
    '</table>',
    '<pre><code class="language-js">console.log("hello 403.li")</code></pre>',
    '<hr>',
    '<p><img src="https://403.li/logo.png" alt="403.li 标志"></p>',
    ''
  ].join('\n')
  input.value = sample
  error.value = ''
  success.value = false
}

async function copyOutput() {
  if (await copyText(output.value)) {
    success.value = '结果已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

async function copyInput() {
  if (await copyText(input.value)) {
    success.value = '输入已复制到剪贴板'
    setTimeout(() => { success.value = false }, 2000)
  } else {
    error.value = '复制失败，请手动复制'
    setTimeout(() => { error.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  opts.value = { tableMd: true, linkMd: true, imgMd: true, codeLang: true, removeEmpty: false }
  error.value = ''
  success.value = false
}
</script>

<style scoped>
.options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 14px 0 8px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-group > .tool-label {
  margin-bottom: 2px;
}

.option-checks {
  flex-direction: column;
  gap: 8px;
}

.option-checks .checkbox-label {
  margin: 0;
}

/* 统计网格 */
.stats-section {
  margin-top: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
}

.stat-item {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
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

@media (max-width: 640px) {
  .options-row {
    flex-direction: column;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-value {
    font-size: 14px;
  }
}

@media (max-width: 375px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
