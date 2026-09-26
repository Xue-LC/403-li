<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📸 代码截图生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- ============ 左栏：代码输入 + 基础参数 ============ -->
          <div class="tool-col">
            <label class="tool-label">代码输入：</label>
            <div
              class="upload-area"
              :class="{ 'drag-over': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".js,.ts,.jsx,.tsx,.vue,.html,.htm,.css,.scss,.json,.py,.java,.go,.rs,.php,.rb,.c,.h,.cpp,.cc,.cxx,.hpp,.sh,.sql,.yml,.yaml,.md,.txt,.toml,.ini,.conf"
                style="display: none"
                @change="handleFileChange"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传代码文件</span>
                <span class="upload-hint">JS / TS / VUE / PY / GO / RS … · ≤ 512KB</span>
              </div>
            </div>

            <div class="input-with-copy">
              <textarea
                class="code-input"
                v-model="code"
                rows="14"
                spellcheck="false"
                placeholder="在这里粘贴代码，右侧实时生成截图预览…"
              ></textarea>
              <button class="copy-btn" title="复制代码" @click="copyCode">📋</button>
            </div>

            <label class="tool-label">语言：</label>
            <select class="tool-select" v-model="language">
              <option v-for="l in langOptions" :key="l.value" :value="l.value">{{ l.label }}</option>
            </select>

            <label class="tool-label">配色主题：</label>
            <div class="radio-group theme-group">
              <label v-for="t in themes" :key="t.key" class="radio-label">
                <input type="radio" v-model="themeKey" :value="t.key" />
                <span class="palette-name">
                  <span class="palette-dots">
                    <i v-for="(c, i) in t.swatch" :key="i" :style="{ backgroundColor: c }"></i>
                  </span>
                  {{ t.label }}
                </span>
              </label>
            </div>

            <label class="tool-label">字号：{{ fontSize }}px</label>
            <div class="slider-row">
              <input class="range-input" type="range" min="10" max="32" step="1" v-model.number="fontSize" />
              <span class="range-value">{{ fontSize }}px</span>
            </div>

            <label class="tool-label">行高：{{ lineHeight.toFixed(2) }}</label>
            <div class="slider-row">
              <input class="range-input" type="range" min="1.2" max="2.2" step="0.05" v-model.number="lineHeight" />
              <span class="range-value">{{ lineHeight.toFixed(2) }}</span>
            </div>

            <label class="tool-label">内边距：{{ padding }}px</label>
            <div class="slider-row">
              <input class="range-input" type="range" min="8" max="64" step="2" v-model.number="padding" />
              <span class="range-value">{{ padding }}px</span>
            </div>

            <label class="tool-label">画布留白：{{ margin }}px</label>
            <div class="slider-row">
              <input class="range-input" type="range" min="0" max="96" step="4" v-model.number="margin" />
              <span class="range-value">{{ margin }}px</span>
            </div>

            <label class="tool-label">字体：</label>
            <select class="tool-select" v-model="fontKey">
              <option v-for="f in fontOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <!-- ============ 右栏：实时预览 + 统计 ============ -->
          <div class="tool-col">
            <label class="tool-label">截图预览：</label>
            <div class="canvas-scroll">
              <div class="canvas-wrapper" :class="{ 'canvas-checker': bgMode === 'transparent' }">
                <canvas ref="canvasRef"></canvas>
                <button class="copy-btn canvas-copy" title="复制图片" @click="copyImage">📋</button>
              </div>
            </div>

            <div class="stats-section">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">总行数</span>
                  <span class="stat-value">{{ stats.lines }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">字符数</span>
                  <span class="stat-value">{{ stats.chars }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">语言</span>
                  <span class="stat-value">{{ stats.lang }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">图片尺寸</span>
                  <span class="stat-value">{{ stats.size }}</span>
                </div>
              </div>
            </div>

            <div v-if="warnMsg" class="status-warn">⚠️ {{ warnMsg }}</div>
            <div class="hint-text">
              💡 提示：开启「自动换行」可避免长行把图片撑得过宽；导出倍率越高越清晰，文件也越大。
            </div>
          </div>
        </div>

        <!-- ============ 全宽：外观与输出参数 ============ -->
        <div class="adv-grid">
          <div class="adv-item">
            <label class="tool-label">窗口样式：</label>
            <div class="radio-group">
              <label v-for="c in chromeOptions" :key="c.value" class="radio-label">
                <input type="radio" v-model="chrome" :value="c.value" />
                <span>{{ c.label }}</span>
              </label>
            </div>
          </div>

          <div class="adv-item">
            <label class="tool-label">窗口标题：</label>
            <input
              class="code-input-sm pm-fix"
              type="text"
              v-model="windowTitle"
              :disabled="chrome === 'none'"
              maxlength="48"
              placeholder="app.js"
            />
          </div>

          <div class="adv-item">
            <label class="tool-label">背景模式：</label>
            <div class="radio-group">
              <label v-for="b in bgOptions" :key="b.value" class="radio-label">
                <input type="radio" v-model="bgMode" :value="b.value" />
                <span>{{ b.label }}</span>
              </label>
            </div>
          </div>

          <div class="adv-item">
            <label class="tool-label">Tab 宽度：</label>
            <div class="radio-group">
              <label v-for="t in [2, 4, 8]" :key="t" class="radio-label">
                <input type="radio" v-model.number="tabWidth" :value="t" />
                <span>{{ t }} 空格</span>
              </label>
            </div>
          </div>

          <div class="adv-item">
            <label class="tool-label">导出倍率：</label>
            <div class="radio-group">
              <label v-for="s in [1, 2, 3]" :key="s" class="radio-label">
                <input type="radio" v-model.number="scale" :value="s" />
                <span>{{ s }}x</span>
              </label>
            </div>
          </div>

          <div class="adv-item">
            <label class="tool-label">显示选项：</label>
            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="showLineNumbers" />
                <span>行号</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="wrap" />
                <span>自动换行</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="showShadow" />
                <span>投影</span>
              </label>
            </div>
          </div>

          <div class="adv-item" v-if="wrap">
            <label class="tool-label">换行宽度：{{ wrapWidth }} 字符</label>
            <div class="slider-row">
              <input class="range-input" type="range" min="40" max="180" step="5" v-model.number="wrapWidth" />
              <span class="range-value">{{ wrapWidth }}</span>
            </div>
          </div>
        </div>

        <!-- ============ 操作按钮 ============ -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="copyImage">📋 复制图片</button>
          <button class="tool-button" @click="downloadPng">导出 PNG</button>
          <button class="tool-button" @click="loadSample">载入示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import java from 'highlight.js/lib/languages/java'
import golang from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import ini from 'highlight.js/lib/languages/ini'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import diff from 'highlight.js/lib/languages/diff'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import { copyText } from '../../utils/clipboard'

/* ================= highlight.js 注册 ================= */
const langMap = {
  javascript, typescript, xml, css, json, python, bash, sql, yaml,
  markdown, java, go: golang, rust, php, ruby, ini, dockerfile, diff, cpp, c
}
Object.entries(langMap).forEach(([name, mod]) => hljs.registerLanguage(name, mod))
const AUTO_SUBSET = Object.keys(langMap)

const langOptions = [
  { value: 'auto', label: '自动识别' },
  { value: 'plaintext', label: '纯文本' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'xml', label: 'HTML / XML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Shell / Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'ini', label: 'INI / TOML' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'diff', label: 'Diff' }
]

const fontOptions = [
  { value: 'maple', label: 'Maple Mono NF CN（项目等宽）' },
  { value: 'monaco', label: 'Monaco' },
  { value: 'consolas', label: 'Consolas' },
  { value: 'courier', label: 'Courier New' }
]
const FONT_MAP = {
  maple: "'Maple Mono NF CN', 'Monaco', 'Consolas', monospace",
  monaco: "'Monaco', 'Maple Mono NF CN', 'Consolas', monospace",
  consolas: "'Consolas', 'Maple Mono NF CN', 'Monaco', monospace",
  courier: "'Courier New', 'Maple Mono NF CN', monospace"
}

/* ================= 主题（全部为站点暖色系，无蓝紫） ================= */
const themes = [
  {
    key: 'neon', label: '荧光绿', swatch: ['#0b1410', '#9dff6b', '#ffd866'],
    outer: '#08110c', g1: '#0d1f14', g2: '#06100a', bg: '#0b1410', chrome: '#122117',
    border: 'rgba(157,255,107,0.25)', shadow: 'rgba(0,0,0,0.55)',
    fg: '#d8f5df', muted: '#7a9b84', gutter: '#3f5c48', comment: '#5f7d68',
    keyword: '#9dff6b', string: '#ffd866', number: '#ffa657', function: '#7ee787',
    type: '#e3b341', attr: '#ffd866', tag: '#7ee787', meta: '#b5e8a3', punctuation: '#93b79b'
  },
  {
    key: 'amber', label: '琥珀', swatch: ['#171106', '#ffb26b', '#ffd866'],
    outer: '#110c04', g1: '#241905', g2: '#120c03', bg: '#171106', chrome: '#231a09',
    border: 'rgba(255,178,107,0.28)', shadow: 'rgba(0,0,0,0.55)',
    fg: '#ffedd0', muted: '#a89268', gutter: '#6b5a3a', comment: '#7a6a45',
    keyword: '#ffb26b', string: '#ffd866', number: '#ff8a8a', function: '#ffd866',
    type: '#ffa657', attr: '#ffc77b', tag: '#ffd866', meta: '#e3b341', punctuation: '#b99a68'
  },
  {
    key: 'fire', label: '火焰', swatch: ['#1a0c08', '#ff7b72', '#ffd866'],
    outer: '#130805', g1: '#2a1009', g2: '#140604', bg: '#1a0c08', chrome: '#28130d',
    border: 'rgba(255,123,114,0.28)', shadow: 'rgba(0,0,0,0.6)',
    fg: '#ffe3d6', muted: '#a8836f', gutter: '#6b4436', comment: '#7d5a4a',
    keyword: '#ff7b72', string: '#ffd866', number: '#ffa657', function: '#ffb26b',
    type: '#ff8a8a', attr: '#ffd866', tag: '#ff8a8a', meta: '#ffb26b', punctuation: '#b98a72'
  },
  {
    key: 'mono', label: '极简灰', swatch: ['#0e0e0e', '#ffffff', '#9a9a9a'],
    outer: '#080808', g1: '#1a1a1a', g2: '#0a0a0a', bg: '#0e0e0e', chrome: '#1a1a1a',
    border: 'rgba(255,255,255,0.16)', shadow: 'rgba(0,0,0,0.6)',
    fg: '#e8e8e8', muted: '#9a9a9a', gutter: '#4a4a4a', comment: '#6b6b6b',
    keyword: '#ffffff', string: '#cfcfcf', number: '#cfcfcf', function: '#f2f2f2',
    type: '#d8d8d8', attr: '#c4c4c4', tag: '#e0e0e0', meta: '#9a9a9a', punctuation: '#8a8a8a'
  },
  {
    key: 'paper', label: '纸张浅色', swatch: ['#f7f5ef', '#2f6b1f', '#a8500a'],
    outer: '#e6e1d4', g1: '#fdfcf7', g2: '#e4ded0', bg: '#f7f5ef', chrome: '#e9e4d7',
    border: 'rgba(38,35,29,0.18)', shadow: 'rgba(80,70,50,0.28)',
    fg: '#26231d', muted: '#8a8578', gutter: '#b0aa9a', comment: '#8a8578',
    keyword: '#2f6b1f', string: '#9a6a00', number: '#a8500a', function: '#1e5f4a',
    type: '#8a5a00', attr: '#9a6a00', tag: '#2f6b1f', meta: '#6b6b55', punctuation: '#5c574d'
  }
]

const chromeOptions = [
  { value: 'mac', label: 'macOS 窗口' },
  { value: 'title', label: '标题栏' },
  { value: 'none', label: '无窗口' }
]
const bgOptions = [
  { value: 'gradient', label: '渐变' },
  { value: 'solid', label: '纯色' },
  { value: 'transparent', label: '透明' }
]

/* ================= 示例代码 ================= */
const NL = String.fromCharCode(10)
const SAMPLE = [
  '// 代码截图生成器 · 示例',
  "const THEMES = ['neon', 'amber', 'fire', 'paper']",
  '',
  'export async function renderCanvas(code, options = {}) {',
  "  const theme = THEMES.includes(options.theme) ? options.theme : 'neon'",
  '  const scale = options.scale ?? 2',
  '  const rows = code.split(String.fromCharCode(10)).filter(Boolean)',
  '',
  '  return {',
  '    theme,',
  '    scale,',
  '    width: Math.max(...rows.map(row => row.length)) * 9 * scale,',
  '    height: rows.length * 24 * scale,',
  '    generatedAt: new Date().toISOString()',
  '  }',
  '}',
  '',
  '/* 全部在浏览器内完成，不上传任何数据 */'
].join(NL)

/* ================= 状态 ================= */
const canvasRef = ref(null)
const code = ref(SAMPLE)
const language = ref('javascript')
const themeKey = ref('neon')
const fontSize = ref(15)
const lineHeight = ref(1.6)
const padding = ref(28)
const margin = ref(40)
const chrome = ref('mac')
const windowTitle = ref('render.js')
const bgMode = ref('gradient')
const tabWidth = ref(2)
const showLineNumbers = ref(true)
const wrap = ref(false)
const wrapWidth = ref(100)
const showShadow = ref(true)
const scale = ref(2)
const fontKey = ref('maple')

const dragOver = ref(false)
const error = ref('')
const success = ref('')
const warnMsg = ref('')
const stats = reactive({ lines: 0, chars: 0, lang: '—', size: '—' })

let msgTimer = null
let runTimer = null

/* 上限保护（避免生成超大画布把浏览器拖垮） */
const MAX_CODE = 40000
const MAX_LINES = 2000
const MAX_LOGICAL_W = 6000
const MAX_LOGICAL_H = 16000

/* ================= 高亮解析 ================= */
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ENT[c])

const expandTabs = (s) => s.replace(/\t/g, ' '.repeat(tabWidth.value))

/* hljs 输出的 HTML → { lines: [[{ text, cls }]] } */
function tokenizeLines(src, lang) {
  let html = ''
  let detected = ''
  try {
    if (lang === 'plaintext') {
      html = escapeHtml(src)
    } else if (lang === 'auto') {
      const res = hljs.highlightAuto(src, AUTO_SUBSET)
      html = res.value
      detected = res.language || ''
    } else {
      const res = hljs.highlight(src, { language: lang, ignoreIllegals: true })
      html = res.value
    }
  } catch (e) {
    html = escapeHtml(src)
    detected = ''
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const runs = []
  const walk = (node, cls) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        if (child.nodeValue) runs.push({ text: child.nodeValue, cls })
      } else if (child.nodeType === 1) {
        walk(child, child.className || cls)
      }
    }
  }
  walk(doc.body, '')

  const lines = [[]]
  for (const r of runs) {
    const parts = String(r.text).split('\n')
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push([])
      if (parts[i]) lines[lines.length - 1].push({ text: parts[i], cls: r.cls })
    }
  }
  return { lines, detected }
}

