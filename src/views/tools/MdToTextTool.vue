<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧹 Markdown 转纯文本</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- 双栏布局：左输入 / 右输出 -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">Markdown 输入：</label>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              placeholder="粘贴 Markdown 文本，自动去除标题、加粗、链接、图片、代码块、列表等格式标记..."
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">纯文本输出：</label>
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
                <input type="checkbox" v-model="opts.keepBreaks" />
                <span>保留换行结构</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.removeEmpty" />
                <span>去除空行</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.linkUrl" />
                <span>链接附加 URL</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.imgAlt" />
                <span>图片使用替代文本</span>
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
          <button class="tool-button danger full-width" @click="clear">🗑️ 清空</button>
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
              <span class="stat-label">体积减少</span>
              <span class="stat-value">{{ stats.reduction }}%</span>
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
import { marked } from 'marked'
import { copyText } from '../../utils/clipboard'

// 与 MarkdownTool 一致的解析配置：GFM + 保留软换行
marked.setOptions({ gfm: true, breaks: true })

const input = ref('')
const opts = ref({
  keepBreaks: true,   // 保留换行结构
  removeEmpty: false, // 去除空行
  linkUrl: true,      // 链接附加 URL
  imgAlt: true        // 图片使用替代文本
})
const error = ref('')
const success = ref(false)

// 块级元素：结束后换行；表格单元格：结束后用 Tab 分隔
const BLOCK_TAGS = new Set([
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'tr', 'hr',
  'table', 'section', 'article', 'header', 'footer'
])
const CELL_TAGS = new Set(['td', 'th'])

/**
 * 深度遍历 DOM，提取纯文本。
 * - br / 块级元素 → 换行
 * - td/th → Tab 分隔（表格转 TSV 风格文本）
 * - a → 文本后附加 URL；img → 使用 alt 文本
 * - 任务列表 checkbox → [x] / [ ]
 */
function extractText(root, o) {
  let out = ''
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // marked 输出的 HTML 在块级元素间带有换行空白节点，
      // 去掉其中的换行（pre/code 内保留，避免破坏代码缩进）
      let t = node.textContent
      const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : ''
      if (parentTag !== 'pre' && parentTag !== 'code') {
        t = t.replace(/\r?\n/g, '')
      }
      out += t
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const tag = node.tagName.toLowerCase()
    if (tag === 'br') {
      out += '\n'
      return
    }
    if (tag === 'img') {
      if (o.imgAlt) {
        const alt = (node.getAttribute('alt') || '').trim()
        if (alt) out += alt
      }
      return
    }
    if (tag === 'input' && node.type === 'checkbox') {
      out += node.checked ? '[x]' : '[ ]'
      return
    }

    for (const child of node.childNodes) walk(child)

    if (tag === 'a' && o.linkUrl) {
      const href = (node.getAttribute('href') || '').trim()
      if (href) out += ` (${href})`
    }
    if (CELL_TAGS.has(tag)) out += '\t'
    else if (BLOCK_TAGS.has(tag)) out += '\n'
  }
  walk(root)
  return out
}

// 实时转换
const output = computed(() => {
  const md = input.value
  if (!md.trim()) return ''

  let html
  try {
    html = marked.parse(md)
    if (error.value) error.value = ''
  } catch (e) {
    error.value = '解析 Markdown 失败：' + (e.message || e)
    return ''
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  let text = extractText(doc.body, opts.value)

  // 去掉每行行尾空白
  let lines = text.split('\n').map(l => l.replace(/[ \t]+$/g, ''))

  if (opts.value.keepBreaks) {
    // 连续 3 个以上换行折叠为 1 个空行
    let joined = lines.join('\n').replace(/\n{3,}/g, '\n\n')
    lines = joined.split('\n')
    if (opts.value.removeEmpty) {
      lines = lines.filter(l => l !== '')
    }
    // 去掉首尾空行
    while (lines.length && lines[0] === '') lines.shift()
    while (lines.length && lines[lines.length - 1] === '') lines.pop()
  } else {
    // 不保留换行：全部合并为单个段落
    lines = [lines.join(' ').replace(/[ \t]+/g, ' ').trim()]
  }

  return lines.join('\n')
})

// 统计信息
const stats = computed(() => {
  const text = output.value
  if (!text) return null
  const inputChars = input.value.length
  const outputChars = text.length
  return {
    inputChars,
    outputChars,
    lines: text.split('\n').length,
    reduction: inputChars
      ? Math.max(0, Math.round((1 - outputChars / inputChars) * 100))
      : 0
  }
})

function convert() {
  if (!input.value.trim()) {
    error.value = '请先输入 Markdown 文本'
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
    '# Markdown 转纯文本',
    '',
    '这是一个**在线工具**，可以*去除* Markdown 的各种格式标记，',
    '输出干净的纯文本内容。',
    '',
    '## 功能特性',
    '',
    '- 去除标题、加粗、斜体等格式标记',
    '- 支持[链接](https://403.li)和图片',
    '- 支持保留换行结构或去除空行',
    '- 所有处理都在浏览器本地完成',
    '',
    '> 提示：不会上传任何数据，完全离线运行。',
    '',
    '| 选项 | 说明 |',
    '| ---- | ---- |',
    '| 保留换行 | 保留源文本的换行结构 |',
    '| 去除空行 | 删除输出中的所有空行 |',
    '',
    '行内代码 `const x = 1` 和代码块也会保留内容：',
    '',
    '```js',
    'console.log("hello 403.li")',
    '```',
    '',
    '- [x] 已完成的任务',
    '- [ ] 未完成的任务',
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
  opts.value = { keepBreaks: true, removeEmpty: false, linkUrl: true, imgAlt: true }
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
