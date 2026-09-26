<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>⚡ JavaScript 压缩美化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">
              JS 输入：
              <button
                class="copy-btn-inline"
                @click="copyInput"
                :disabled="!input.trim()"
                title="复制输入内容"
              >📋</button>
            </label>
            <textarea
              v-model="input"
              placeholder="粘贴 JavaScript 代码..."
              rows="14"
              class="code-input"
              spellcheck="false"
              @input="clearStatus"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">
              输出：
              <button
                class="copy-btn-inline"
                @click="copyOutput"
                :disabled="!output.trim()"
                title="复制输出内容"
              >📋</button>
            </label>
            <textarea
              :value="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="结果将显示在这里..."
              spellcheck="false"
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
            <div class="stat-item">
              <span class="stat-label">行数</span>
              <span class="stat-value">{{ stats.lines }}</span>
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
const stats = reactive({ originalSize: '', outputSize: '', ratio: '', lines: '' })

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
  stats.lines = formatted.split('\n').length
  showStats.value = true
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

/* ================= Tokenizer ================= */

const MULTI_OPS = [
  '===', '!==', '>>>', '**=', '&&=', '||=', '??=', '<<=', '>>=', '>>>=',
  '=>', '...', '??', '?.', '&&', '||', '++', '--', '+=', '-=', '*=', '/=',
  '%=', '&=', '|=', '^=', '<<', '>>', '<=', '>=', '==', '!=', '**',
  '=', '+', '-', '*', '/', '%', '&', '|', '^', '~', '!', '<', '>',
  '?', ':', ',', ';', '(', ')', '[', ']', '{', '}', '.', '@', '#'
]

// 这些位置后面紧跟的 / 是正则字面量而不是除法
const REGEX_AFTER_OPS = new Set([
  '(', '[', '{', ',', ';', ':', '=', '!', '&', '|', '?', '+', '-', '*',
  '%', '^', '~', '<', '>', '/', '&&', '||', '??', '==', '===', '!=',
  '!==', '=>', '...'
])
const REGEX_AFTER_WORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await', 'default', 'extends',
  'from', 'as'
])

