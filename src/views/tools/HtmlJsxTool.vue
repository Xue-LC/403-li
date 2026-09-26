<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⚛️ HTML → JSX 转换器</span>
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
            <label class="tool-label">JSX 输出：</label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="convert" :disabled="!input.trim()">
            ⚡ 转换
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clearAll" :disabled="!input && !output">
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

// DOM attributes that map to different JSX names
const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  accesskey: 'accessKey',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  charset: 'charSet',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  contextmenu: 'contextMenu',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  frameborder: 'frameBorder',
  hreflang: 'hrefLang',
  httpEquiv: 'httpEquiv',
  inputmode: 'inputMode',
  marginheight: 'marginHeight',
  marginwidth: 'marginWidth',
  maxlength: 'maxLength',
  mediagroup: 'mediaGroup',
  minlength: 'minLength',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  spellcheck: 'spellCheck',
  srcdoc: 'srcDoc',
  srclang: 'srcLang',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  allowfullscreen: 'allowFullScreen'
}

// Self-closing (void) elements in HTML
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
])

// Boolean HTML attributes (in JSX, use value or omit)
const BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'selected', 'readonly', 'multiple',
  'required', 'autofocus', 'autoplay', 'controls', 'loop',
  'muted', 'default', 'hidden', 'ismap', 'itemscope',
  'novalidate', 'open', 'playsinline', 'reversed', 'async',
  'defer', 'nomodule', 'defaultChecked', 'defaultValue'
])

// Known event attribute prefixes
const EVENT_PREFIXES = ['on']

function jsxAttrName(name) {
  const lower = name.toLowerCase()
  // Check direct map first
  if (ATTR_MAP[lower] !== undefined) {
    return ATTR_MAP[lower]
  }
  // Handle data-* and aria-* attributes (keep as-is)
  if (lower.startsWith('data-') || lower.startsWith('aria-')) {
    return lower
  }
  // Handle event handlers: onclick → onClick, onchange → onChange, etc.
  if (lower.startsWith('on')) {
    const eventName = lower.slice(2)
    // Skip if it's a regular word starting with "on" like "online", "only"
    const commonEvents = [
      'click', 'change', 'input', 'submit', 'focus', 'blur', 'keydown', 'keyup', 'keypress',
      'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'mouseup',
      'dblclick', 'contextmenu', 'wheel', 'scroll', 'resize', 'load', 'error', 'abort',
      'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop',
      'touchstart', 'touchend', 'touchmove', 'touchcancel',
      'animationstart', 'animationend', 'animationiteration',
      'transitionend', 'transitionstart',
      'copy', 'cut', 'paste', 'select',
      'pointerdown', 'pointerup', 'pointermove', 'pointerenter', 'pointerleave',
      'compositionstart', 'compositionend', 'compositionupdate',
      'reset', 'invalid', 'toggle', 'beforeinput', 'search'
    ]
    if (commonEvents.includes(eventName)) {
      return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)
    }
  }
  return lower
}

function parseStyleString(styleStr) {
  if (!styleStr || !styleStr.trim()) return null
  const rules = styleStr.split(';').filter(s => s.trim())
  if (rules.length === 0) return null

  const props = rules.map(rule => {
    const colonIdx = rule.indexOf(':')
    if (colonIdx === -1) return null
    let key = rule.slice(0, colonIdx).trim()
    const value = rule.slice(colonIdx + 1).trim()
    if (!key || !value) return null
    // Convert CSS property to camelCase
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    return { key, value }
  }).filter(Boolean)

  if (props.length === 0) return null
  return props
}

function formatStyleObject(props) {
  // Try to fit on one line if short
  const singleLine = '{ ' + props.map(p => `${p.key}: '${p.value}'`).join(', ') + ' }'
  if (singleLine.length <= 80) return singleLine
  // Multi-line
  const indent = '          '
  return '{\n' + props.map(p => `${indent}${p.key}: '${p.value}'`).join(',\n') + '\n        }'
}

function escapeJsxText(text) {
  // Wrap entire text in expression if it contains { or }
  if (!text.includes('{') && !text.includes('}')) return text
  return `{'${text}'}`
}

