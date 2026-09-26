<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🧮 代码行数统计</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">

        <!-- ===== 粘贴模式：左输入右统计 ===== -->
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入代码：</label>
            <div class="lang-row">
              <select v-model="langKey" class="lang-select">
                <option value="auto">🔍 自动检测语言</option>
                <option v-for="l in langOptions" :key="l.key" :value="l.key">{{ l.label }}</option>
              </select>
              <span v-if="langKey === 'auto' && hasInput" class="lang-badge">
                → {{ resolvedLabel }}
              </span>
            </div>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              spellcheck="false"
              placeholder="在此粘贴代码（支持 C / JS / Python / HTML / CSS / Go / Rust 等 40+ 语言的注释识别）..."
            ></textarea>
          </div>

          <div class="tool-col">
            <label class="tool-label">统计结果：</label>
            <div class="stats-section">
              <div v-if="!hasInput" class="stats-placeholder">
                在左侧粘贴代码后，这里会实时显示行数、代码 / 注释 / 空行统计与分布图表
              </div>
              <div v-else class="stats-inner">
                <div class="stats-head">
                  <span class="stats-head-title">{{ resolvedLabel }}</span>
                  <button class="mini-copy" @click="copyReport" title="复制统计报告">📋 复制</button>
                </div>
                <div class="stats-grid">
                  <div v-for="item in statItems" :key="item.label" class="stat-item">
                    <span class="stat-label">{{ item.label }}</span>
                    <span class="stat-value">{{ item.value }}</span>
                  </div>
                </div>
                <div class="dist-title">行类型分布</div>
                <div class="dist-bar">
                  <div
                    v-for="seg in distSegments"
                    :key="seg.key"
                    class="dist-seg"
                    :style="{ width: segWidth(seg.count), background: seg.color, opacity: seg.opacity }"
                    :title="`${seg.label}：${seg.count} 行`"
                  ></div>
                </div>
                <div class="dist-legend">
                  <span v-for="seg in distSegments" :key="seg.key" class="legend-item">
                    <i class="legend-dot" :style="{ background: seg.color, opacity: seg.opacity }"></i>
                    {{ seg.label }} {{ seg.count }}（{{ segWidth(seg.count) }}）
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 操作按钮（双栏之外，全宽） ===== -->
        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="copyReport" :disabled="!hasInput">📋 复制报告</button>
          <button class="tool-button" @click="copyInput" :disabled="!hasInput">📋 复制输入</button>
          <button class="tool-button" @click="loadSample">📄 载入示例</button>
          <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
        </div>

        <!-- ===== 统计选项 ===== -->
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.blockLines" />
            <span>块注释内每行都计为注释行</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.shebang" />
            <span>首行 shebang（#!）计为注释行</span>
          </label>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <!-- ===== 批量文件分析 ===== -->
        <label class="tool-label">批量分析多个文件（可选）：</label>
        <div
          class="upload-area"
          :class="{ 'is-drag': dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            style="display: none"
            @change="handleFileInput"
          />
          <div class="upload-content">
            <span class="upload-icon">📁</span>
            <span class="upload-text">点击或拖拽上传源代码文件（可多选）</span>
            <span class="upload-hint">按扩展名自动识别语言 · 最多 30 个文件 · 单个不超过 2 MB · 文件不会上传到任何服务器</span>
          </div>
        </div>

        <div v-if="fileResults.length" class="batch-block">
          <div class="panel-head">
            <span class="panel-title">文件明细（{{ fileResults.length }} 个）</span>
            <button class="mini-copy" @click="copyBatch" title="复制批量统计">📋 复制</button>
          </div>
          <div class="table-wrap">
            <table class="loc-table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>语言</th>
                  <th class="num">行数</th>
                  <th class="num">代码</th>
                  <th class="num">注释</th>
                  <th class="num">空行</th>
                  <th class="num">注释率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in fileResults" :key="f.id">
                  <td class="file-cell" :title="f.name">{{ f.name }}</td>
                  <td>{{ f.langLabel }}</td>
                  <td class="num">{{ f.stats.total }}</td>
                  <td class="num">{{ f.stats.code }}</td>
                  <td class="num">{{ f.stats.comment }}</td>
                  <td class="num">{{ f.stats.blank }}</td>
                  <td class="num">{{ densityOf(f.stats) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2">合计</td>
                  <td class="num">{{ fileTotals.total }}</td>
                  <td class="num">{{ fileTotals.code }}</td>
                  <td class="num">{{ fileTotals.comment }}</td>
                  <td class="num">{{ fileTotals.blank }}</td>
                  <td class="num">{{ densityOf(fileTotals) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="langGroups.length > 1" class="panel-head panel-head-sub">
            <span class="panel-title">按语言分类统计</span>
          </div>
          <div v-if="langGroups.length > 1" class="table-wrap">
            <table class="loc-table">
              <thead>
                <tr>
                  <th>语言</th>
                  <th class="num">文件数</th>
                  <th class="num">总行数</th>
                  <th class="num">代码行</th>
                  <th class="num">注释行</th>
                  <th class="num">空行</th>
                  <th class="num">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in langGroups" :key="g.langKey">
                  <td>{{ g.label }}</td>
                  <td class="num">{{ g.files }}</td>
                  <td class="num">{{ g.total }}</td>
                  <td class="num">{{ g.code }}</td>
                  <td class="num">{{ g.comment }}</td>
                  <td class="num">{{ g.blank }}</td>
                  <td class="num">{{ share(g) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="dist-bar lang-bar">
              <div
                v-for="(g, i) in langGroups"
                :key="g.langKey"
                class="dist-seg"
                :style="{ width: share(g), background: 'var(--green)', opacity: groupOpacity(i) }"
                :title="`${g.label}：${g.total} 行`"
              ></div>
            </div>
          </div>

          <div class="button-group">
            <button class="tool-button danger full-width" @click="clearFiles">🗑️ 清空文件列表</button>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { copyText } from '../../utils/clipboard'

/* ===================== 语言定义 ===================== */
/* line: 行注释标记；block: 块注释 [开始, 结束]；exts: 文件扩展名 */
const LANGUAGES = {
  javascript: { label: 'JavaScript', line: ['//'], block: [['/*', '*/']], exts: ['js', 'mjs', 'cjs', 'jsx'] },
  typescript: { label: 'TypeScript', line: ['//'], block: [['/*', '*/']], exts: ['ts', 'tsx', 'mts', 'cts'] },
  vue:        { label: 'Vue', line: ['//'], block: [['/*', '*/'], ['<!--', '-->']], exts: ['vue'] },
  html:       { label: 'HTML', line: [], block: [['<!--', '-->']], exts: ['html', 'htm'] },
  xml:        { label: 'XML / SVG', line: [], block: [['<!--', '-->']], exts: ['xml', 'svg'] },
  css:        { label: 'CSS', line: [], block: [['/*', '*/']], exts: ['css'] },
  scss:       { label: 'SCSS / LESS', line: ['//'], block: [['/*', '*/']], exts: ['scss', 'sass', 'less'] },
  python:     { label: 'Python', line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], exts: ['py', 'pyw', 'pyi'] },
  ruby:       { label: 'Ruby', line: ['#'], block: [['=begin', '=end']], exts: ['rb'] },
  php:        { label: 'PHP', line: ['//', '#'], block: [['/*', '*/']], exts: ['php'] },
  java:       { label: 'Java', line: ['//'], block: [['/*', '*/']], exts: ['java'] },
  kotlin:     { label: 'Kotlin', line: ['//'], block: [['/*', '*/']], exts: ['kt', 'kts'] },
  scala:      { label: 'Scala', line: ['//'], block: [['/*', '*/']], exts: ['scala'] },
  groovy:     { label: 'Groovy', line: ['//'], block: [['/*', '*/']], exts: ['groovy', 'gradle'] },
  csharp:     { label: 'C#', line: ['//'], block: [['/*', '*/']], exts: ['cs'] },
  c:          { label: 'C', line: ['//'], block: [['/*', '*/']], exts: ['c', 'h'] },
  cpp:        { label: 'C++', line: ['//'], block: [['/*', '*/']], exts: ['cpp', 'cc', 'cxx', 'hpp', 'hh'] },
  objc:       { label: 'Objective-C', line: ['//'], block: [['/*', '*/']], exts: ['mm'] },
  swift:      { label: 'Swift', line: ['//'], block: [['/*', '*/']], exts: ['swift'] },
  go:         { label: 'Go', line: ['//'], block: [['/*', '*/']], exts: ['go'] },
  rust:       { label: 'Rust', line: ['//'], block: [['/*', '*/']], exts: ['rs'] },
  dart:       { label: 'Dart', line: ['//'], block: [['/*', '*/']], exts: ['dart'] },
  shell:      { label: 'Shell / Bash', line: ['#'], block: [], exts: ['sh', 'bash', 'zsh', 'fish', 'ksh'] },
  powershell: { label: 'PowerShell', line: ['#'], block: [['<#', '#>']], exts: ['ps1', 'psm1'] },
  lua:        { label: 'Lua', line: ['--'], block: [['--[[', ']]']], exts: ['lua'] },
  perl:       { label: 'Perl', line: ['#'], block: [], exts: ['pl', 'pm'] },
  r:          { label: 'R', line: ['#'], block: [], exts: ['r'] },
  julia:      { label: 'Julia', line: ['#'], block: [['#=', '=#']], exts: ['jl'] },
  matlab:     { label: 'MATLAB', line: ['%'], block: [['%{', '%}']], exts: ['m', 'mlx'] },
  sql:        { label: 'SQL', line: ['--'], block: [['/*', '*/']], exts: ['sql'] },
  yaml:       { label: 'YAML', line: ['#'], block: [], exts: ['yml', 'yaml'] },
  toml:       { label: 'TOML', line: ['#'], block: [], exts: ['toml'] },
  ini:        { label: 'INI / Conf', line: [';', '#'], block: [], exts: ['ini', 'conf', 'cfg', 'properties'] },
  dockerfile: { label: 'Dockerfile', line: ['#'], block: [], exts: ['dockerfile'] },
  makefile:   { label: 'Makefile', line: ['#'], block: [], exts: ['makefile', 'mk'] },
  asm:        { label: 'Assembly', line: [';', '#'], block: [], exts: ['asm', 's', 'nasm'] },
  haskell:    { label: 'Haskell', line: ['--'], block: [['{-', '-}']], exts: ['hs'] },
  clojure:    { label: 'Clojure / Lisp', line: [';'], block: [], exts: ['clj', 'cljs', 'edn', 'lisp', 'el'] },
  erlang:     { label: 'Erlang', line: ['%'], block: [], exts: ['erl', 'hrl'] },
  elixir:     { label: 'Elixir', line: ['#'], block: [], exts: ['ex', 'exs'] },
  nginx:      { label: 'Nginx 配置', line: ['#'], block: [], exts: ['nginx'] },
  markdown:   { label: 'Markdown', line: [], block: [['<!--', '-->']], exts: ['md', 'markdown', 'mdx'] },
  json:       { label: 'JSON', line: [], block: [], exts: ['json', 'jsonc', 'json5', 'geojson'] },
  plaintext:  { label: '纯文本', line: [], block: [], exts: ['txt', 'log', 'csv', 'tsv', 'text'] }
}

const langOptions = Object.keys(LANGUAGES)
  .map(key => ({ key, label: LANGUAGES[key].label }))
  .sort((a, b) => a.label.localeCompare(b.label))

/* 无扩展名 / 特殊文件名映射 */
const SPECIAL_NAMES = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  'cmakelists.txt': 'plaintext',
  '.gitignore': 'plaintext',
  '.env': 'ini',
  '.editorconfig': 'ini'
}

/* ===================== 自动语言检测 ===================== */
const DETECT_RULES = [
  { lang: 'vue', p: [[/<template[\s>]/i, 6], [/<script[^>]*\bsetup\b/i, 9], [/<style[^>]*\bscoped\b/i, 5]] },
  { lang: 'php', p: [[/<\?php/, 10], [/\$\w+\s*=/, 2], [/\becho\s+/, 1]] },
  { lang: 'html', p: [[/<!DOCTYPE\s+html/i, 8], [/<html[\s>]/i, 6], [/<\/(div|span|p|ul|li|body|head|section|a)>/i, 3], [/<script[\s>]/i, 2]] },
  { lang: 'xml', p: [[/<\?xml/, 9], [/<[A-Za-z]+:[A-Za-z]+[\s>]/, 3]] },
  { lang: 'python', p: [[/^\s*#!\/.*\bpython[0-9.]*\b/m, 10], [/^\s*def\s+\w+\s*\(.*\)\s*:/m, 6], [/^\s*class\s+\w+(\([\w.,\s]*\))?\s*:/m, 5], [/^\s*(elif|finally)\b/m, 4], [/^\s*except\s+\w+/m, 4], [/^\s*(import|from)\s+[\w.]+/m, 3], [/\b(True|False|None)\b/, 3]] },
  { lang: 'typescript', p: [[/\binterface\s+\w+\s*(\{|<)/, 5], [/\bexport\s+(type|interface)\b/, 5], [/\btype\s+\w+\s*=/, 3], [/:\s*(string|number|boolean|void|any|unknown)\b/, 3]] },
  { lang: 'go', p: [[/^package\s+\w+/m, 8], [/^func\s+/m, 5], [/\bfmt\.\w+\(/, 4], [/\berr\s*!=\s*nil\b/, 4], [/:=/, 3]] },
  { lang: 'rust', p: [[/\blet\s+mut\b/, 6], [/\bprintln!\(/, 5], [/^use\s+[\w:]+;/m, 4], [/\bfn\s+\w+\s*\(/, 4], [/\bimpl\s+\w+/, 3], [/&str\b/, 3]] },
  { lang: 'java', p: [[/\bpublic\s+static\s+void\s+main\s*\(/, 9], [/\bSystem\.out\.print/, 6], [/^import\s+java\./m, 5], [/\bpublic\s+(final\s+)?class\s+\w+/, 4]] },
  { lang: 'csharp', p: [[/\busing\s+System[.\w]*;/, 6], [/\bConsole\.WriteLine/, 6], [/\bnamespace\s+[\w.]+/, 5]] },
  { lang: 'cpp', p: [[/#include\s*<(iostream|vector|string|map|algorithm|memory)>/, 7], [/\busing\s+namespace\s+std\b/, 6], [/\bstd::/, 5], [/\bcout\s*<</, 5], [/\btemplate\s*</, 3]] },
  { lang: 'c', p: [[/#include\s*[<"]/, 7], [/\bint\s+main\s*\(/, 5], [/\bprintf\s*\(/, 4], [/\bstruct\s+\w+\s*\{/, 2]] },
  { lang: 'shell', p: [[/^#!.*\b(bash|sh|zsh|ksh)\b/, 10], [/^\s*(if|then|fi|for|do|done|esac|elif)\b/m, 4], [/\bexport\s+\w+=/, 3], [/\$\(\w/, 2], [/\becho\s+["']/, 2]] },
  { lang: 'powershell', p: [[/\b(Get|Set|New|Remove|Write|Start|Stop)-\w+/, 6], [/\$\w+\s*=\s*@\{/, 5], [/\bparam\s*\(/, 3]] },
  { lang: 'sql', p: [[/\bSELECT\b[\s\S]{0,300}?\bFROM\b/i, 5], [/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i, 5], [/\bWHERE\b/i, 3], [/\bJOIN\b/i, 2]] },
  { lang: 'scss', p: [[/\$[\w-]+\s*:\s*[^;]+;/, 5], [/@(mixin|include|extend)\b/, 5], [/&:(hover|focus|active)\b/, 3]] },
  { lang: 'css', p: [[/@media[^{]*\{/, 4], [/[.#]?[\w-]+\s*\{[^}]*:[^}]*;?\s*\}/, 3], [/:\s*\d+(px|em|rem|vh|vw|%|s)\b/, 3], [/--[\w-]+\s*:/, 2]] },
  { lang: 'dockerfile', p: [[/^FROM\s+\S+/m, 9], [/^RUN\s+/m, 5], [/^CMD\s+/m, 4], [/^ENV\s+/m, 3]] },
  { lang: 'makefile', p: [[/^\.PHONY:/m, 7], [/^[A-Za-z_][\w.-]*:\s*$/m, 4], [/^\t\S/m, 3]] },
  { lang: 'toml', p: [[/^\[[\w.-]+\]\s*$/m, 4], [/^\s*[\w-]+\s*=\s*("[^"]*"|\d+|true|false)\s*$/m, 3]] },
  { lang: 'yaml', p: [[/^---\s*$/m, 4], [/^[\w-]+:\s*$/m, 3], [/^\s*-\s+\w+/m, 3], [/^[\w-]+:\s+\S+$/m, 1]] },
  { lang: 'markdown', p: [[/^```/m, 4], [/^#{1,6}\s+\S/m, 3], [/\[[^\]]+\]\([^)\s]+\)/, 3], [/^\s*>\s+\S/m, 1]] },
  { lang: 'json', p: [[/^\s*[{[][\s\S]*[}\]]\s*$/m, 3], [/"[^"]+"\s*:/, 3]] },
  { lang: 'lua', p: [[/\blocal\s+\w+/, 5], [/\bfunction\s+\w*\s*\(/, 4], [/\bthen\b[\s\S]{0,120}\bend\b/, 2]] },
  { lang: 'ruby', p: [[/\bputs\s+/, 5], [/\bdef\s+\w+[\s\S]{0,120}\bend\b/, 3], [/\.each\s+do\b/, 3], [/\brequire\s+['"]/, 2]] },
  { lang: 'perl', p: [[/\bmy\s+[$@%]\w+/, 6], [/\buse\s+strict\b/, 6], [/\bprint\s+/, 1]] },
  { lang: 'swift', p: [[/\bguard\s+let\b/, 6], [/\bfunc\s+\w+\s*\(/, 3], [/\blet\s+\w+\s*(:|=)/, 3]] },
  { lang: 'dart', p: [[/\bimport\s+['"]package:/, 6], [/\bFuture</, 5], [/\bvoid\s+main\s*\(\s*\)/, 5]] },
  { lang: 'r', p: [[/<-/, 4], [/\blibrary\(/, 4], [/\bdata\.frame\(/, 3]] },
  { lang: 'javascript', p: [[/\b(const|let|var)\s+\w+\s*=/, 3], [/\bfunction\s+\w*\s*\(/, 2], [/=>/, 2], [/console\.log\(/, 4], [/\brequire\(|module\.exports\b/, 4], [/document\.(getElementById|querySelector)/, 4]] }
]

function detectLanguage(text) {
  if (!text || !text.trim()) return 'plaintext'
  let best = { lang: 'plaintext', score: 0 }
  for (const rule of DETECT_RULES) {
    let score = 0
    for (const [re, weight] of rule.p) {
      if (re.test(text)) score += weight
    }
    if (score > best.score) best = { lang: rule.lang, score }
  }
  return best.score >= 3 ? best.lang : 'plaintext'
}

function detectByFileName(name) {
  const lower = String(name || '').toLowerCase()
  if (SPECIAL_NAMES[lower]) return SPECIAL_NAMES[lower]
  if (lower.startsWith('dockerfile')) return 'dockerfile'
  if (lower.startsWith('makefile')) return 'makefile'
  const dot = lower.lastIndexOf('.')
  if (dot === -1) return 'plaintext'
  const ext = lower.slice(dot + 1)
  for (const key of Object.keys(LANGUAGES)) {
    if (LANGUAGES[key].exts.includes(ext)) return key
  }
  return 'plaintext'
}

/* ===================== 核心分析引擎 ===================== */

/** 跳过字符串字面量，返回闭合引号后的下标；未闭合返回 -1 */
function findStringEnd(line, start, quote) {
  let i = start + 1
  while (i < line.length) {
    const ch = line[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === quote) return i + 1
    i++
  }
  return -1
}

function emptyStats() {
  return {
    total: 0, code: 0, comment: 0, blank: 0,
    chars: 0, bytes: 0, codeChars: 0, longest: 0,
    nonBlank: 0, avgLen: 0, commentDensity: 0
  }
}

/**
 * 逐行扫描代码，区分空行 / 注释行 / 代码行
 * 支持多行块注释、字符串内注释标记屏蔽、shebang 识别
 */
function analyze(text, langKey, options) {
  const opts = options || { blockLines: true, shebang: true }
  if (!text) return emptyStats()
  const lang = LANGUAGES[langKey] || LANGUAGES.plaintext
  const lines = text.split(/\r\n|\r|\n/)

  let code = 0
  let comment = 0
  let blank = 0
  let codeChars = 0
  let nonBlank = 0
  let nonBlankChars = 0
  let longest = 0
  let blockEnd = null

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]

    // shebang 行
    if (li === 0 && opts.shebang && /^#!/.test(line)) { comment++; continue }
    // 空行
    if (!line.trim()) { blank++; continue }

    nonBlank++
    nonBlankChars += line.trim().length
    if (line.length > longest) longest = line.length

    const enteredBlock = blockEnd !== null
    let i = 0
    let hasCode = false
    let hasComment = false
    let blockOpenedHere = false

    while (i < line.length) {
      // 处于块注释中
      if (blockEnd) {
        hasComment = true
        const close = line.indexOf(blockEnd, i)
        if (close === -1) { i = line.length; break }
        i = close + blockEnd.length
        blockEnd = null
        continue
      }

      const ch = line[i]
      if (ch === ' ' || ch === '\t') { i++; continue }

      // 块注释优先（Lua 的 --[[、Haskell 的 {-、Python 的 """ 等）
      let matchedBlock = false
      for (const [open, close] of lang.block) {
        if (line.startsWith(open, i)) {
          hasComment = true
          blockOpenedHere = true
          i += open.length
          const closeIdx = line.indexOf(close, i)
          if (closeIdx === -1) { blockEnd = close; i = line.length }
          else { i = closeIdx + close.length }
          matchedBlock = true
          break
        }
      }
      if (matchedBlock) continue

      // 行注释
      let matchedLine = false
      for (const token of lang.line) {
        if (line.startsWith(token, i)) {
          hasComment = true
          matchedLine = true
          i = line.length
          break
        }
      }
      if (matchedLine) break

      // 字符串字面量（屏蔽字符串内的注释标记）
      if (ch === '"' || ch === "'" || ch === '`') {
        hasCode = true
        const end = findStringEnd(line, i, ch)
        if (end === -1) break
        i = end
        continue
      }

      hasCode = true
      i++
    }

    if (hasCode) {
      code++
      codeChars += line.trim().length
    } else if (hasComment) {
      // 块注释内部行（本行未出现块起始标记）
      const interiorOnly = enteredBlock && !blockOpenedHere
      if (interiorOnly && !opts.blockLines) blank++
      else comment++
    } else {
      blank++
    }
  }

  const total = lines.length
  const denseBase = code + comment
  return {
    total,
    code,
    comment,
    blank,
    chars: text.length,
    bytes: new TextEncoder().encode(text).length,
    codeChars,
    longest,
    nonBlank,
    avgLen: nonBlank ? nonBlankChars / nonBlank : 0,
    commentDensity: denseBase ? (comment / denseBase) * 100 : 0
  }
}

/* ===================== 组件状态 ===================== */
const input = ref('')
const langKey = ref('auto')
const error = ref('')
const success = ref('')
const dragOver = ref(false)
const fileResults = ref([])
const opts = reactive({ blockLines: true, shebang: true })

const hasInput = computed(() => input.value.trim().length > 0)

const resolvedLangKey = computed(() => {
  if (langKey.value !== 'auto') return langKey.value
  return detectLanguage(input.value)
})

const resolvedLabel = computed(() => (LANGUAGES[resolvedLangKey.value] || LANGUAGES.plaintext).label)

const singleStats = computed(() => {
  if (!input.value) return emptyStats()
  return analyze(input.value, resolvedLangKey.value, opts)
})

const fmt = n => Number(n || 0).toLocaleString()

const statItems = computed(() => {
  const s = singleStats.value
  if (!hasInput.value) return []
  const pct = (v, base) => (base ? ((v / base) * 100).toFixed(1) + '%' : '0.0%')
  return [
    { label: '总行数', value: fmt(s.total) },
    { label: '代码行', value: fmt(s.code) },
    { label: '注释行', value: fmt(s.comment) },
    { label: '空行', value: fmt(s.blank) },
    { label: '注释密度', value: s.commentDensity.toFixed(1) + '%' },
    { label: '代码占比', value: pct(s.code, s.total) },
    { label: '有效代码字符', value: fmt(s.codeChars) },
    { label: '总字符数', value: fmt(s.chars) },
    { label: 'UTF-8 字节', value: fmt(s.bytes) },
    { label: '非空行', value: fmt(s.nonBlank) },
    { label: '最长行', value: fmt(s.longest) },
    { label: '平均行长度', value: s.avgLen.toFixed(1) }
  ]
})

const distSegments = computed(() => {
  const s = singleStats.value
  return [
    { key: 'code', label: '代码行', count: s.code, color: 'var(--green)', opacity: 1 },
    { key: 'comment', label: '注释行', count: s.comment, color: 'var(--green)', opacity: 0.45 },
    { key: 'blank', label: '空行', count: s.blank, color: 'var(--line)', opacity: 1 }
  ]
})

function segWidth(count) {
  const total = singleStats.value.total
  if (!total) return '0%'
  return ((count / total) * 100).toFixed(2) + '%'
}

/* ===================== 批量文件统计 ===================== */
const fileTotals = computed(() => {
  const acc = { total: 0, code: 0, comment: 0, blank: 0 }
  for (const f of fileResults.value) {
    acc.total += f.stats.total
    acc.code += f.stats.code
    acc.comment += f.stats.comment
    acc.blank += f.stats.blank
  }
  return acc
})

const langGroups = computed(() => {
  const map = new Map()
  for (const f of fileResults.value) {
    if (!map.has(f.langKey)) {
      map.set(f.langKey, { langKey: f.langKey, label: f.langLabel, files: 0, total: 0, code: 0, comment: 0, blank: 0 })
    }
    const g = map.get(f.langKey)
    g.files++
    g.total += f.stats.total
    g.code += f.stats.code
    g.comment += f.stats.comment
    g.blank += f.stats.blank
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

function densityOf(s) {
  const base = (s.code || 0) + (s.comment || 0)
  if (!base) return '0.0%'
  return ((s.comment / base) * 100).toFixed(1) + '%'
}

function share(g) {
  const total = fileTotals.value.total
  if (!total) return '0%'
  return ((g.total / total) * 100).toFixed(2) + '%'
}

const LANG_BAR_OPACITY = [1, 0.8, 0.64, 0.5, 0.38, 0.28, 0.2, 0.14]
function groupOpacity(i) {
  return LANG_BAR_OPACITY[i] || 0.1
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('read error'))
    reader.readAsText(file)
  })
}

async function addFiles(list) {
  const files = Array.from(list || [])
  if (!files.length) return
  error.value = ''
  for (const file of files) {
    if (fileResults.value.length >= 30) {
      error.value = '最多同时分析 30 个文件，多余文件已忽略'
      break
    }
    if (file.size > 2 * 1024 * 1024) {
      error.value = `文件 ${file.name} 超过 2 MB，已跳过`
      continue
    }
    try {
      const text = await readFileText(file)
      const key = detectByFileName(file.name)
      fileResults.value.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        langKey: key,
        langLabel: (LANGUAGES[key] || LANGUAGES.plaintext).label,
        stats: analyze(text, key, opts)
      })
    } catch {
      error.value = `文件 ${file.name} 读取失败`
    }
  }
  dragOver.value = false
}

function handleFileInput(e) {
  addFiles(e.target.files)
  e.target.value = ''
}

function handleDrop(e) {
  addFiles(e.dataTransfer && e.dataTransfer.files)
}

/* ===================== 操作 ===================== */
async function copyTextTo(text, okMsg) {
  error.value = ''
  if (!text) return
  if (await copyText(text)) {
    success.value = okMsg
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
    setTimeout(() => { error.value = '' }, 2500)
  }
}

function reportText() {
  const s = singleStats.value
  const pct = (v, base) => (base ? ((v / base) * 100).toFixed(1) + '%' : '0.0%')
  return [
    '=== 代码行数统计 ===',
    '语言：' + resolvedLabel.value,
    '总行数：' + s.total,
    '代码行：' + s.code + '（' + pct(s.code, s.total) + '）',
    '注释行：' + s.comment + '（' + pct(s.comment, s.total) + '）',
    '空行：' + s.blank + '（' + pct(s.blank, s.total) + '）',
    '注释密度：' + s.commentDensity.toFixed(1) + '%',
    '有效代码字符：' + s.codeChars,
    '总字符数：' + s.chars,
    'UTF-8 字节：' + s.bytes,
    '非空行：' + s.nonBlank,
    '最长行：' + s.longest,
    '平均行长度：' + s.avgLen.toFixed(1)
  ].join('\n')
}

function batchText() {
  const out = ['=== 批量文件行数统计 ===']
  out.push('文件\t语言\t行数\t代码\t注释\t空行\t注释率')
  for (const f of fileResults.value) {
    out.push([f.name, f.langLabel, f.stats.total, f.stats.code, f.stats.comment, f.stats.blank, densityOf(f.stats)].join('\t'))
  }
  const t = fileTotals.value
  out.push(['合计', '', t.total, t.code, t.comment, t.blank, densityOf(t)].join('\t'))
  if (langGroups.value.length > 1) {
    out.push('')
    out.push('=== 按语言分类 ===')
    out.push('语言\t文件数\t总行数\t代码行\t注释行\t空行\t占比')
    for (const g of langGroups.value) {
      out.push([g.label, g.files, g.total, g.code, g.comment, g.blank, share(g)].join('\t'))
    }
  }
  return out.join('\n')
}

const copyReport = () => copyTextTo(reportText(), '统计报告已复制')
const copyInput = () => copyTextTo(input.value, '输入代码已复制')
const copyBatch = () => copyTextTo(batchText(), '批量统计已复制')

const SAMPLE = `/**
 * 示例：计算斐波那契数列
 * 演示代码 / 注释 / 空行统计
 */
import { performance } from 'node:perf_hooks'

const cache = new Map()

// 带缓存的递归实现
function fib(n) {
  if (n <= 1) return n
  if (cache.has(n)) return cache.get(n)
  const value = fib(n - 1) + fib(n - 2)
  cache.set(n, value)
  return value // 记忆化，避免重复计算
}

/* 批量计算并输出结果
   覆盖 0 ~ 30 的全部项 */
function run(limit = 30) {
  const start = performance.now()
  const result = []

  for (let i = 0; i <= limit; i++) {
    result.push(fib(i))
  }

  const cost = performance.now() - start
  console.log('结果：', result.join(', '))
  console.log('耗时：' + cost.toFixed(2) + ' ms')
}

run()
`

function loadSample() {
  input.value = SAMPLE
  langKey.value = 'javascript'
  error.value = ''
}

function clearAll() {
  input.value = ''
  langKey.value = 'auto'
  error.value = ''
  success.value = ''
}

function clearFiles() {
  fileResults.value = []
  error.value = ''
}
</script>

<style scoped>
/* ===== 语言选择行 ===== */
.lang-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lang-select {
  flex: 1 1 220px;
  min-width: 0;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  height: 40px;
  padding: 0 10px;
  border-radius: 0;
  outline: 0;
  cursor: pointer;
}

.lang-select:focus {
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.lang-badge {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  border: 1px solid var(--line);
  background: var(--green-soft);
  padding: 4px 8px;
  white-space: nowrap;
}

/* ===== 统计面板 ===== */
.stats-section {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 12px;
  min-height: 200px;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.stats-placeholder {
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: 13px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
  line-height: 1.8;
}

.stats-inner {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 8px;
}

.stats-head-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.mini-copy {
  font-family: var(--mono);
  font-size: 12px;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  color: var(--accent);
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.mini-copy:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  align-content: start;
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

/* ===== 分布条 ===== */
.dist-title {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dist-bar {
  display: flex;
  width: 100%;
  height: 14px;
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 0;
  overflow: hidden;
}

.dist-seg {
  height: 100%;
  transition: width 0.2s;
}

.lang-bar {
  margin-top: 4px;
}

.dist-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  display: inline-block;
  border: 1px solid var(--line);
}

/* ===== 上传区域 ===== */
.upload-area {
  border: 1px dashed var(--line-strong);
  background: var(--panel-2);
  border-radius: 0;
  padding: 18px 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.upload-area:hover,
.upload-area.is-drag {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.upload-icon {
  font-size: 24px;
}

.upload-text {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
}

.upload-hint {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ===== 批量结果 ===== */
.batch-block {
  margin-top: 4px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--line);
  border-bottom: 0;
  background: var(--panel);
  padding: 8px 12px;
}

.panel-head-sub {
  border-top: 0;
  margin-top: 12px;
}

.panel-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  background: var(--panel-2);
}

.loc-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
}

.loc-table th,
.loc-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
  text-align: left;
}

.loc-table th:last-child,
.loc-table td:last-child {
  border-right: 0;
}

.loc-table thead th {
  color: var(--green);
  background: var(--panel);
  text-transform: uppercase;
  font-weight: normal;
  letter-spacing: 0.5px;
}

.loc-table tbody tr:hover td {
  background: var(--green-soft);
}

.loc-table tfoot td {
  background: var(--panel);
  color: var(--green);
  border-bottom: 0;
  font-weight: bold;
}

.loc-table .num {
  text-align: right;
  color: var(--accent);
}

.loc-table tfoot td.num {
  color: var(--green);
}

.file-cell {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 14px;
  }

  .loc-table {
    font-size: 11px;
  }

  .loc-table th,
  .loc-table td {
    padding: 6px 8px;
  }

  .file-cell {
    max-width: 140px;
  }
}
</style>