function tokenize(code) {
  const tokens = []
  let i = 0
  const n = code.length
  let sawNewline = false

  const isIdentStart = (c) => /[A-Za-z_$]/.test(c) || c.charCodeAt(0) > 127
  const isIdentPart = (c) => /[A-Za-z0-9_$]/.test(c) || c.charCodeAt(0) > 127
  const isDigit = (c) => c >= '0' && c <= '9'

  const push = (type, value, unary = false) => {
    tokens.push({ type, value, prevNewline: sawNewline, unary })
    sawNewline = false
  }

  while (i < n) {
    const c = code[i]

    if (c === '\n' || c === '\r') { sawNewline = true; i++; continue }
    if (c === ' ' || c === '\t' || c === '\f' || c === '\v') { i++; continue }

    // 行注释
    if (c === '/' && code[i + 1] === '/') {
      let j = i + 2
      while (j < n && code[j] !== '\n') j++
      push('comment', code.slice(i, j))
      i = j
      continue
    }

    // 块注释
    if (c === '/' && code[i + 1] === '*') {
      let j = i + 2
      while (j < n && !(code[j] === '*' && code[j + 1] === '/')) j++
      j = Math.min(n, j + 2)
      push('comment', code.slice(i, j))
      i = j
      continue
    }

    // 单引号/双引号字符串
    if (c === "'" || c === '"') {
      const quote = c
      let j = i + 1
      let buf = quote
      while (j < n) {
        const ch = code[j]
        if (ch === '\\') { buf += ch + (code[j + 1] || ''); j += 2; continue }
        if (ch === quote) { buf += quote; j++; break }
        buf += ch; j++
      }
      push('string', buf)
      i = j
      continue
    }

    // 模板字符串（含 ${...} 表达式，整体保护）
    if (c === '`') {
      let j = i + 1
      let buf = '`'
      while (j < n) {
        const ch = code[j]
        if (ch === '\\') { buf += ch + (code[j + 1] || ''); j += 2; continue }
        if (ch === '`') { buf += '`'; j++; break }
        if (ch === '$' && code[j + 1] === '{') {
          buf += '${'; j += 2
          let depth = 1
          while (j < n && depth > 0) {
            const ch2 = code[j]
            if (ch2 === '\\') { buf += ch2 + (code[j + 1] || ''); j += 2; continue }
            if (ch2 === "'" || ch2 === '"' || ch2 === '`') {
              const q = ch2
              buf += q; j++
              while (j < n && code[j] !== q) {
                if (code[j] === '\\') { buf += code[j] + (code[j + 1] || ''); j += 2; continue }
                buf += code[j]; j++
              }
              if (j < n) { buf += q; j++ }
              continue
            }
            if (ch2 === '{') depth++
            else if (ch2 === '}') depth--
            buf += ch2; j++
          }
          continue
        }
        buf += ch; j++
      }
      push('template', buf)
      i = j
      continue
    }

    // 正则字面量（启发式判断）
    if (c === '/' && isRegexStart(tokens)) {
      let j = i + 1
      let buf = '/'
      let inClass = false
      while (j < n) {
        const ch = code[j]
        if (ch === '\\') { buf += ch + (code[j + 1] || ''); j += 2; continue }
        if (ch === '[') inClass = true
        else if (ch === ']') inClass = false
        else if (ch === '/' && !inClass) { buf += '/'; j++; break }
        else if (ch === '\n') break
        buf += ch; j++
      }
      while (j < n && /[A-Za-z]/.test(code[j])) { buf += code[j]; j++ }
      push('regex', buf)
      i = j
      continue
    }

    // 数字
    if (isDigit(c) || (c === '.' && isDigit(code[i + 1]))) {
      let j = i
      let buf = ''
      if (c === '0' && /[xXbBoO]/.test(code[i + 1] || '')) {
        buf += code[i] + code[i + 1]
        j += 2
        while (j < n && /[0-9a-fA-F_]/.test(code[j])) { buf += code[j]; j++ }
      } else {
        while (j < n && /[0-9_]/.test(code[j])) { buf += code[j]; j++ }
        if (code[j] === '.') {
          buf += '.'; j++
          while (j < n && /[0-9_]/.test(code[j])) { buf += code[j]; j++ }
        }
        if (/[eE]/.test(code[j] || '')) {
          buf += code[j]; j++
          if (/[+-]/.test(code[j] || '')) { buf += code[j]; j++ }
          while (j < n && /[0-9_]/.test(code[j])) { buf += code[j]; j++ }
        }
      }
      if (code[j] === 'n') { buf += 'n'; j++ }
      push('word', buf)
      i = j
      continue
    }

    // 标识符 / 关键字
    if (isIdentStart(c)) {
      let j = i
      let buf = ''
      while (j < n && isIdentPart(code[j])) { buf += code[j]; j++ }
      push('word', buf)
      i = j
      continue
    }

    // 操作符
    let matched = null
    for (const op of MULTI_OPS) {
      if (code.startsWith(op, i)) { matched = op; break }
    }
    if (matched) {
      // 标记一元 + / -（用于美化时决定是否在后操作数前加空格）
      const unary =
        (matched === '+' || matched === '-') && isUnaryOpContext(tokens)
      push('op', matched, unary)
      i += matched.length
      continue
    }

    // 未知字符：跳过（保持容错）
    i++
  }
  return tokens
}

function isRegexStart(tokens) {
  const prev = tokens[tokens.length - 1]
  if (!prev) return true
  if (prev.type === 'op') return REGEX_AFTER_OPS.has(prev.value)
  if (prev.type === 'word') return REGEX_AFTER_WORDS.has(prev.value)
  return false
}

