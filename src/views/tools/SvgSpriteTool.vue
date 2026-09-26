<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧩 SVG 精灵图生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左栏：上传 / 输入 -->
          <div class="tool-col">
            <div class="upload-area"
              :class="{ 'upload-dragover': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".svg,image/svg+xml"
                multiple
                style="display: none"
                @change="handleFileInput"
              />
              <div class="upload-content">
                <span class="upload-icon">🧩</span>
                <span class="upload-text">点击或拖拽上传 SVG 文件</span>
                <span class="upload-hint">支持多选 · 单个文件 ≤ 2MB</span>
              </div>
            </div>

            <div class="label-row">
              <label class="tool-label">粘贴 SVG 代码：</label>
              <button class="mini-copy" :disabled="!pasteInput.trim()" @click="copyText(pasteInput, '已复制粘贴内容')" title="复制">📋 复制</button>
            </div>
            <textarea
              class="code-input paste-input"
              v-model="pasteInput"
              rows="6"
              placeholder="粘贴 SVG 源码，然后点击下方「添加为图标」&#10;例如：&lt;svg viewBox=&quot;0 0 24 24&quot;&gt;&lt;path d=&quot;...&quot;/&gt;&lt;/svg&gt;"
            ></textarea>

            <div class="button-group button-group-3 compact">
              <button class="tool-button primary" :disabled="!pasteInput.trim()" @click="addFromPaste">
                ➕ 添加为图标
              </button>
              <button class="tool-button" @click="loadSample">✨ 载入示例</button>
              <button class="tool-button danger" :disabled="!icons.length" @click="clearAll">
                🗑️ 清空
              </button>
            </div>

            <!-- 生成选项 -->
            <label class="tool-label">生成选项：</label>
            <div class="opt-row">
              <span class="opt-name">ID 前缀</span>
              <input class="code-input-sm" v-model="opts.prefix" placeholder="icon-" />
            </div>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.prefixIds" />
                <span>内部 ID 加前缀（防冲突）</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.currentColor" />
                <span>填充色改为 currentColor</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="opts.sort" />
                <span>按名称排序</span>
              </label>
            </div>

            <div class="hint-line">
              已加载 {{ icons.length }} 个图标<span v-if="dupCount">，自动去重 {{ dupCount }} 个</span>
            </div>
          </div>

          <!-- 右栏：Sprite 输出 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">Sprite 代码：</label>
              <button class="mini-copy" :disabled="!spriteCode" @click="copyText(spriteCode, '已复制 Sprite 代码')" title="复制">📋 复制</button>
            </div>
            <textarea
              class="code-input output"
              :value="spriteCode"
              readonly
              rows="16"
              placeholder="上传或粘贴 SVG 后，这里会生成 <symbol> 形式的 Sprite 代码..."
            ></textarea>

            <div class="stats-section" v-if="icons.length">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">图标数量</span>
                  <span class="stat-value">{{ icons.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">去重移除</span>
                  <span class="stat-value">{{ dupCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">原始大小</span>
                  <span class="stat-value">{{ formatSize(rawSize) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Sprite 大小</span>
                  <span class="stat-value">{{ formatSize(spriteCode.length) }}</span>
                </div>
              </div>
            </div>

            <div v-if="spriteCode" class="usage-tip">
              <span class="usage-tip-title">用法：</span>
              <code class="usage-code">&lt;svg class="icon"&gt;&lt;use href="#{{ firstId }}"&gt;&lt;/use&gt;&lt;/svg&gt;</code>
            </div>
          </div>
        </div>

        <!-- 按钮组（全宽） -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" :disabled="!spriteCode" @click="copyText(spriteCode, '已复制 Sprite 代码')">
            📋 复制 Sprite
          </button>
          <button class="tool-button" :disabled="!spriteCode" @click="downloadSprite">
            ⬇️ 下载 sprite.svg
          </button>
          <button class="tool-button" :disabled="!icons.length" @click="copyAllUse">
            🔗 复制全部引用
          </button>
        </div>

        <!-- 图标预览网格（全宽） -->
        <div v-if="icons.length" class="preview-section">
          <label class="tool-label">图标预览（{{ orderedIcons.length }} 个）：</label>
          <div class="icon-grid">
            <div v-for="ic in orderedIcons" :key="ic.uid" class="icon-card">
              <div class="icon-preview">
                <svg
                  class="icon-svg"
                  :viewBox="ic.viewBox"
                  v-bind="tintAttrs(ic.rootAttrs)"
                  v-svg-inner="previewInner(ic)"
                ></svg>
              </div>
              <input
                class="code-input-sm icon-id"
                v-model="ic.base"
                @change="normalizeBase(ic)"
                title="点击可重命名"
              />
              <div class="icon-meta">{{ formatSize(ic.size) }}</div>
              <div class="icon-actions">
                <button class="icon-btn" @click="copyUse(ic)" title="复制 use 引用">🔗</button>
                <button class="icon-btn danger" @click="removeIcon(ic.uid)" title="移除">✕</button>
              </div>
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

const icons = ref([])
const pasteInput = ref('')
const dragOver = ref(false)
const error = ref('')
const success = ref('')
const dupCount = ref(0)
const fileInput = ref(null)

const opts = ref({
  prefix: 'icon-',
  prefixIds: true,
  currentColor: true,
  sort: true
})

let uidSeq = 0

/* ---------- 工具函数 ---------- */

/**
 * 把 SVG 片段安全地注入 <svg> 元素（用 DOMParser 保证命名空间正确，跨浏览器可靠）
 */
const vSvgInner = {
  mounted(el, binding) {
    renderSvgInner(el, binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) renderSvgInner(el, binding.value)
  },
  beforeUnmount(el) {
    el.textContent = ''
  }
}

function renderSvgInner(el, html) {
  while (el.firstChild) el.removeChild(el.firstChild)
  if (!html) return
  const doc = new DOMParser().parseFromString(
    '<svg xmlns="http://www.w3.org/2000/svg">' + html + '</svg>',
    'image/svg+xml'
  )
  if (doc.getElementsByTagName('parsererror').length) return
  Array.from(doc.documentElement.childNodes).forEach(node => {
    try {
      el.appendChild(document.importNode(node, true))
    } catch {
      /* 忽略无法导入的节点 */
    }
  })
}

function slugify(name) {
  const s = String(name || '')
    .replace(/\.svg$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
  return s || 'icon'
}

function uniqueBase(base, selfUid) {
  const taken = new Set(
    icons.value.filter(i => i.uid !== selfUid).map(i => slug(iconId(i)))
  )
  let candidate = base
  let n = 2
  while (taken.has(slug((opts.value.prefix || '') + candidate))) candidate = base + '-' + n++
  return candidate
}

function slug(s) {
  return String(s || '').trim().toLowerCase()
}

function iconId(ic) {
  return (opts.value.prefix || '') + ic.base
}

function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(2) + ' MB'
}

function flashSuccess(msg) {
  success.value = msg
  error.value = ''
  setTimeout(() => {
    if (success.value === msg) success.value = ''
  }, 2000)
}

function flashError(msg) {
  error.value = msg
  success.value = ''
}

function deriveViewBox(root) {
  const vb = root.getAttribute('viewBox')
  if (vb && vb.trim()) return vb.trim()
  const w = parseFloat(root.getAttribute('width'))
  const h = parseFloat(root.getAttribute('height'))
  if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return `0 0 ${w} ${h}`
  return '0 0 24 24'
}

// 会被 <symbol> 继承的根节点表现属性（丢失会导致描边图标变实心）
const PRESENT_ATTRS = [
  'fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
  'paint-order', 'shape-rendering', 'opacity', 'color', 'style',
  'font-family', 'font-size', 'font-weight', 'font-style'
]

function extractRootAttrs(root) {
  const attrs = {}
  PRESENT_ATTRS.forEach(name => {
    if (root.hasAttribute(name)) attrs[name] = root.getAttribute(name)
  })
  const hasPaint =
    root.hasAttribute('fill') || root.hasAttribute('stroke') ||
    !!root.querySelector('[fill],[stroke]')
  if (!hasPaint) attrs.fill = 'currentColor'
  return attrs
}

/**
 * 根据「填充色改为 currentColor」选项重写根节点表现属性
 */
function tintAttrs(attrs) {
  const out = { ...(attrs || {}) }
  if (!opts.value.currentColor) return out
  ;['fill', 'stroke'].forEach(name => {
    if (out[name] === undefined) return
    const v = String(out[name]).trim()
    if (!v || v === 'none' || v === 'currentColor' || v === 'transparent') return
    if (/^url\(/i.test(v)) return
    out[name] = 'currentColor'
  })
  if (out.style) {
    out.style = String(out.style).replace(
      /(fill|stroke)\s*:\s*(?!none|currentColor|transparent|url\()([^;]+)/gi,
      '$1:currentColor'
    )
  }
  return out
}

function attrString(attrs) {
  return Object.entries(attrs || {})
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ')
}

// XMLSerializer 序列化子节点时会重复补上命名空间声明，去掉冗余部分
function cleanSerialized(str) {
  let out = String(str)
    .replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')
    .replace(/\sxmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/g, '')
  // 去掉未被使用的其他命名空间前缀声明（如 ns1:）
  out = out.replace(/\sxmlns:([\w.-]+)="http:\/\/www\.w3\.org\/1999\/xlink"/g, (m, p) =>
    new RegExp('[\\s<]' + p + ':').test(out) ? m : ''
  )
  return out.trim()
}

/**
 * 解析 XML，对缺少 xmlns / xmlns:xlink 声明的 SVG 做一次容错重试
 */
function parseXml(text) {
  let doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  if (!doc.getElementsByTagName('parsererror').length) return doc
  const additions = []
  if (!/xmlns:xlink\s*=/.test(text)) additions.push('xmlns:xlink="http://www.w3.org/1999/xlink"')
  if (!/xmlns\s*=/.test(text)) additions.push('xmlns="http://www.w3.org/2000/svg"')
  if (additions.length) {
    const patched = text.replace(/<svg\b/i, m => m + ' ' + additions.join(' '))
    const retry = new DOMParser().parseFromString(patched, 'image/svg+xml')
    if (!retry.getElementsByTagName('parsererror').length) return retry
    doc = retry
  }
  return doc
}

/**
 * 解析 SVG 文本，返回 { base 建议名, viewBox, raw }
 */
function parseSvgText(text, filename) {
  const doc = parseXml(text)
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('XML 语法错误，无法解析')
  }
  const root = doc.documentElement
  if (!root || String(root.localName).toLowerCase() !== 'svg') {
    throw new Error('根元素不是 <svg>')
  }
  const viewBox = deriveViewBox(root)
  const parts = []
  root.childNodes.forEach(node => {
    if (node.nodeType === 8 || node.nodeType === 7) return
    if (node.nodeType === 3 && !node.textContent.trim()) return
    try {
      parts.push(cleanSerialized(new XMLSerializer().serializeToString(node)))
    } catch {
      /* 忽略无法序列化的节点 */
    }
  })
  const raw = parts.join('\n')
  if (!raw.trim()) throw new Error('SVG 内容为空')
  return { base: slugify(filename), viewBox, raw, rootAttrs: extractRootAttrs(root) }
}

function addIcon(parsed, sourceName) {
  const fingerprint =
    (
      parsed.raw.replace(/\s+/g, ' ').trim() +
      '|' + parsed.viewBox +
      '|' + JSON.stringify(parsed.rootAttrs || {})
    ).toLowerCase()
  const exists = icons.value.some(i => i.fingerprint === fingerprint)
  if (exists) {
    dupCount.value += 1
    return false
  }
  icons.value.push({
    uid: ++uidSeq,
    base: uniqueBase(parsed.base || slugify(sourceName)),
    viewBox: parsed.viewBox,
    raw: parsed.raw,
    rootAttrs: parsed.rootAttrs || {},
    size: parsed.raw.length,
    fingerprint
  })
  return true
}

/* ---------- 文件 / 粘贴 / 示例 ---------- */

function handleFileInput(e) {
  const files = Array.from(e.target.files || [])
  if (files.length) readFiles(files)
  e.target.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length) readFiles(files)
}

async function readFiles(files) {
  error.value = ''
  if (!files.length) {
    flashError('请选择 .svg 文件')
    return
  }
  let added = 0
  const failed = []
  for (const file of files) {
    const isSvg =
      /\.svg$/i.test(file.name) || file.type === 'image/svg+xml' || file.type === 'text/xml'
    if (!isSvg) {
      failed.push(file.name + '（不是 SVG 文件）')
      continue
    }
    if (file.size > 2 * 1024 * 1024) {
      failed.push(file.name + '（超过 2MB）')
      continue
    }
    try {
      const text = await readFileAsText(file)
      const parsed = parseSvgText(text, file.name)
      if (addIcon(parsed, file.name)) added += 1
    } catch (err) {
      failed.push(file.name + '（' + err.message + '）')
    }
  }
  if (added) flashSuccess(`已添加 ${added} 个图标`)
  if (failed.length) flashError('以下文件跳过：' + failed.join('；'))
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(String(e.target.result || ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

function addFromPaste() {
  error.value = ''
  const text = pasteInput.value.trim()
  if (!text) return
  try {
    const name = guessNameFromSvg(text)
    const parsed = parseSvgText(text, name)
    if (addIcon(parsed, name)) {
      pasteInput.value = ''
      flashSuccess('已添加 1 个图标')
    } else {
      flashError('该 SVG 与已有图标重复，已自动跳过')
    }
  } catch (err) {
    flashError('解析失败：' + err.message)
  }
}

function guessNameFromSvg(text) {
  const m = text.match(/<svg[^>]*\sid\s*=\s*["']([^"']+)["']/i)
  if (m && m[1]) return m[1]
  const t = text.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (t && t[1]) return t[1]
  return 'icon-' + (icons.value.length + 1)
}

function loadSample() {
  error.value = ''
  const samples = [
    {
      name: 'check',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#9dff6b" stroke-width="2" stroke-linecap="round"><path d="M4 12.5 9.5 18 20 6"/></svg>'
    },
    {
      name: 'heart',
      svg: '<svg viewBox="0 0 24 24" fill="#ff5577"><path d="M12 21s-7.5-4.7-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9z"/></svg>'
    },
    {
      name: 'star',
      svg: '<svg viewBox="0 0 24 24" fill="#9dff6b"><path d="M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8 5.7 21.1 6.9 14.2 2 9.3l7-1z"/></svg>'
    }
  ]
  let added = 0
  samples.forEach(s => {
    try {
      const parsed = parseSvgText(s.svg, s.name)
      if (addIcon(parsed, s.name)) added += 1
    } catch {
      /* 忽略 */
    }
  })
  if (added) flashSuccess(`已载入 ${added} 个示例图标`)
  else flashError('示例图标已存在')
}

/* ---------- 图标处理 ---------- */

const rawSize = computed(() => icons.value.reduce((sum, i) => sum + i.size, 0))

const orderedIcons = computed(() => {
  const list = [...icons.value]
  if (opts.value.sort) list.sort((a, b) => a.base.localeCompare(b.base))
  return list
})

const firstId = computed(() => (orderedIcons.value[0] ? iconId(orderedIcons.value[0]) : ''))

function normalizeBase(ic) {
  ic.base = uniqueBase(slugify(ic.base), ic.uid)
}

/**
 * 对 symbol 内容做内部 ID 前缀化 + currentColor 化，返回顶层节点字符串数组
 */
function transformInner(raw, symbolId) {
  const wrapped =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
    raw +
    '</svg>'
  const doc = new DOMParser().parseFromString(wrapped, 'image/svg+xml')
  if (doc.getElementsByTagName('parsererror').length) return [raw.trim()]
  const root = doc.documentElement

  // 1) 内部 ID 加前缀，并同步更新引用
  const idMap = new Map()
  if (opts.value.prefixIds) {
    root.querySelectorAll('[id]').forEach(el => {
      const old = el.getAttribute('id')
      if (!old) return
      const next = symbolId + '-' + old
      idMap.set(old, next)
      el.setAttribute('id', next)
    })
  }

  // 更新 url(#id) 与 href 引用；顺便把 xlink:href 归一化为 href（SVG2，避免命名空间前缀差异）
  root.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      const val = attr.value
      if (!val) return
      let next = val
      if (val.indexOf('#') !== -1) {
        next = val.replace(/url\(\s*#([^)\s"']+)\s*\)/g, (m, id) =>
          idMap.has(id) ? 'url(#' + idMap.get(id) + ')' : m
        )
        if (attr.localName === 'href' && /^#/.test(next)) {
          const id = next.slice(1)
          if (idMap.has(id)) next = '#' + idMap.get(id)
        }
      }
      if (attr.localName === 'href' && attr.prefix) {
        // xlink:href → href
        el.removeAttributeNS(attr.namespaceURI, attr.localName)
        el.setAttribute('href', next)
        return
      }
      if (next !== val) {
        if (attr.namespaceURI) el.setAttributeNS(attr.namespaceURI, attr.name, next)
        else el.setAttribute(attr.name, next)
      }
    })
  })

  // 2) 硬编码填充/描边色统一为 currentColor
  if (opts.value.currentColor) {
    root.querySelectorAll('*').forEach(el => {
      ;['fill', 'stroke'].forEach(name => {
        if (!el.hasAttribute(name)) return
        const v = (el.getAttribute(name) || '').trim()
        if (!v || v === 'none' || v === 'currentColor' || v === 'transparent') return
        if (/^url\(/i.test(v)) return
        el.setAttribute(name, 'currentColor')
      })
      if (el.hasAttribute('style')) {
        const style = el.getAttribute('style') || ''
        const next = style.replace(
          /(fill|stroke)\s*:\s*(?!none|currentColor|transparent|url\()([^;]+)/gi,
          '$1:currentColor'
        )
        if (next !== style) el.setAttribute('style', next)
      }
    })
  }

  const out = []
  root.childNodes.forEach(node => {
    if (node.nodeType === 8 || node.nodeType === 7) return
    if (node.nodeType === 3 && !node.textContent.trim()) return
    try {
      out.push(cleanSerialized(new XMLSerializer().serializeToString(node)))
    } catch {
      /* 忽略 */
    }
  })
  return out.length ? out : [raw.trim()]
}

const spriteCode = computed(() => {
  const list = orderedIcons.value
  if (!list.length) return ''
  const lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none" aria-hidden="true">'
  ]
  list.forEach(ic => {
    const id = iconId(ic)
    const attrs = attrString(tintAttrs(ic.rootAttrs))
    lines.push(`  <symbol id="${id}" viewBox="${ic.viewBox}"${attrs ? ' ' + attrs : ''}>`)
    transformInner(ic.raw, id).forEach(part => {
      part.split('\n').forEach(sub => lines.push('    ' + sub.trim()))
    })
    lines.push('  </symbol>')
  })
  lines.push('</svg>')
  return lines.join('\n')
})

// 预览内容：同样做 ID 前缀化 + currentColor 化，避免多图标内部 ID 冲突
function previewInner(ic) {
  return transformInner(ic.raw, iconId(ic)).join('\n')
}

/* ---------- 操作 ---------- */

function removeIcon(uid) {
  icons.value = icons.value.filter(i => i.uid !== uid)
}

function clearAll() {
  icons.value = []
  pasteInput.value = ''
  dupCount.value = 0
  error.value = ''
  success.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function useSnippet(ic) {
  return `<svg class="icon"><use href="#${iconId(ic)}"></use></svg>`
}

async function copyUse(ic) {
  await copyText(useSnippet(ic), `已复制引用：#${iconId(ic)}`)
}

async function copyAllUse() {
  const all = orderedIcons.value.map(ic => useSnippet(ic)).join('\n')
  await copyText(all, `已复制全部 ${orderedIcons.value.length} 条引用`)
}

async function copyText(text, msg) {
  if (!text) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    flashSuccess(msg || '已复制到剪贴板')
  } catch {
    flashError('复制失败，请手动选择文本复制')
  }
}

function downloadSprite() {
  try {
    const blob = new Blob([spriteCode.value], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sprite.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    flashSuccess('已导出 sprite.svg')
  } catch {
    flashError('导出失败，请重试')
  }
}
</script>

<style scoped>
/* --- 上传区 --- */
.upload-area {
  border: 2px dashed var(--line);
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
  margin-bottom: 4px;
}

.upload-area:hover,
.upload-area.upload-dragover {
  border-color: var(--green);
  background: var(--green-soft);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2rem;
}

.upload-text {
  color: var(--text);
  font-size: 14px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
}

/* --- 标签行 + 迷你复制按钮 --- */
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.label-row .tool-label {
  margin-bottom: 0;
}

.mini-copy {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  font-family: var(--mono);
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mini-copy:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}

.mini-copy:disabled {
  color: var(--muted);
  cursor: not-allowed;
  opacity: 0.5;
}

.paste-input {
  min-height: 110px;
}

.button-group.compact {
  margin-top: 0;
}

/* --- 选项 --- */
.opt-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.opt-name {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  white-space: nowrap;
}

.opt-row .code-input-sm {
  flex: 1;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-line {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  margin-top: 4px;
}

/* --- 统计 --- */
.stats-section {
  margin-top: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 8px 10px;
}

.stat-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
}

.stat-value {
  color: var(--green);
  font-family: var(--mono);
  font-size: 14px;
}

/* --- 用法提示 --- */
.usage-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border-left: 2px solid var(--green);
  background: var(--green-soft);
  padding: 8px 10px;
  margin-top: 4px;
}

.usage-tip-title {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
}

.usage-code {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  word-break: break-all;
}

/* --- 预览网格 --- */
.preview-section {
  margin-top: 16px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
}

.icon-card {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s;
}

.icon-card:hover {
  border-color: var(--green);
}

.icon-preview {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--green);
  overflow: hidden;
}

.icon-svg {
  width: 40px;
  height: 40px;
  color: var(--green);
}

.icon-id {
  width: 100%;
  font-size: 11px;
  height: 28px;
  padding: 0 6px;
}

.icon-meta {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 10px;
  display: flex;
  justify-content: space-between;
}

.icon-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  flex: 1;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  padding: 3px 0;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
}

.icon-btn.danger {
  color: var(--red, #ff5577);
}

.icon-btn.danger:hover {
  border-color: var(--red, #ff5577);
  background: rgba(255, 85, 119, 0.1);
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1rem 0.5rem;
  }

  .upload-text {
    font-size: 12px;
  }

  .icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }
}
</style>
