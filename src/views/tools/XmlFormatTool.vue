<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📄 XML 格式化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">XML 输入：</label>
            <textarea
              v-model="input"
              placeholder="&lt;root&gt;&lt;item id=&quot;1&quot;&gt;hello&lt;/item&gt;&lt;/root&gt;"
              rows="14"
              class="code-input"
              @input="clearStatus"
            ></textarea>
          </div>
          <div class="tool-col">
            <div class="output-header">
              <label class="tool-label">输出：</label>
              <div class="view-tabs">
                <button
                  :class="['view-tab', { active: viewMode === 'text' }]"
                  @click="viewMode = 'text'"
                >📝 文本</button>
                <button
                  :class="['view-tab', { active: viewMode === 'tree' }]"
                  @click="viewMode = 'tree'"
                >🌲 树形</button>
              </div>
            </div>
            <textarea
              v-if="viewMode === 'text'"
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="结果将显示在这里..."
            ></textarea>
            <div
              v-else
              class="tree-output"
              v-html="treeHtml"
            ></div>
          </div>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="format" :disabled="!input.trim()">
            ✨ 格式化
          </button>
          <button class="tool-button" @click="minify" :disabled="!input.trim()">
            📦 压缩
          </button>
          <button class="tool-button" @click="doValidate" :disabled="!input.trim()">
            ✓ 校验
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!usableOutput()">
            📋 复制
          </button>
        </div>

        <div v-if="error" class="status-error">
          ❌ 错误：{{ error }}
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
const output = ref('')
const error = ref('')
const success = ref('')
const viewMode = ref('text')

const treeHtml = ref('<span class="tree-hint">请先格式化或校验 XML</span>')

function usableOutput() {
  return output.value.trim() || (viewMode.value === 'tree' && treeHtml.value)
}

function clearStatus() {
  error.value = ''
  success.value = ''
}

// Extract XML declaration and DOCTYPE from raw input
function extractHeader(xml) {
  const header = []
  const declMatch = xml.match(/<\?xml[^?]*\?>/i)
  if (declMatch) {
    header.push(declMatch[0])
  }
  const doctypeMatch = xml.match(/<!DOCTYPE[^>]*>/i)
  if (doctypeMatch) {
    header.push(doctypeMatch[0])
  }
  return header
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function serializeNode(node, indent) {
  // Text node
  if (node.nodeType === 3) {
    const text = node.textContent
    if (!text) return ''
    const trimmed = text.trim()
    if (!trimmed) return text.includes('\n') ? '' : ''
    return trimmed
  }
  // CDATA section
  if (node.nodeType === 4) {
    return '<![CDATA[' + node.textContent + ']]>'
  }
  // Comment
  if (node.nodeType === 8) {
    return '  '.repeat(indent) + '<!--' + node.textContent + '-->'
  }
  // Element
  if (node.nodeType === 1) {
    let result = '  '.repeat(indent) + '<' + node.nodeName

    // Attributes
    if (node.attributes && node.attributes.length > 0) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i]
        result += ' ' + attr.name + '="' + escapeXml(attr.value) + '"'
      }
    }

    const children = Array.from(node.childNodes)

    if (children.length === 0) {
      result += ' />'
      return result
    }

    result += '>'

    // Has only text children
    const allText = children.every(c => c.nodeType === 3 || c.nodeType === 4)
    if (allText) {
      result += children.map(c => {
        if (c.nodeType === 3) return c.textContent || ''
        if (c.nodeType === 4) return '<![CDATA[' + c.textContent + ']]>'
        return ''
      }).join('')
      result += '</' + node.nodeName + '>'
    } else {
      result += '\n'
      for (const child of children) {
        const s = serializeNode(child, indent + 1)
        if (s) result += s + '\n'
      }
      result += '  '.repeat(indent) + '</' + node.nodeName + '>'
    }
    return result
  }
  return ''
}

// Check for parser errors in parsed document
function getParseError(doc) {
  const errNode = doc.querySelector('parsererror')
  if (errNode) {
    // Extract clean error message
    let msg = errNode.textContent || ''
    // Remove "This page contains the following errors:" prefix
    msg = msg.replace(/^This page contains the following errors:\s*/i, '')
    // Extract just the first error line
    const lines = msg.split('\n').filter(l => l.trim())
    if (lines.length > 0) {
      const firstErr = lines[0].trim()
      // Try to extract line/column info
      const detailMatch = firstErr.match(/error on line (\d+) at column (\d+)/i)
      if (detailMatch) {
        return `第 ${detailMatch[1]} 行，第 ${detailMatch[2]} 列：${firstErr}`
      }
      return firstErr
    }
    return msg || 'XML 解析错误'
  }
  return null
}

function parseXml(xml) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const err = getParseError(doc)
  if (err) throw new Error(err)
  return doc
}

function format() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 XML 内容'
    return
  }

  try {
    const header = extractHeader(input.value)
    const doc = parseXml(input.value)
    let result = header.join('\n')
    if (result) result += '\n'
    result += serializeNode(doc.documentElement, 0)
    output.value = result
    buildTree(doc)
    success.value = '格式化完成'
  } catch (e) {
    error.value = e.message
    output.value = ''
    treeHtml.value = '<span class="tree-hint">请先格式化或校验 XML</span>'
  }
}