// 判断当前 +/- 是否为一元运算符（-1、+x、a = -b 等）
function isUnaryOpContext(tokens) {
  const prev = tokens[tokens.length - 1]
  if (!prev) return true
  if (prev.type === 'op') {
    if (prev.value === ')' || prev.value === ']' || prev.value === '}' || prev.value === '++' || prev.value === '--') return false
    return true
  }
  if (prev.type === 'word') return KEYWORDS_AFTER_SPACE.has(prev.value)
  return false
}

/* ================= 美化（格式化） ================= */

const KEYWORDS_BEFORE_PAREN = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'with', 'function', 'return',
  'typeof', 'void', 'delete', 'new', 'throw', 'await', 'yield', 'in',
  'of', 'instanceof', 'extends', 'case', 'do', 'else', 'async'
])
const KEYWORDS_AFTER_SPACE = new Set([
  'const', 'let', 'var', 'return', 'typeof', 'void', 'delete', 'new',
  'throw', 'yield', 'await', 'in', 'of', 'instanceof', 'case', 'extends',
  'as', 'from', 'else', 'do'
])
const UNARY_BEFORE_OPS = new Set([
  '(', '[', '{', ',', ';', '?', ':', '=', '=>', '...', '!', '~', '&&',
  '||', '??', '+', '-', '*', '/', '%', '&', '|', '^', '<', '>', '==',
  '===', '!=', '!==', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
  '**', '<<', '>>', '>>>', '<=', '>=', '<<=', '>>=', '>>>=', '&&=', '||=', '??='
])
const NO_SPACE_AFTER_OP = new Set(['(', '[', '.', '?.', '...', '!', '~', '++', '--', '@', '#'])
const NO_SPACE_BEFORE_PAREN = new Set(['(', '[', '.', '?.', '...', '!', '~', '++', '--', '@', '#', ')', ']', '}'])
const AFTER_CLOSE_JOIN = new Set([';', ',', ')', ']', '.', '?.', '(', '=>', ':'])
const CLOSE_WORDS_JOIN = new Set(['else', 'catch', 'finally', 'while', 'in', 'of', 'instanceof', 'extends', 'as', 'from'])
const OBJECT_BRACE_BEFORE_WORDS = new Set(['return', 'yield', 'throw', 'case', 'default', 'new', 'typeof', 'void', 'delete', 'await', 'extends', 'in', 'of'])
// 一元 +/- 前需要空格的排除集合（操作数起始位置直接紧跟）
const UNARY_JOIN_OPS = new Set(['(', '[', '{', '?', '=>', '!', '~', '...'])

function asiRisk(prev, tok) {
  if (!prev) return false
  const pv = prev.value
  const prevEndsStmt =
    prev.type === 'word' || prev.type === 'string' || prev.type === 'template' || prev.type === 'regex' ||
    (prev.type === 'op' && (pv === ')' || pv === ']' || pv === '}' || pv === '++' || pv === '--'))
  if (!prevEndsStmt) return false
  const tokStartsExpr =
    tok.type === 'word' || tok.type === 'string' || tok.type === 'template' || tok.type === 'regex' ||
    (tok.type === 'op' && ['(', '[', '{', '+', '-', '/'].includes(tok.value))
  return prevEndsStmt && tokStartsExpr
}

function spaceBefore(prev, tok) {
  if (!prev) return false
  const pv = prev.value
  const tv = tok.value

  // 正则后跟标识符必须空格（避免被解析为正则标志）
  if (prev.type === 'regex' && tok.type === 'word') return true
  // 数字后跟 . 必须空格（避免 1.toString 语法错误）
  if (prev.type === 'word' && /^\d/.test(pv) && tok.type === 'op' && tv === '.') return true
  // 一元 + / - 后无需空格（-x）
  if (prev.type === 'op' && (pv === '+' || pv === '-') && prev.unary) return false

  if (prev.type === 'word') {
    if (tok.type !== 'op') return true
    if (tv === '[' && KEYWORDS_AFTER_SPACE.has(pv)) return true
    if (['(', '[', '.', '?.', ';', ',', ')', ']', '++', '--', '!', '~', ':', '...', '@', '#'].includes(tv)) return false
    return true
  }

  if (prev.type === 'string' || prev.type === 'template' || prev.type === 'regex') {
    if (tok.type === 'word') return true
    if (['.', '?.', ',', ')', ']', ';', ':', '(', '++', '--', '?'].includes(tv)) return false
    return true
  }

  // prev 是操作符
  if (NO_SPACE_AFTER_OP.has(pv)) return false
  if (pv === ')' || pv === ']' || pv === '}') {
    if (AFTER_CLOSE_JOIN.has(tv)) return false
    if (pv === '}' && tv === '[') return false
    return true
  }
  return true
}