/* hljs class → 主题色键 */
function colorKeyOf(rawCls) {
  const names = String(rawCls).split(/\s+/).filter(Boolean).map((n) => n.replace(/^hljs-/, ''))
  for (const n of names) {
    if (n.startsWith('title')) return 'title'
    if (n.startsWith('function')) return 'function'
    if (n.startsWith('built_in')) return 'builtin'
    if (n.startsWith('char')) return 'string'
    if (n.startsWith('selector')) return 'selector'
    if (n.startsWith('template')) return 'variable'
    if (n.startsWith('subst')) return 'variable'
    if (n.startsWith('class')) return 'function'
    if (n.startsWith('attribute')) return 'attr'
    if (n.startsWith('symbol')) return 'string'
    if (n.startsWith('bullet')) return 'string'
    if (n.startsWith('quote')) return 'string'
    if (n.startsWith('section')) return 'string'
    if (n.startsWith('name')) return 'tag'
    if (n.startsWith('property')) return 'attr'
    if (n.startsWith('regexp')) return 'string'
    if (n.startsWith('doctag')) return 'meta'
    if (n.startsWith('formula')) return 'number'
    if (n.startsWith('link')) return 'meta'
    if (n.startsWith('emphasis') || n.startsWith('strong')) return 'meta'
    if (n.startsWith('addition')) return 'addition'
    if (n.startsWith('deletion')) return 'deletion'
    return n
  }
  return ''
}
/* 主题键缺失时的降级链 */
const KEY_FALLBACK = {
  title: 'function', builtin: 'type', literal: 'keyword', operator: 'punctuation',
  addition: 'string', deletion: 'comment', selector: 'string', params: 'variable',
  variable: 'type', type: 'keyword', tag: 'keyword', meta: 'comment'
}
function colorOf(rawCls, th) {
  let k = colorKeyOf(rawCls)
  if (!k) return th.fg
  const seen = new Set()
  while (k && !seen.has(k)) {
    if (th[k]) return th[k]
    seen.add(k)
    k = KEY_FALLBACK[k]
  }
  return th.fg
}

