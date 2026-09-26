<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔄 XML ↔ JSON</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- Direction tabs -->
        <div class="direction-bar">
          <button
            :class="['direction-btn', { active: direction === 'xml2json' }]"
            @click="setDirection('xml2json')"
          >XML → JSON</button>
          <button
            :class="['direction-btn', { active: direction === 'json2xml' }]"
            @click="setDirection('json2xml')"
          >JSON → XML</button>
        </div>

        <!-- Options -->
        <div class="options-row" v-if="direction === 'xml2json'">
          <label class="checkbox-label">
            <input type="checkbox" v-model="useAttrPrefix" />
            <span>属性加 @ 前缀</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="detectArrays" />
            <span>智能数组检测</span>
          </label>
        </div>
        <div class="options-row" v-else>
          <label class="inline-label">根节点名：</label>
          <input class="code-input-sm" v-model="rootName" placeholder="root" style="width:160px" />
        </div>

        <!-- Main content: dual column -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">{{ direction === 'xml2json' ? 'XML 输入：' : 'JSON 输入：' }}</label>
            <textarea
              v-model="input"
              :placeholder="direction === 'xml2json' ? inputPlaceholderXml : inputPlaceholderJson"
              rows="12"
              class="code-input"
              @input="clearStatus"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">{{ direction === 'xml2json' ? 'JSON 输出：' : 'XML 输出：' }}</label>
            <textarea
              :value="output"
              readonly
              rows="12"
              class="code-input output"
              :placeholder="direction === 'xml2json' ? '转换后的 JSON 将显示在这里...' : '转换后的 XML 将显示在这里...'"
            ></textarea>
          </div>
        </div>

        <!-- Buttons -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="convert" :disabled="!input.trim()">
            🔄 转换
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const success = ref('')
const direction = ref('xml2json')
const useAttrPrefix = ref(true)
const detectArrays = ref(true)
const rootName = ref('root')

const inputPlaceholderXml = '<root><item id="1"><name>hello</name></item><item id="2"><name>world</name></item></root>'
const inputPlaceholderJson = '{"root":{"item":[{"@id":"1","name":"hello"},{"@id":"2","name":"world"}]}}'

function clearStatus() {
  error.value = ''
  success.value = ''
}

function setDirection(dir) {
  if (direction.value === dir) return
  direction.value = dir
  clearStatus()
  output.value = ''
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
}

// ─── XML → JSON ───────────────────────────────────────────

function xmlToJson(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const errNode = doc.querySelector('parsererror')
  if (errNode) {
    const msg = (errNode.textContent || 'XML 解析错误')
      .replace(/^This page contains the following errors:\s*/i, '')
      .split('\n')[0]
      .trim()
    throw new Error(msg)
  }

  const result = nodeToJson(doc.documentElement)
  return result
}

function nodeToJson(node) {
  // Element node
  if (node.nodeType === 1) {
    const obj = {}

    // Process attributes
    if (node.attributes && node.attributes.length > 0) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i]
        const key = useAttrPrefix.value ? '@' + attr.name : attr.name
        obj[key] = attr.value
      }
    }

    // Process children
    const children = Array.from(node.childNodes).filter(c => {
      // Keep element nodes, CDATA sections, and non-empty text nodes
      if (c.nodeType === 1) return true
      if (c.nodeType === 4) return true // CDATA
      if (c.nodeType === 3) {
        const t = c.textContent || ''
        return t.trim().length > 0
      }
      return false
    })

    if (children.length === 0) {
      // Empty element → empty string value (or keep as empty object)
      // If only attributes, return obj as-is
      if (Object.keys(obj).length === 0) {
        return ''
      }
      return obj
    }

    // If only one text/CDATA child, set _text
    if (children.length === 1 && (children[0].nodeType === 3 || children[0].nodeType === 4)) {
      const textVal = children[0].textContent || ''
      if (Object.keys(obj).length === 0) {
        return textVal
      }
      obj['_text'] = textVal
      return obj
    }

    // Group children by tag name for array detection
    const childMap = {}
    for (const child of children) {
      if (child.nodeType === 1) {
        const tag = child.nodeName
        if (!childMap[tag]) childMap[tag] = []
        childMap[tag].push(child)
      }
    }

    // Add child elements to object
    for (const child of children) {
      if (child.nodeType === 1) {
        const tag = child.nodeName
        const siblings = childMap[tag]
        const converted = nodeToJson(child)

        if (detectArrays.value && siblings.length > 1) {
          // This tag appears multiple times → use array
          if (!obj[tag]) {
            obj[tag] = siblings.map(c => nodeToJson(c))
            // Mark as processed so we don't add again
            childMap[tag] = null
          }
          // Skip if already processed as array
          if (childMap[tag] === null) continue
        }

        obj[tag] = converted
      } else if (child.nodeType === 3) {
        // Mixed text + elements — rare but handle it
        const t = child.textContent || ''
        if (t.trim()) {
          obj['_text'] = (obj['_text'] || '') + t
        }
      } else if (child.nodeType === 4) {
        obj['_cdata'] = child.textContent || ''
      }
    }

    return obj
  }

  return ''
}