function beautifyJS(code) {
  const tokens = tokenize(code)
  if (tokens.length === 0) return ''

  // 计算每个 { 是否为"行内"块（短对象/单语句块保持单行）
  const blockInfo = new Map()
  const closeToOpen = new Map()
  {
    const stack = []
    for (let t = 0; t < tokens.length; t++) {
      const tok = tokens[t]
      if (tok.type === 'op' && tok.value === '{') stack.push(t)
      else if (tok.type === 'op' && tok.value === '}') {
        if (stack.length) {
          const open = stack.pop()
          let hasNested = false
          let hasSemi = false
          for (let k = open + 1; k < t; k++) {
            const tk = tokens[k]
            if (tk.type === 'op' && (tk.value === '{' || tk.value === '}')) hasNested = true
            if (tk.type === 'op' && tk.value === ';') hasSemi = true
          }
          // 仅对象字面量保持单行（{ 前是 = ( [ , : { ; => 或 return 等关键字）
          const prevTok = open > 0 ? tokens[open - 1] : null
          const isObject =
            (prevTok && prevTok.type === 'op' && ![')', ']', '}'].includes(prevTok.value)) ||
            (prevTok && prevTok.type === 'word' && OBJECT_BRACE_BEFORE_WORDS.has(prevTok.value))
          const inline = isObject && (t - open - 1) <= 10 && !hasNested && !hasSemi
          blockInfo.set(open, { inline, end: t })
          closeToOpen.set(t, open)
        }
      }
    }
  }

  const INDENT = '  '
  const lines = []
  let cur = ''
  let level = 0
  let prev = null
  let forParen = false
  let forParenDepth = 0
  let depth = 0
  const ternaryStack = []

  const flushLine = () => {
    if (cur.length > 0) { lines.push(cur.trimEnd()); cur = '' }
  }
  const emit = (text) => { cur += text }

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t]
    const next = tokens[t + 1] || null
    const v = tok.value

    // ASI 保护：源码中换行分隔的语句，美化后保持换行
    if (tok.prevNewline && prev && asiRisk(prev, tok)) {
      flushLine()
      cur = INDENT.repeat(level)
    }

    if (tok.type === 'comment') {
      if (v.startsWith('//')) {
        if (cur.length > 0) emit(' ')
        emit(v)
        flushLine()
      } else {
        if (cur.length > 0) emit(' ')
        emit(v)
        if (next && !(next.type === 'op' && ['}', ';', ',', ')'].includes(next.value))) flushLine()
      }
      prev = tok
      continue
    }

    if (tok.type === 'string' || tok.type === 'template' || tok.type === 'regex' || tok.type === 'word') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (spaceBefore(prev, tok)) emit(' ')
      emit(v)
      prev = tok
      continue
    }

    // ===== 操作符 =====
    if (v === '{') {
      depth++
      const info = blockInfo.get(t)
      if (info && info.inline) {
        if (cur.length === 0) cur = INDENT.repeat(level)
        else if (!(prev && prev.type === 'op' && (prev.value === '(' || prev.value === '['))) emit(' ')
        emit('{')
      } else {
        if (cur.length === 0) cur = INDENT.repeat(level)
        else if (!(prev && prev.type === 'op' && (prev.value === '(' || prev.value === '['))) emit(' ')
        emit('{')
        if (next && next.type === 'op' && next.value === '}') {
          // 空块 {}，保持同行
        } else {
          flushLine()
          level++
        }
      }
      prev = tok
      continue
    }

    if (v === '}') {
      depth = Math.max(0, depth - 1)
      const openIdx = closeToOpen.get(t)
      const info = openIdx != null ? blockInfo.get(openIdx) : null
      if (info && info.inline) {
        if (cur.length > 0 && !cur.trimEnd().endsWith('{')) emit(' ')
        emit('}')
      } else {
        if (cur.length > 0 && !cur.trimEnd().endsWith('{')) flushLine()
        level = Math.max(0, level - 1)
        cur = INDENT.repeat(level) + '}'
        const joinNext =
          next && (
            (next.type === 'op' && AFTER_CLOSE_JOIN.has(next.value)) ||
            (next.type === 'word' && CLOSE_WORDS_JOIN.has(next.value))
          )
        if (!joinNext) flushLine()
      }
      prev = tok
      continue
    }

    if (v === '(') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (
        prev &&
        ((prev.type === 'word' && KEYWORDS_BEFORE_PAREN.has(prev.value)) ||
          (prev.type === 'op' && !NO_SPACE_BEFORE_PAREN.has(prev.value)))
      ) emit(' ')
      if (prev && prev.type === 'word' && prev.value === 'for') forParen = true
      else if (forParen && !forParenDepth && prev && prev.type === 'op' && prev.value === '(') { /* 嵌套 ( 计数在下面 */ }
      emit('(')
      if (forParen && prev && prev.type === 'op' && prev.value === '(') forParenDepth++
      depth++
      prev = tok
      continue
    }

    if (v === ')') {
      emit(')')
      depth = Math.max(0, depth - 1)
      if (forParen) {
        if (forParenDepth > 0) forParenDepth--
        else forParen = false
      }
      prev = tok
      continue
    }

    if (v === '[' || v === ']') {
      if (v === '[') {
        if (cur.length === 0) cur = INDENT.repeat(level)
        else if (spaceBefore(prev, tok)) emit(' ')
      }
      emit(v)
      if (v === '[') depth++
      else depth = Math.max(0, depth - 1)
      prev = tok
      continue
    }

    if (v === ',') {
      emit(',')
      prev = tok
      continue
    }

    if (v === ';') {
      emit(';')
      if (!forParen) flushLine()
      prev = tok
      continue
    }

    if (v === '=>') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (!(prev && prev.type === 'op' && (prev.value === '(' || prev.value === '['))) emit(' ')
      emit('=>')
      prev = tok
      continue
    }

    if (v === '?') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (prev && !(prev.type === 'op' && ['(', '[', ',', ';', '{', ':', '?', '=>'].includes(prev.value))) emit(' ')
      emit('?')
      ternaryStack.push(depth)
      prev = tok
      continue
    }

    if (v === ':') {
      if (ternaryStack.length > 0 && ternaryStack[ternaryStack.length - 1] === depth) {
        if (cur.length > 0 && prev && !(prev.type === 'op' && ['(', '['].includes(prev.value))) emit(' ')
        ternaryStack.pop()
      }
      emit(':')
      prev = tok
      continue
    }

    if (v === '...') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (prev && !(prev.type === 'op' && ['(', '[', '{', ',', ';', '=', ':', '=>', '?', '...'].includes(prev.value))) emit(' ')
      emit('...')
      prev = tok
      continue
    }

    if (v === '++' || v === '--') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      emit(v)
      prev = tok
      continue
    }

    if (v === '!' || v === '~') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      else if (prev && !(prev.type === 'op' && ['(', '[', ',', ';', '?', ':', '{', '=>', '!', '~'].includes(prev.value))) emit(' ')
      emit(v)
      prev = tok
      continue
    }

    if (v === '.' || v === '?.') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      emit(v)
      prev = tok
      continue
    }

    if (v === '@' || v === '#') {
      if (cur.length === 0) cur = INDENT.repeat(level)
      emit(v)
      prev = tok
      continue
    }

    // 二元操作符 / 赋值（含一元 + - 特判）
    if (v === '+' || v === '-') {
      const isUnary = !prev || (prev.type === 'op' && UNARY_BEFORE_OPS.has(prev.value)) ||
        (prev.type === 'word' && KEYWORDS_AFTER_SPACE.has(prev.value))
      if (cur.length === 0) {
        cur = INDENT.repeat(level)
      } else if (isUnary) {
        if (prev && !(prev.type === 'op' && UNARY_JOIN_OPS.has(prev.value))) emit(' ')
      } else if (!(prev && prev.type === 'op' && ['(', '[', '{', ',', ';', '.', '?.', '=>', '?', ':', '!', '~', '...'].includes(prev.value))) {
        emit(' ')
      }
      emit(v)
      prev = tok
      continue
    }

    // 其他二元操作符
    if (cur.length === 0) cur = INDENT.repeat(level)
    else if (prev && !(prev.type === 'op' && ['(', '[', '{', ',', ';', '.', '?.', '=>', '?', ':', '!', '~', '...'].includes(prev.value))) emit(' ')
    emit(v)
    prev = tok
  }

  if (cur.length > 0) lines.push(cur.trimEnd())
  let result = lines.join('\n')
  result = result.replace(/[ \t]+$/gm, '')
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.trim()
  if (result) result += '\n'
  return result
}