/* 按字符数换行（等宽字体下字符数近似宽度，最终宽度仍实测） */
function wrapLines(lines, maxChars) {
  if (!maxChars) return lines
  const out = []
  for (const line of lines) {
    let cur = []
    let len = 0
    for (const run of line) {
      let t = run.text
      while (t.length) {
        if (len >= maxChars) { out.push(cur); cur = []; len = 0 }
        const take = Math.min(maxChars - len, t.length)
        cur.push({ text: t.slice(0, take), cls: run.cls })
        len += take
        t = t.slice(take)
      }
    }
    out.push(cur)
  }
  return out
}

/* ================= 主渲染 ================= */
function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const th = themes.find((t) => t.key === themeKey.value) || themes[0]
  const ctx = canvas.getContext('2d')
  const stack = FONT_MAP[fontKey.value] || FONT_MAP.maple
  const fs = fontSize.value
  const lineH = Math.round(fs * lineHeight.value)

  /* --- 空内容：占位 --- */
  if (!code.value.trim()) {
    const W = 640
    const H = 280
    canvas.width = W * 2
    canvas.height = H * 2
    ctx.setTransform(2, 0, 0, 2, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = th.bg
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = th.muted
    ctx.font = `400 15px ${stack}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📸 粘贴代码后自动生成截图', W / 2, H / 2)
    stats.lines = 0
    stats.chars = code.value.length
    stats.lang = '—'
    stats.size = '—'
    warnMsg.value = ''
    return
  }

  /* --- 上限保护 --- */
  if (code.value.length > MAX_CODE) {
    error.value = `代码过长（${code.value.length} 字符），请精简到 ${MAX_CODE} 字符以内`
    clearCanvas(th, stack, '代码过长，请精简后重试')
    return
  }

  const src = expandTabs(code.value)
  const { lines: rawLines, detected } = tokenizeLines(src, language.value)

  if (rawLines.length > MAX_LINES) {
    error.value = `代码行数过多（${rawLines.length} 行），请精简到 ${MAX_LINES} 行以内`
    clearCanvas(th, stack, '行数过多，请精简后重试')
    return
  }

  const lines = wrap.value ? wrapLines(rawLines, Math.max(20, wrapWidth.value)) : rawLines

  /* --- 度量 --- */
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.font = `${fs}px ${stack}`
  const charW = ctx.measureText('M').width || fs * 0.6
  const maxDigits = String(lines.length).length
  const gutter = showLineNumbers.value ? Math.ceil((maxDigits + 1.4) * charW) : 0
  let textW = charW
  for (const line of lines) {
    let w = 0
    for (const r of line) w += ctx.measureText(r.text).width
    if (w > textW) textW = w
  }
  const chromeH = chrome.value === 'none' ? 0 : Math.round(fs * 2.3)
  const panelW = Math.round(padding.value * 2 + gutter + textW)
  const panelH = Math.round(padding.value * 2 + chromeH + lines.length * lineH)
  const W = Math.round(panelW + margin.value * 2)
  const H = Math.round(panelH + margin.value * 2)

  if (W > MAX_LOGICAL_W || H > MAX_LOGICAL_H) {
    error.value = `图片过大（${W}×${H}），请开启「自动换行」、调小字号或精简代码`
    clearCanvas(th, stack, '图片过大，请调整参数')
    return
  }
  warnMsg.value = (!wrap.value && W > 2400)
    ? `当前图片较宽（${W}px），建议开启「自动换行」以获得更合适的比例`
    : ''

  /* --- 绘制 --- */
  canvas.width = Math.round(W * scale.value)
  canvas.height = Math.round(H * scale.value)
  ctx.setTransform(scale.value, 0, 0, scale.value, 0, 0)
  ctx.clearRect(0, 0, W, H)

  if (bgMode.value === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H)
    g.addColorStop(0, th.g1)
    g.addColorStop(1, th.g2)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  } else if (bgMode.value === 'solid') {
    ctx.fillStyle = th.outer
    ctx.fillRect(0, 0, W, H)
  }

  const x0 = margin.value
  const y0 = margin.value

  ctx.save()
  if (showShadow.value) {
    ctx.shadowColor = th.shadow
    ctx.shadowBlur = 28
    ctx.shadowOffsetY = 10
  }
  ctx.fillStyle = th.bg
  ctx.fillRect(x0, y0, panelW, panelH)
  ctx.restore()

  ctx.strokeStyle = th.border
  ctx.lineWidth = 1
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, panelW - 1, panelH - 1)

  /* 窗口栏 */
  if (chromeH) {
    ctx.fillStyle = th.chrome
    ctx.fillRect(x0 + 1, y0 + 1, panelW - 2, chromeH)
    ctx.beginPath()
    ctx.moveTo(x0 + 1, y0 + chromeH + 0.5)
    ctx.lineTo(x0 + panelW - 1, y0 + chromeH + 0.5)
    ctx.stroke()

    if (chrome.value === 'mac') {
      /* 方形 LED — 与网站标题栏 .leds span 一致 */
      const colors = ['#ff8a8a', '#ffd866', '#9dff6b']
      const s = Math.max(7, Math.round(fs * 0.56))
      const gap = Math.round(s * 0.55)
      const xBase = Math.round(x0 + padding.value * 0.8)
      const cy = y0 + chromeH / 2

      colors.forEach((c, i) => {
        const bx = xBase + i * (s + gap)
        const by = Math.round(cy - s / 2)

        /* 彩色外发光（匹配网站 box-shadow: 0 0 8px） */
        ctx.save()
        ctx.shadowColor = c
        ctx.shadowBlur = 8
        ctx.fillStyle = c
        ctx.fillRect(bx, by, s, s)
        ctx.restore()

        /* 主体实心方块 */
        ctx.fillStyle = c
        ctx.fillRect(bx, by, s, s)

        /* 内阴影 — 匹配网站 inset -1px -1px 0 rgba(0,0,0,0.3) */
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(bx, by, s, 1)
        ctx.fillRect(bx, by, 1, s)

        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.fillRect(bx, by + s - 1, s, 1)
        ctx.fillRect(bx + s - 1, by, 1, s)
      })
    }
    if (windowTitle.value.trim()) {
      ctx.fillStyle = th.muted
      ctx.font = `${Math.max(10, Math.round(fs * 0.85))}px ${stack}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const title = windowTitle.value.trim().length > 48
        ? windowTitle.value.trim().slice(0, 48) + '…'
        : windowTitle.value.trim()
      ctx.fillText(title, x0 + panelW / 2, y0 + chromeH / 2)
    }
  }

  /* 代码区 */
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const codeTop = y0 + chromeH + padding.value
  const codeLeft = x0 + padding.value + gutter
  const numFs = Math.max(9, Math.round(fs * 0.85))

  for (let i = 0; i < lines.length; i++) {
    const baseY = codeTop + i * lineH + lineH / 2 + fs * 0.35

    if (showLineNumbers.value) {
      ctx.font = `${numFs}px ${stack}`
      ctx.fillStyle = th.gutter
      ctx.textAlign = 'right'
      ctx.fillText(String(i + 1), codeLeft - charW * 0.7, baseY)
      ctx.textAlign = 'left'
      ctx.font = `${fs}px ${stack}`
    }

    let x = codeLeft
    for (const r of lines[i]) {
      ctx.fillStyle = colorOf(r.cls, th)
      ctx.fillText(r.text, x, baseY)
      x += ctx.measureText(r.text).width
    }
  }

  /* 行号分隔线 */
  if (showLineNumbers.value && lines.length > 1) {
    ctx.strokeStyle = th.border
    ctx.beginPath()
    ctx.moveTo(x0 + padding.value + gutter - charW * 0.35, codeTop)
    ctx.lineTo(x0 + padding.value + gutter - charW * 0.35, codeTop + (lines.length - 1) * lineH + fs)
    ctx.stroke()
  }

  /* 统计 */
  stats.lines = lines.length
  stats.chars = code.value.length
  stats.lang = language.value === 'auto'
    ? (detected ? '自动 · ' + detected : '纯文本')
    : (langOptions.find((l) => l.value === language.value)?.label || language.value)
  stats.size = `${W}×${H} · ${Math.round(W * scale.value)}×${Math.round(H * scale.value)}px`
}

