<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🗄️ SQL 格式化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">SQL 输入：</label>
            <textarea
              v-model="input"
              placeholder="SELECT id, name FROM users WHERE status = 'active' ORDER BY name ASC"
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

// ── SQL Keyword Sets ──────────────────────────────────────────────

const TOP_CLAUSES = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR',
  'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL',
  'ON', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'WITH', 'AS', 'RETURNING',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'GRANT', 'REVOKE', 'TRUNCATE',
  'EXPLAIN', 'ANALYZE', 'VACUUM', 'PRAGMA',
  'DISTINCT', 'TOP',
])

const CLAUSE_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR',
  'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL',
  'ON', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'CREATE', 'ALTER', 'DROP', 'TABLE',
  'WITH', 'RETURNING',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'DISTINCT',
])

const JOIN_KEYWORDS = new Set([
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL', 'ON',
])

const CTE_KEYWORDS = new Set(['WITH', 'AS'])

// ── Tokenizer ─────────────────────────────────────────────────────

function tokenize(sql) {
  const tokens = []
  let i = 0
  const len = sql.length

  while (i < len) {
    const ch = sql[i]

    // Whitespace
    if (/\s/.test(ch)) {
      let ws = ''
      while (i < len && /\s/.test(sql[i])) {
        ws += sql[i]
        i++
      }
      tokens.push({ type: 'ws', value: ws })
      continue
    }

    // Single-line comment --
    if (ch === '-' && sql[i + 1] === '-') {
      let comment = '--'
      i += 2
      while (i < len && sql[i] !== '\n') {
        comment += sql[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    // Block comment /* */
    if (ch === '/' && sql[i + 1] === '*') {
      let comment = '/*'
      i += 2
      let depth = 1
      while (i < len && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          comment += '/*'
          i += 2
          depth++
          continue
        }
        if (sql[i] === '*' && sql[i + 1] === '/') {
          comment += '*/'
          i += 2
          depth--
          continue
        }
        comment += sql[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    // Single-quoted string
    if (ch === "'") {
      let str = "'"
      i++
      while (i < len) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          str += "''"
          i += 2
          continue
        }
        if (sql[i] === "'") {
          str += "'"
          i++
          break
        }
        if (sql[i] === '\\') {
          str += sql[i]
          i++
          if (i < len) {
            str += sql[i]
            i++
          }
          continue
        }
        str += sql[i]
        i++
      }
      tokens.push({ type: 'string', value: str })
      continue
    }

    // Double-quoted identifier
    if (ch === '"') {
      let str = '"'
      i++
      while (i < len) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          str += '""'
          i += 2
          continue
        }
        if (sql[i] === '"') {
          str += '"'
          i++
          break
        }
        str += sql[i]
        i++
      }
      tokens.push({ type: 'identifier', value: str })
      continue
    }

    // Backtick identifier (MySQL)
    if (ch === '`') {
      let str = '`'
      i++
      while (i < len) {
        if (sql[i] === '`') {
          str += '`'
          i++
          break
        }
        str += sql[i]
        i++
      }
      tokens.push({ type: 'identifier', value: str })
      continue
    }

    // Number
    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < len && /[0-9.eExXa-fA-F]/.test(sql[i])) {
        num += sql[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Parentheses and special punctuation
    if ('(),;'.includes(ch)) {
      const delimMap = { '(': 'lparen', ')': 'rparen', ',': 'comma', ';': 'semi' }
      tokens.push({ type: delimMap[ch], value: ch })
      i++
      continue
    }

    // Operators
    if ('=<>!+-*/%'.includes(ch)) {
      let op = ch
      i++
      // Two-char operators
      if (i < len && '=><'.includes(sql[i]) && op !== sql[i]) {
        op += sql[i]
        i++
      }
      tokens.push({ type: 'operator', value: op })
      continue
    }

    // Dot (for schema.table.column)
    if (ch === '.') {
      tokens.push({ type: 'dot', value: '.' })
      i++
      continue
    }

    // Identifier or keyword (word characters + some specials)
    if (/[a-zA-Z_$#@]/.test(ch)) {
      let word = ''
      while (i < len && /[a-zA-Z0-9_$#@]/.test(sql[i])) {
        word += sql[i]
        i++
      }
      const upper = word.toUpperCase()
      if (TOP_CLAUSES.has(upper)) {
        tokens.push({ type: 'keyword', value: upper })
      } else {
        tokens.push({ type: 'identifier', value: word })
      }
      continue
    }

    // Unknown — pass through
    tokens.push({ type: 'unknown', value: ch })
    i++
  }

  return tokens
}

// ── SQL Beautifier ────────────────────────────────────────────────

function beautifySQL(sql) {
  const tokens = tokenize(sql)

  const lines = []
  let currentLine = ''
  let indentLevel = 0
  const indentStr = '  '
  let parenDepth = 0

  // State tracking
  let isSelectClause = false        // Inside SELECT clause (comma-separated fields)
  let isFromClause = false          // Inside FROM clause (comma-separated tables, joins)
  let isCaseBlock = false           // Inside CASE block
  let isCTE = false                 // Inside CTE definition
  let selectFieldIndent = 0          // Extra indent for SELECT fields

  function newLine() {
    if (currentLine.trim()) {
      lines.push(currentLine.trimEnd())
    }
    currentLine = ''
  }

  function indent() {
    return indentStr.repeat(indentLevel + selectFieldIndent)
  }

  // Process tokens
  for (let ti = 0; ti < tokens.length; ti++) {
    const token = tokens[ti]
    const prev = ti > 0 ? tokens[ti - 1] : null
    const next = ti < tokens.length - 1 ? tokens[ti + 1] : null

    if (token.type === 'ws') {
      // Collapse whitespace into spaces (ignore newlines — we handle structure)
      if (currentLine && !currentLine.endsWith(' ')) {
        // Only add space if we're mid-line and not after operator
        // We'll handle spacing later
      }
      continue
    }

    if (token.type === 'comment') {
      // Block comment
      if (token.value.startsWith('/*')) {
        if (token.value.includes('\n')) {
          newLine()
          currentLine = indent() + token.value.replace(/\n/g, '\n' + indent())
          newLine()
        } else {
          if (currentLine && !currentLine.endsWith(' ')) {
            currentLine += ' '
          }
          currentLine += token.value
        }
      } else {
        // Line comment
        if (currentLine && !currentLine.endsWith(' ')) {
          currentLine += ' '
        }
        currentLine += token.value
        newLine()
      }
      continue
    }

    // ── Keywords ──────────────────────────────────────────────

    if (token.type === 'keyword') {
      const kw = token.value

      // CTE handling
      if (kw === 'WITH') {
        newLine()
        currentLine = indent() + kw
        isCTE = true
        continue
      }

      if (isCTE && kw === 'AS') {
        currentLine += ' ' + kw
        continue
      }

      // SELECT — start new clause
      if (kw === 'SELECT') {
        newLine()
        currentLine = indent() + kw
        isSelectClause = true
        isFromClause = false
        isCaseBlock = false
        isCTE = false
        selectFieldIndent = 0
        continue
      }

      // DISTINCT
      if (kw === 'DISTINCT' && isSelectClause) {
        currentLine += ' ' + kw
        continue
      }

      // INTO
      if (kw === 'INTO') {
        currentLine += ' ' + kw
        isSelectClause = false
        isFromClause = true
        continue
      }

      // CASE
      if (kw === 'CASE') {
        if (isSelectClause || isFromClause) {
          currentLine += ' ' + kw
        } else {
          currentLine += (currentLine ? ' ' : '') + kw
        }
        isCaseBlock = true
        indentLevel++
        newLine()
        continue
      }

      if (isCaseBlock) {
        if (kw === 'WHEN') {
          currentLine = indent() + kw
          continue
        }
        if (kw === 'THEN') {
          currentLine += ' ' + kw
          continue
        }
        if (kw === 'ELSE') {
          newLine()
          currentLine = indent() + kw
          continue
        }
        if (kw === 'END') {
          indentLevel = Math.max(0, indentLevel - 1)
          newLine()
          currentLine = indent() + kw
          isCaseBlock = false
          continue
        }
      }

      // Clause starters
      if (kw === 'FROM') {
        newLine()
        currentLine = indent() + kw
        isSelectClause = false
        isFromClause = true
        selectFieldIndent = 0
        continue
      }

      if (kw === 'WHERE' || kw === 'HAVING') {
        newLine()
        currentLine = indent() + kw
        isSelectClause = false
        isFromClause = false
        selectFieldIndent = 0
        continue
      }

      if (kw === 'AND' || kw === 'OR') {
        // If already on a new indented line, keep going
        if (isSelectClause && (prev && prev.type === 'comma')) {
          // AND/OR in a select expression
          currentLine += ' ' + kw
        } else {
          newLine()
          currentLine = indent() + indentStr + kw
        }
        continue
      }

      // JOIN clauses
      if (kw === 'JOIN' || kw === 'INNER' || kw === 'LEFT' || kw === 'RIGHT' ||
          kw === 'OUTER' || kw === 'CROSS' || kw === 'FULL') {
        if (isFromClause) {
          newLine()
          currentLine = indent() + kw
          isFromClause = true
        } else {
          currentLine += (currentLine ? ' ' : '') + kw
        }
        continue
      }

      if (kw === 'ON') {
        newLine()
        currentLine = indent() + indentStr + kw
        isFromClause = false
        continue
      }

      // ORDER BY, GROUP BY
      if (kw === 'ORDER' || kw === 'GROUP') {
        newLine()
        currentLine = indent() + kw
        isSelectClause = false
        isFromClause = false
        selectFieldIndent = 0
        continue
      }

      if (kw === 'BY') {
        if (currentLine.endsWith('ORDER') || currentLine.endsWith('GROUP')) {
          currentLine += ' ' + kw
        } else {
          currentLine += (currentLine ? ' ' : '') + kw
        }
        continue
      }

      // LIMIT, OFFSET
      if (kw === 'LIMIT' || kw === 'OFFSET') {
        newLine()
        currentLine = indent() + kw
        selectFieldIndent = 0
        continue
      }

      // UNION, INTERSECT, EXCEPT
      if (kw === 'UNION' || kw === 'INTERSECT' || kw === 'EXCEPT') {
        newLine()
        currentLine = indent() + kw
        selectFieldIndent = 0
        continue
      }

      if (kw === 'ALL') {
        if (currentLine.endsWith('UNION') || currentLine.endsWith('INTERSECT') ||
            currentLine.endsWith('EXCEPT')) {
          currentLine += ' ' + kw
        } else {
          currentLine += (currentLine ? ' ' : '') + kw
        }
        continue
      }

      // INSERT, UPDATE, DELETE, CREATE, ALTER, DROP
      if (kw === 'INSERT') {
        newLine()
        currentLine = indent() + kw
        isSelectClause = false
        isFromClause = false
        selectFieldIndent = 0
        continue
      }

      if (kw === 'UPDATE' || kw === 'DELETE' || kw === 'CREATE' ||
          kw === 'ALTER' || kw === 'DROP') {
        newLine()
        currentLine = indent() + kw
        selectFieldIndent = 0
        isSelectClause = false
        isFromClause = false
        continue
      }

      if (kw === 'SET') {
        if (!isSelectClause) {
          newLine()
          currentLine = indent() + kw
          selectFieldIndent = 0
        } else {
          currentLine += (currentLine ? ' ' : '') + kw
        }
        isSelectClause = false
        continue
      }

      if (kw === 'VALUES') {
        newLine()
        currentLine = indent() + kw
        selectFieldIndent = 0
        continue
      }

      // Generic — if we're in a clause, just append with space
      if (currentLine && !currentLine.endsWith(' ') && !currentLine.endsWith('(')) {
        currentLine += ' '
      }
      currentLine += kw
      continue
    }

    // ── Punctuation ──────────────────────────────────────────────

    if (token.type === 'lparen') {
      // Subquery detection: SELECT directly after (
      const nextKw = next && next.type === 'keyword' && next.value === 'SELECT'
      if (nextKw) {
        if (currentLine && !currentLine.endsWith('(') && !currentLine.endsWith(' ')) {
          currentLine += ' '
        }
        currentLine += '('
        newLine()
        indentLevel++
      } else {
        if (currentLine && !currentLine.endsWith('(') && !currentLine.endsWith(' ')
            && !currentLine.endsWith('IN') && !currentLine.endsWith('VALUES')) {
          currentLine += ' '
        }
        currentLine += '('
      }
      parenDepth++
      continue
    }

    if (token.type === 'rparen') {
      parenDepth = Math.max(0, parenDepth - 1)
      currentLine += ')'
      continue
    }

    if (token.type === 'comma') {
      currentLine += ','
      if (isSelectClause) {
        newLine()
        currentLine = indent() + indentStr
      } else if (isFromClause) {
        newLine()
        currentLine = indent() + indentStr
      } else if (isCTE) {
        newLine()
        currentLine = indent()
      }
      continue
    }

    if (token.type === 'semi') {
      currentLine += ';'
      newLine()
      continue
    }

    // ── Dot ───────────────────────────────────────────────────────

    if (token.type === 'dot') {
      currentLine += '.'
      continue
    }

    // ── Operator ──────────────────────────────────────────────────

    if (token.type === 'operator') {
      if (!currentLine.endsWith(' ')) {
        currentLine += ' '
      }
      currentLine += token.value
      if (next && next.type !== 'ws' && next.type !== 'rparen'
          && next.type !== 'lparen' && next.type !== 'comma') {
        currentLine += ' '
      }
      continue
    }

    // ── String, Number, Identifier ───────────────────────────────

    if (token.type === 'string' || token.type === 'number' || token.type === 'identifier') {
      // Spacing
      if (currentLine) {
        const lastChar = currentLine.slice(-1)
        if (lastChar !== '(' && lastChar !== '.' && lastChar !== ' '
            && lastChar !== '\n') {
          currentLine += ' '
        }
      }
      currentLine += token.value
      continue
    }

    // ── Unknown ───────────────────────────────────────────────────

    if (currentLine && !currentLine.endsWith(' ')) {
      currentLine += ' '
    }
    currentLine += token.value
  }

  // Flush last line
  if (currentLine.trim()) {
    lines.push(currentLine.trimEnd())
  }

  // Clean up: remove trailing blank lines, ensure single newline
  let result = lines.join('\n')
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.trim()
  if (result) result += '\n'

  return result
}

// ── SQL Minifier ─────────────────────────────────────────────────

function minifySQL(sql) {
  const tokens = tokenize(sql)
  let result = ''
  let prevType = ''

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const pt = prevType

    if (token.type === 'ws' || token.type === 'comment') {
      continue
    }

    // Determine if we need a space
    const needSpace = () => {
      if (!pt) return false
      if (token.type === 'semi' || token.type === 'comma' ||
          token.type === 'rparen' || token.type === 'dot') return false
      if (pt === 'lparen' || pt === 'dot') return false
      if (token.type === 'lparen' && (pt === 'keyword' || pt === 'identifier')) {
        return false
      }
      return true
    }

    if (needSpace()) {
      result += ' '
    }

    result += token.value
    prevType = token.type
  }

  return result.trim()
}

// ── Actions ──────────────────────────────────────────────────────

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

function format() {
  clearStatus()
  if (!input.value.trim()) {
    error.value = '请输入 SQL 语句'
    return
  }
  try {
    const formatted = beautifySQL(input.value)
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
    error.value = '请输入 SQL 语句'
    return
  }
  try {
    const compressed = minifySQL(input.value)
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
/* All styling uses shared classes from tools.css */
</style>