function minify() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 XML 内容'
    return
  }

  try {
    const header = extractHeader(input.value)
    const doc = parseXml(input.value)
    const serializer = new XMLSerializer()
    let result = serializer.serializeToString(doc)
    // If there's a declaration, prepend it
    if (header.length > 0) {
      // XMLSerializer may already include declaration if present
      // Check if result starts with <?
      if (!result.startsWith('<?')) {
        result = header.join('\n') + '\n' + result
      }
    }
    output.value = result
    buildTree(doc)
    success.value = '压缩完成'
  } catch (e) {
    error.value = e.message
    output.value = ''
    treeHtml.value = '<span class="tree-hint">请先格式化或校验 XML</span>'
  }
}

function doValidate() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 XML 内容'
    return
  }

  try {
    const doc = parseXml(input.value)
    const root = doc.documentElement
    const childCount = root.children ? root.children.length : 0
    const attrCount = root.attributes ? root.attributes.length : 0
    success.value = `XML 格式正确 — 根元素 &lt;${root.nodeName}&gt;，${attrCount} 个属性，${childCount} 个子元素`
    output.value = ''
    buildTree(doc)
  } catch (e) {
    error.value = e.message
    output.value = ''
    treeHtml.value = '<span class="tree-hint">请先格式化或校验 XML</span>'
  }
}

function buildTree(doc) {
  const root = doc.documentElement
  treeHtml.value = buildTreeHtml(root)
}

function buildTreeHtml(node, depth = 0) {
  let html = ''

  if (node.nodeType === 3) {
    const text = node.textContent.trim()
    if (text) {
      html += '<span class="tree-text">' + escapeXml(text) + '</span>'
    }
    return html
  }
  if (node.nodeType === 8) {
    html += '<span class="tree-comment">&lt;!--' + escapeXml(node.textContent) + '--&gt;</span>'
    return html
  }
  if (node.nodeType === 4) {
    html += '<span class="tree-cdata">&lt;![CDATA[' + escapeXml(node.textContent) + ']]&gt;</span>'
    return html
  }

  if (node.nodeType !== 1) return html

  const indent = '  '.repeat(depth)
  const hasChildren = node.childNodes && node.childNodes.length > 0
  const hasOnlyText = hasChildren &&
    Array.from(node.childNodes).every(c => c.nodeType === 3 && c.textContent.trim())

  html += '<div class="tree-node">'
  html += '<span class="tree-indent">' + indent + '</span>'
  html += '<span class="tree-tag">&lt;<span class="tree-tag-name">' + node.nodeName + '</span></span>'

  // Attributes
  if (node.attributes && node.attributes.length > 0) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      html += ' <span class="tree-attr">' + attr.name + '</span>'
      html += '=<span class="tree-value">"' + escapeXml(attr.value) + '"</span>'
    }
  }

  if (!hasChildren) {
    html += '<span class="tree-tag"> /&gt;</span>'
    html += '</div>'
    return html
  }

  html += '<span class="tree-tag">&gt;</span>'

  if (hasOnlyText) {
    html += '<span class="tree-text">' + escapeXml(node.textContent) + '</span>'
    html += '<span class="tree-tag">&lt;/<span class="tree-tag-name">' + node.nodeName + '</span>&gt;</span>'
  } else {
    html += '\n'
    for (let i = 0; i < node.childNodes.length; i++) {
      const childHtml = buildTreeHtml(node.childNodes[i], depth + 1)
      if (childHtml) html += childHtml
    }
    html += '<div class="tree-node">'
    html += '<span class="tree-indent">' + indent + '</span>'
    html += '<span class="tree-tag">&lt;/<span class="tree-tag-name">' + node.nodeName + '</span>&gt;</span>'
    html += '</div>\n'
  }

  html += '</div>'
  return html
}

async function copyOutput() {
  const text = viewMode.value === 'text' ? output.value : getTreePlainText()
  if (!text.trim()) return
  if (await copyText(text)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => {
      if (success.value === '已复制到剪贴板') success.value = ''
    }, 2000)
  }
}

// Extract plain text from tree HTML for copying
function getTreePlainText() {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input.value, 'text/xml')
  const err = getParseError(doc)
  if (err) return ''
  // Simple: return formatted output text
  const header = extractHeader(input.value)
  let result = header.join('\n')
  if (result) result += '\n'
  result += serializeNode(doc.documentElement, 0)
  return result
}
</script>

<style scoped>
.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-tabs {
  display: flex;
  gap: 0;
}

.view-tab {
  padding: 2px 10px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  border-radius: 0;
}

.view-tab:first-child {
  border-right: none;
}

.view-tab.active {
  background: var(--green);
  color: var(--bg);
  border-color: var(--green);
}

.tree-output {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 10px 12px;
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  overflow: auto;
  max-height: 350px;
  white-space: pre;
  width: 100%;
  box-sizing: border-box;
  border-radius: 0;
}

.tree-hint {
  color: var(--muted);
}

/* Tree view syntax colors */
.tree-node {
}

.tree-indent {
  color: var(--line);
}

.tree-tag {
  color: var(--muted);
}

.tree-tag-name {
  color: var(--green);
}

.tree-attr {
  color: #e6c300;
}

.tree-value {
  color: #ff9d6b;
}

.tree-text {
  color: var(--text);
}

.tree-comment {
  color: #666;
  font-style: italic;
}

.tree-cdata {
  color: var(--muted);
}

@media (max-width: 640px) {
  .tree-output {
    max-height: 250px;
    font-size: 12px;
  }
}
</style>