function clearCanvas(th, stack, msg) {
  const canvas = canvasRef.value
  if (!canvas) return
  const W = 640
  const H = 200
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  ctx.fillStyle = th.bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = th.muted
  ctx.font = `400 14px ${stack}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(msg, W / 2, H / 2)
  stats.lines = 0
  stats.size = '—'
}

function scheduleRender() {
  clearTimeout(runTimer)
  runTimer = setTimeout(() => {
    error.value = ''
    render()
  }, 180)
}

/* ================= 交互 ================= */
function flashSuccess(msg) {
  clearTimeout(msgTimer)
  success.value = msg
  error.value = ''
  msgTimer = setTimeout(() => { success.value = '' }, 2200)
}
function flashError(msg) {
  clearTimeout(msgTimer)
  error.value = msg
  success.value = ''
  msgTimer = setTimeout(() => { error.value = '' }, 3500)
}

async function copyCode() {
  if (!code.value) { flashError('没有可复制的代码'); return }
  const ok = await copyText(code.value)
  ok ? flashSuccess('代码已复制') : flashError('复制失败，请手动选择复制')
}

async function copyImage() {
  const canvas = canvasRef.value
  if (!canvas || !code.value.trim()) { flashError('没有可复制的图片'); return }
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 生成失败'))), 'image/png')
    })
    if (!navigator.clipboard || !window.ClipboardItem) {
      flashError('当前浏览器不支持复制图片，请使用「导出 PNG」')
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    flashSuccess('图片已复制到剪贴板')
  } catch (e) {
    flashError('复制图片失败：' + (e && e.message ? e.message : '未知错误'))
  }
}

function downloadPng() {
  const canvas = canvasRef.value
  if (!canvas || !code.value.trim()) { flashError('没有可导出的图片'); return }
  const name = (windowTitle.value.trim() || language.value || 'code')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .slice(0, 32) || 'code'
  const link = document.createElement('a')
  link.download = `${name}_${themeKey.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  flashSuccess('PNG 已导出')
}

function loadSample() {
  code.value = SAMPLE
  language.value = 'javascript'
  windowTitle.value = 'render.js'
  flashSuccess('已载入示例代码')
}

function clearAll() {
  code.value = ''
  error.value = ''
  warnMsg.value = ''
  render()
  flashSuccess('已清空')
}

/* ================= 文件读取 ================= */
const EXT_LANG = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', vue: 'xml', html: 'xml', htm: 'xml', xml: 'xml',
  css: 'css', scss: 'css', less: 'css', json: 'json', py: 'python', sh: 'bash',
  bash: 'bash', zsh: 'bash', sql: 'sql', yml: 'yaml', yaml: 'yaml', md: 'markdown',
  java: 'java', go: 'go', rs: 'rust', php: 'php', rb: 'ruby', toml: 'ini',
  ini: 'ini', conf: 'ini', dockerfile: 'dockerfile', diff: 'diff',
  c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', 'c++': 'cpp'
}

function handleFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (f) readFile(f)
  e.target.value = ''
}

function handleDrop(e) {
  dragOver.value = false
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (f) readFile(f)
}

function readFile(file) {
  if (file.size > 512 * 1024) {
    flashError(`文件过大（${(file.size / 1024).toFixed(0)}KB），请上传 ≤512KB 的代码文件`)
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    if (!text) { flashError('文件内容为空'); return }
    code.value = text.slice(0, MAX_CODE)
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (EXT_LANG[ext]) language.value = EXT_LANG[ext]
    windowTitle.value = file.name.slice(0, 48)
    flashSuccess(`已载入 ${file.name}`)
  }
  reader.onerror = () => flashError('文件读取失败，请重试')
  reader.readAsText(file)
}

/* ================= 生命周期 ================= */
watch(code, scheduleRender)
watch(
  [language, themeKey, fontSize, lineHeight, padding, margin, chrome, windowTitle,
    bgMode, tabWidth, showLineNumbers, wrap, wrapWidth, showShadow, scale, fontKey],
  scheduleRender
)

onMounted(() => render())
onBeforeUnmount(() => {
  clearTimeout(runTimer)
  clearTimeout(msgTimer)
})
</script>

<style scoped>
/* ===== 下拉选择 ===== */
.tool-select {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  height: 40px;
  padding: 0 10px;
  border-radius: 0;
  box-sizing: border-box;
  transition: all 0.2s;
}