// ─── JSON → XML ───────────────────────────────────────────

function jsonToXml(jsonString, customRoot) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch (e) {
    throw new Error('JSON 解析失败：' + e.message)
  }

  if (typeof data !== 'object' || data === null) {
    // Wrap scalar in an object
    data = { [customRoot || 'root']: data }
  }

  // If root is an object with a single key, use that as root
  const keys = Object.keys(data)
  let rootTag, rootContent

  if (keys.length === 1) {
    rootTag = customRoot || keys[0]
    rootContent = data[keys[0]]
  } else {
    rootTag = customRoot || 'root'
    rootContent = data
  }

  const xmlParts = []
  xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>')
  xmlParts.push(jsonNodeToXml(rootTag, rootContent, 0))
  return xmlParts.join('\n')
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function jsonNodeToXml(tagName, value, indent) {
  const pad = '  '.repeat(indent)

  if (value === null || value === undefined) {
    return pad + '<' + tagName + ' />'
  }

  if (typeof value === 'string') {
    return pad + '<' + tagName + '>' + escapeXml(value) + '</' + tagName + '>'
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return pad + '<' + tagName + '>' + String(value) + '</' + tagName + '>'
  }

  if (Array.isArray(value)) {
    const lines = []
    for (const item of value) {
      lines.push(jsonNodeToXml(tagName, item, indent))
    }
    return lines.join('\n')
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return pad + '<' + tagName + ' />'
    }

    // Separate attributes (@ prefix), text content (_text/_cdata), and child elements
    const attrs = []
    const children = []
    const childTags = [] // child element tags
    let textContent = null
    let cdataContent = null

    for (const key of keys) {
      const val = value[key]
      if (key === '_text' || key === '#text') {
        textContent = String(val)
      } else if (key === '_cdata') {
        cdataContent = String(val)
      } else if (key.startsWith('@')) {
        attrs.push({ name: key.slice(1), value: String(val) })
      } else {
        children.push({ tag: key, value: val })
        childTags.push(key)
      }
    }

    // Build opening tag
    let openTag = '<' + tagName
    for (const attr of attrs) {
      openTag += ' ' + attr.name + '="' + escapeXml(attr.value) + '"'
    }

    // If we have only attributes (no children, no text)
    if (children.length === 0 && textContent === null && cdataContent === null) {
      return pad + openTag + ' />'
    }

    openTag += '>'
    const closeTag = '</' + tagName + '>'

    // Text-only content
    if (children.length === 0) {
      let inner = textContent !== null ? escapeXml(textContent) : ''
      if (cdataContent !== null) {
        inner += '<![CDATA[' + cdataContent + ']]>'
      }
      return pad + openTag + inner + closeTag
    }

    // Mixed or element-only content
    const lines = [pad + openTag]
    if (textContent !== null) {
      lines.push('  '.repeat(indent + 1) + escapeXml(textContent))
    }
    if (cdataContent !== null) {
      lines.push('  '.repeat(indent + 1) + '<![CDATA[' + cdataContent + ']]>')
    }
    for (const child of children) {
      lines.push(jsonNodeToXml(child.tag, child.value, indent + 1))
    }
    lines.push(pad + closeTag)
    return lines.join('\n')
  }

  // Fallback
  return pad + '<' + tagName + '>' + escapeXml(String(value)) + '</' + tagName + '>'
}

// ─── Actions ──────────────────────────────────────────────

function convert() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入内容'
    return
  }

  try {
    if (direction.value === 'xml2json') {
      const json = xmlToJson(input.value)
      output.value = JSON.stringify(json, null, 2)
    } else {
      output.value = jsonToXml(input.value, rootName.value.trim() || 'root')
    }
    success.value = '转换完成'
  } catch (e) {
    error.value = e.message
    output.value = ''
  }
}

async function copyOutput() {
  if (!output.value) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => {
      if (success.value === '已复制到剪贴板') success.value = ''
    }, 2000)
  }
}
</script>

<style scoped>
.direction-bar {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
}

.direction-btn {
  padding: 6px 18px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  border-radius: 0;
}

.direction-btn:first-child {
  border-right: none;
}

.direction-btn.active {
  background: var(--green);
  color: var(--bg);
  border-color: var(--green);
}

.options-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.inline-label {
  font-size: 12px;
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  color: var(--muted);
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .direction-btn {
    padding: 4px 12px;
    font-size: 12px;
  }

  .options-row {
    gap: 10px;
  }
}
</style>