function formatAttrValue(value) {
  // Check if value can be unquoted (numbers, booleans, expressions)
  if (!value) return '""'
  // Escape double quotes in value
  const escaped = value.replace(/"/g, '&quot;')
  return `"${escaped}"`
}

function nodeToJsx(node, indent = 0) {
  const pad = '  '.repeat(indent)

  if (node.nodeType === 3) {
    // Text node
    const text = node.textContent
    if (!text || /^\s*$/.test(text)) {
      // Whitespace-only: preserve single space if between inline elements
      if (text.length > 0 && text.trim().length === 0) return text.length > 1 ? ' ' : text
      return ''
    }
    return escapeJsxText(text.trim())
  }

  if (node.nodeType === 8) {
    // Comment node → JSX comment
    const comment = node.textContent.trim()
    if (!comment) return ''
    return `{/* ${comment} */}`
  }

  if (node.nodeType !== 1) return ''

  // Element node
  const tagName = node.tagName ? node.tagName.toLowerCase() : ''

  // Collect attributes
  const attrs = []
  const styleProps = null

  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i]
      const jsxName = jsxAttrName(attr.name)
      let attrValue = attr.value || ''

      if (jsxName === 'style') {
        // Parse style string → object (handled below)
        continue
      }

      if (BOOLEAN_ATTRS.has(jsxName) || BOOLEAN_ATTRS.has(attr.name.toLowerCase())) {
        // Boolean attributes: in JSX you can use {true} or just the attribute name
        if (attrValue === '' || attrValue === attr.name || attrValue === 'true') {
          attrs.push(jsxName)
        } else {
          attrs.push(`${jsxName}={${attrValue}}`)
        }
      } else if (/^on[A-Z]/.test(jsxName)) {
        // Event handlers - wrap in function expression placeholder
        attrs.push(`${jsxName}={handle${jsxName.slice(2)}}`)
      } else {
        // Regular attributes
        attrs.push(`${jsxName}=${formatAttrValue(attrValue)}`)
      }
    }

    // Handle style separately
    const styleAttr = node.getAttribute('style')
    if (styleAttr) {
      const parsed = parseStyleString(styleAttr)
      if (parsed) {
        attrs.push(`style=${formatStyleObject(parsed)}`)
      } else {
        attrs.push(`style="${styleAttr}"`)
      }
    }
  }

  // Get children
  const children = []
  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const childJsx = nodeToJsx(node.childNodes[i], indent + 1)
      if (childJsx) children.push(childJsx)
    }
  }

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

  // Self-closing tags
  if (VOID_ELEMENTS.has(tagName)) {
    if (tagName === 'br' && indent > 0) {
      return `<br />`
    }
    return `<${tagName}${attrStr} />`
  }

  // No children
  if (children.length === 0) {
    return `<${tagName}${attrStr}></${tagName}>`
  }

  // Single text child — inline
  if (children.length === 1 && !children[0].includes('\n') && !children[0].includes('<') && children[0].length < 60) {
    return `<${tagName}${attrStr}>${children[0]}</${tagName}>`
  }

  // Multi-line children
  const childLines = children.join('\n')
  return `<${tagName}${attrStr}>\n${childLines}\n${pad}</${tagName}>`
}

function convert() {
  error.value = ''
  success.value = ''

  const html = input.value.trim()
  if (!html) {
    error.value = '请输入 HTML 代码'
    return
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Check for parser errors
    const parseErrorNode = doc.querySelector('parsererror')
    if (parseErrorNode) {
      error.value = 'HTML 解析失败，请检查输入内容'
      return
    }

    // Get the body content
    const body = doc.body
    if (!body || body.childNodes.length === 0) {
      output.value = ''
      error.value = '未能解析到 HTML 内容'
      return
    }

    // Convert each child node
    const parts = []
    for (let i = 0; i < body.childNodes.length; i++) {
      const jsx = nodeToJsx(body.childNodes[i], 0)
      if (jsx.trim()) parts.push(jsx)
    }

    if (parts.length === 0) {
      output.value = ''
      error.value = '未能提取到有效的 JSX 内容'
      return
    }

    const result = parts.join('\n')
    output.value = result

    // Stats
    const inputSize = html.length
    const outputSize = result.length
    success.value = `转换完成！输入 ${formatSize(inputSize)} → 输出 ${formatSize(outputSize)}`
  } catch (e) {
    error.value = `转换失败：${e.message}`
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}

function copyOutput() {
  if (!output.value.trim()) {
    error.value = '没有可复制的内容'
    return
  }
  copyText(output.value)
  success.value = '已复制到剪贴板！'
}

function clearAll() {
  input.value = ''
  output.value = ''
  clearStatus()
}

function clearStatus() {
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* Only tool-specific styles beyond tools.css */
</style>