.tool-select:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.tool-select:disabled {
  opacity: 0.5;
}

/* 窗口标题输入：去掉 .code-input-sm 给复制按钮预留的右内边距 */
.pm-fix {
  padding-right: 12px;
}

/* ===== 上传区 ===== */
.upload-area {
  border: 1px dashed var(--line);
  background: var(--panel-2);
  padding: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--green);
  background: var(--green-soft);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-icon {
  font-size: 20px;
}

.upload-text {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
}

.upload-hint {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

/* ===== 滑块行 ===== */
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row .range-input {
  flex: 1;
  min-width: 0;
}

.range-value {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  min-width: 52px;
  text-align: right;
  white-space: nowrap;
}

/* ===== 主题色块 ===== */
.theme-group {
  gap: 14px;
}

.palette-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.palette-dots {
  display: inline-flex;
  gap: 3px;
}

.palette-dots i {
  width: 10px;
  height: 10px;
  display: block;
  border: 1px solid var(--line);
}

/* ===== 预览区 ===== */
.canvas-scroll {
  max-height: 560px;
  overflow: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px;
}

.canvas-wrapper {
  position: relative;
  display: block;
  max-width: 100%;
}

.canvas-wrapper canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.canvas-checker {
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.07) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.07) 75%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.07) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.07) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
}

.canvas-copy {
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.45);
  padding: 2px 5px;
}

/* ===== 统计 ===== */
.stats-section {
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  word-break: break-all;
}

/* ===== 提示 ===== */
.status-warn {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 12px;
  color: #ffd866;
  border: 1px solid rgba(255, 216, 102, 0.3);
  background: rgba(255, 216, 102, 0.06);
  padding: 8px 10px;
}

.hint-text {
  margin-top: 10px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

/* ===== 全宽参数网格 ===== */
.adv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.adv-item {
  min-width: 0;
}

.adv-item .tool-label {
  margin-top: 0;
}

.options-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .adv-grid {
    grid-template-columns: 1fr;
    padding: 10px;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .canvas-scroll {
    max-height: 380px;
  }

  .options-group {
    gap: 12px;
  }
}
</style>
