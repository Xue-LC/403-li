<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📄 HTML 格式化压缩</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">HTML 输入：</label>
            <textarea
              v-model="input"
              placeholder="粘贴 HTML 代码..."
              rows="14"
              class="code-input"
              @input="clearStatus"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="format" :disabled="!input.trim()">
            ✨ 格式化
          </button>
          <button class="tool-button" @click="minify" :disabled="!input.trim()">
            📦 压缩
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clearAll" :disabled="!input && !output">
            🗑️ 清空
          </button>
        </div>

        <div v-if="showStats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">原始大小</span>
              <span class="stat-value">{{ stats.originalSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">输出大小</span>
              <span class="stat-value">{{ stats.outputSize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">压缩率</span>
              <span class="stat-value">{{ stats.ratio }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const success = ref('')
const showStats = ref(false)
const stats = reactive({ originalSize: '', outputSize: '', ratio: '' })

// ── Constants ──────────────────────────────────────────────────────

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
])

const PRESERVE_TAGS = new Set(['pre', 'textarea', 'script', 'style'])

// ── Utilities ──────────────────────────────────────────────────────

function clearStatus() {
  error.value = ''
  success.value = ''
  showStats.value = false
}

function updateStats(original, formatted) {
  const origBytes = new Blob([original]).size
  const outBytes = new Blob([formatted]).size
  stats.originalSize = formatBytes(origBytes)
  stats.outputSize = formatBytes(outBytes)
  const ratio = origBytes > 0 ? ((1 - outBytes / origBytes) * 100).toFixed(1) : '0.0'
  stats.ratio = ratio + '%'
  showStats.value = true
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function removeComments(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach(n => n.remove())
}

// ── HTML Beautifier ────────────────────────────────────────────────

function beautifyHTML(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  removeComments(doc)

  const indentStr = '  '
  const isFullDoc = /<html[\s>]/i.test(html)
  let result = ''

  // Preserve DOCTYPE for full documents
  if (isFullDoc) {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) result += doctypeMatch[0] + '\n'
  }

  function serialize(node, depth) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      if (text.trim()) {
        result += indentStr.repeat(depth) + text.trim() + '\n'
      }
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase()

      // Build opening tag with attributes
      let open = '<' + tag
      if (node.attributes) {
        for (const attr of node.attributes) {
          open += ` ${attr.name}="${escapeAttr(attr.value)}"`
        }
      }

      // Void elements — no closing tag, no children
      if (VOID_ELEMENTS.has(tag)) {
        result += indentStr.repeat(depth) + open + '>\n'
        return
      }

      // Preserve-whitespace elements — keep inner content verbatim
      if (PRESERVE_TAGS.has(tag)) {
        result += indentStr.repeat(depth) + open + '>'
        result += node.innerHTML
        result += '</' + tag + '>\n'
        return
      }

      // Leaf element with only text content (no child elements)
      const children = Array.from(node.childNodes)
      const childElements = children.filter(c => c.nodeType === Node.ELEMENT_NODE)
      const textContent = node.textContent.trim()

      if (childElements.length === 0) {
        if (textContent) {
          result += indentStr.repeat(depth) + open + '>' + textContent + '</' + tag + '>\n'
        } else {
          result += indentStr.repeat(depth) + open + '></' + tag + '>\n'
        }
        return
      }

      // Container element with child elements — recurse
      result += indentStr.repeat(depth) + open + '>\n'
      for (const child of children) {
        serialize(child, depth + 1)
      }
      result += indentStr.repeat(depth) + '</' + tag + '>\n'
    }
  }

  const root = isFullDoc ? doc.documentElement : doc.body
  if (isFullDoc) {
    serialize(root, 0)
  } else {
    for (const child of root.childNodes) {
      serialize(child, 0)
    }
  }

  // Clean up trailing blank lines
  return result.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

// ── HTML Minifier ──────────────────────────────────────────────────

function minifyHTML(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  removeComments(doc)

  const isFullDoc = /<html[\s>]/i.test(html)
  let result = ''

  // DOCTYPE for full documents
  if (isFullDoc) {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
    if (doctypeMatch) result += doctypeMatch[0]
  }

  function serialize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Collapse whitespace into a single space
      const text = node.textContent.replace(/\s+/g, ' ')
      if (text) result += text
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase()

      result += '<' + tag
      if (node.attributes) {
        for (const attr of node.attributes) {
          result += ` ${attr.name}="${escapeAttr(attr.value)}"`
        }
      }

      if (VOID_ELEMENTS.has(tag)) {
        result += '>'
        return
      }

      result += '>'

      if (PRESERVE_TAGS.has(tag)) {
        result += node.innerHTML
      } else {
        for (const child of node.childNodes) {
          serialize(child)
        }
      }

      result += '</' + tag + '>'
    }
  }

  if (isFullDoc) {
    serialize(doc.documentElement)
  } else {
    for (const child of doc.body.childNodes) {
      serialize(child)
    }
  }

  return result
}

// ── Actions ────────────────────────────────────────────────────────

function format() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 HTML 代码'
    return
  }
  try {
    const formatted = beautifyHTML(input.value)
    output.value = formatted
    updateStats(input.value, formatted)
    success.value = '格式化完成'
  } catch (e) {
    error.value = '格式化失败：' + e.message
    output.value = ''
  }
}

function minify() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 HTML 代码'
    return
  }
  try {
    const compressed = minifyHTML(input.value)
    output.value = compressed
    updateStats(input.value, compressed)
    success.value = '压缩完成'
  } catch (e) {
    error.value = '压缩失败：' + e.message
    output.value = ''
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => {
      if (success.value === '已复制到剪贴板') success.value = ''
    }, 2000)
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  clearStatus()
}
</script>

<style scoped>
/* All styling uses shared classes from tools.css — no component-specific styles needed */
</style>