/* ================= 压缩 ================= */

function needSpaceMin(prev, tok) {
  if (!prev) return false
  const pv = prev.value
  const tv = tok.value

  // 正则后跟标识符：必须空格（避免被解析为正则标志）
  if (prev.type === 'regex' && tok.type === 'word') return true
  // 数字后跟 . ：必须空格（避免 1.toString 语法错误）
  if (prev.type === 'word' && /^\d/.test(pv) && tok.type === 'op' && tv === '.') return true
  // / 后跟 / 或 * 或正则：必须空格（避免变成注释）
  if (prev.type === 'op' && pv === '/' && (tok.type === 'regex' || (tok.type === 'op' && (tv === '/' || tv === '*')))) return true
  // 以 + 或 - 结尾的操作符后跟以 + 或 - 开头的 token：必须空格（避免 a--b / a+++b 语义变化）
  if (prev.type === 'op' && /[+-]$/.test(pv) && tok.type === 'op' && /^[+-]/.test(tv)) return true
  // 标识符之间：必须空格（避免 consta / 1in 粘连）
  if (prev.type === 'word' && tok.type === 'word') return true

  return false
}

function minifyJS(code) {
  const tokens = tokenize(code)
  if (tokens.length === 0) return ''
  let out = ''
  let prev = null
  for (const tok of tokens) {
    if (tok.type === 'comment') continue
    if (prev) {
      if (tok.prevNewline && asiRisk(prev, tok)) out += '\n'
      else if (needSpaceMin(prev, tok)) out += ' '
    }
    out += tok.value
    prev = tok
  }
  return out.trim()
}

/* ================= 交互 ================= */

function format() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 JavaScript 代码'
    return
  }
  try {
    const formatted = beautifyJS(input.value)
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
    error.value = '请输入 JavaScript 代码'
    return
  }
  try {
    const compressed = minifyJS(input.value)
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

async function copyInput() {
  if (!input.value.trim()) return
  if (await copyText(input.value)) {
    success.value = '已复制输入内容'
    setTimeout(() => {
      if (success.value === '已复制输入内容') success.value = ''
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
/* 统计信息 */
.stats-section {
  margin-top: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: var(--mono);
  font-size: 15px;
  color: var(--green);
}

/* label 行内复制按钮 */
.copy-btn-inline {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: all 0.2s;
  vertical-align: middle;
}

.copy-btn-inline:hover:not(:disabled) {
  color: var(--green);
  transform: scale(1.1);
}

.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
