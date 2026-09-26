<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🛤️ 正则表达式可视化</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <!-- 左侧：输入区域 -->
          <div class="tool-col">
            <label class="tool-label">正则表达式：</label>
            <div class="regex-pattern-wrapper">
              <span class="regex-slash">/</span>
              <input
                v-model="pattern"
                type="text"
                placeholder="输入正则表达式..."
                class="regex-pattern-input"
                @input="onPatternChange"
              />
              <span class="regex-slash">/</span>
              <input
                v-model="flags"
                type="text"
                placeholder="gimsuy"
                class="regex-flags-input"
                maxlength="6"
                @input="onPatternChange"
              />
            </div>
            <div class="flags-hint">
              <span class="hint-text">g:全局 i:忽略大小写 m:多行 s:单行 u:Unicode y:粘连</span>
            </div>

            <!-- 常用示例模板 -->
            <label class="tool-label">常用示例：</label>
            <div class="template-buttons">
              <button
                v-for="t in templates"
                :key="t.name"
                class="template-btn"
                @click="applyTemplate(t)"
              >
                {{ t.name }}
              </button>
            </div>
          </div>

          <!-- 右侧：铁路图预览 -->
          <div class="tool-col">
            <label class="tool-label">铁路图预览：</label>
            <div class="diagram-container" ref="diagramContainer">
              <div v-if="!svgContent && !error && !pattern" class="diagram-placeholder">
                输入正则表达式后自动生成铁路图
              </div>
              <div v-else-if="error" class="diagram-error">
                ❌ {{ error }}
              </div>
              <div v-else-if="svgContent" class="diagram-svg-wrapper" v-html="svgContent"></div>
            </div>
            <div class="diagram-info" v-if="svgContent && pattern">
              <span class="info-text">正则: /{{ pattern }}/{{ flags }}</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="generate" :disabled="!pattern">
            🔄 生成铁路图
          </button>
          <button class="tool-button" @click="copySvg" :disabled="!svgContent">
            📋 复制 SVG
          </button>
          <button class="tool-button danger" @click="clearAll">
            🗑️ 清空
          </button>
        </div>

        <div class="button-group">
          <button class="tool-button" @click="downloadSvg" :disabled="!svgContent">
            💾 导出 SVG 文件
          </button>
        </div>

        <!-- 错误/成功提示 -->
        <div v-if="parseError" class="status-error">❌ {{ parseError }}</div>
        <div v-if="successMsg" class="status-success">✅ {{ successMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import regexpTree from 'regexp-tree'
import {
  Diagram,
  Sequence,
  Choice,
  Optional,
  OneOrMore,
  ZeroOrMore,
  Terminal,
  NonTerminal,
  Skip
} from 'railroad-diagrams'

const pattern = ref('')
const flags = ref('')
const svgContent = ref('')
const parseError = ref('')
const successMsg = ref('')
const diagramContainer = ref(null)

// 防抖定时器
let debounceTimer = null

// 常用模板
const templates = [
  { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+', flags: 'i' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(:\\d+)?(/[\\w./%-]*)?', flags: 'i' },
  { name: '手机号', pattern: '1[3-9]\\d{9}', flags: '' },
  { name: 'IPv4', pattern: '(\\d{1,3}\\.){3}\\d{1,3}', flags: '' },
  { name: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: '' },
  { name: '十六进制颜色', pattern: '#[0-9a-fA-F]{3,8}', flags: '' },
  { name: '中文', pattern: '[\\u4e00-\\u9fff]+', flags: '' },
  { name: 'HTML标签', pattern: '<(\\w+)[^>]*>.*?</\\1>', flags: 's' },
  { name: '正整数', pattern: '[1-9]\\d*', flags: '' },
  { name: '金额', pattern: '\\d+(\\.\\d{1,2})?', flags: '' },
]

// 输入变化时防抖生成
function onPatternChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    generate()
  }, 400)
}

// 应用模板
function applyTemplate(t) {
  pattern.value = t.pattern
  flags.value = t.flags
  generate()
}

// 核心：将 regexp-tree AST 转换为 railroad-diagrams 元素
function astToRailroad(node, depth = 0) {
  if (!node) return new Skip()

  switch (node.type) {
    case 'RegExp':
      return astToRailroad(node.body, depth)

    case 'Alternative': {
      const items = (node.expressions || [])
        .map(e => astToRailroad(e, depth))
        .filter(e => e)
      if (items.length === 0) return new Skip()
      if (items.length === 1) return items[0]
      return new Sequence(...items)
    }

    case 'Disjunction': {
      // Flatten binary disjunction tree into flat list
      const branches = []
      function collectBranches(n) {
        if (n.type === 'Disjunction') {
          collectBranches(n.left)
          collectBranches(n.right)
        } else {
          branches.push(astToRailroad(n, depth + 1))
        }
      }
      collectBranches(node)
      if (branches.length === 0) return new Skip()
      if (branches.length === 1) return branches[0]
      return new Choice(0, ...branches)
    }

    case 'Repetition': {
      const inner = astToRailroad(node.expression, depth + 1)
      const q = node.quantifier
      const kind = q.kind
      const greedy = q.greedy !== false

      let result
      if (kind === '*') {
        result = new ZeroOrMore(inner)
      } else if (kind === '+') {
        result = new OneOrMore(inner)
      } else if (kind === '?') {
        result = new Optional(inner)
      } else if (kind === 'Range') {
        const from = q.from
        const to = q.to

        if (from === 0 && to === 1) {
          result = new Optional(inner)
        } else if (from === 0 && to === undefined) {
          result = new ZeroOrMore(inner)
        } else if (from === 1 && to === undefined) {
          result = new OneOrMore(inner)
        } else if (from === to) {
          // Exact count: repeat 'from' times
          const items = []
          for (let i = 0; i < from; i++) {
            items.push(inner)
          }
          result = new Sequence(...items)
        } else if (to === undefined) {
          // {n,} = n times + OneOrMore
          const items = []
          for (let i = 0; i < from; i++) {
            items.push(inner)
          }
          items.push(new OneOrMore(inner))
          result = new Sequence(...items)
        } else {
          // {n,m}
          const items = []
          for (let i = 0; i < from; i++) {
            items.push(inner)
          }
          const optionals = []
          for (let i = from; i < to; i++) {
            optionals.push(inner)
          }
          if (optionals.length > 0) {
            items.push(new Optional(new Sequence(...optionals)))
          }
          result = new Sequence(...items)
        }
      } else {
        result = inner
      }

      // Handle non-greedy quantifiers
      if (!greedy && result) {
        // Wrap to indicate non-greedy - use a comment-like label
        // For simplicity, we just render it normally; non-greedy is noted via the label
      }

      return result
    }

    case 'Group': {
      const inner = astToRailroad(node.expression, depth + 1)
      if (node.capturing && node.name) {
        // Named capturing group
        return new NonTerminal('(?<' + node.name + '>...)')
      } else if (node.capturing) {
        // Numbered capturing group
        if (node.number !== undefined) {
          return new NonTerminal('Group #' + node.number)
        }
        return new NonTerminal('(...)')
      } else {
        // Non-capturing group - just pass through
        return inner
      }
    }

    case 'Char': {
      // Get display text for char
      const raw = node.raw || node.value
      const display = node.escaped ? raw : escapeHtml(raw)
      return new Terminal(display)
    }

    case 'CharacterClass': {
      // Get raw representation
      const raw = getNodeRaw(node)
      return new Terminal(raw)
    }

    case 'Assertion': {
      const kind = node.kind
      if (kind === '^' || kind === '$') {
        return new Terminal(kind)
      }
      if (kind === '\\b' || kind === '\\B') {
        return new Terminal(kind)
      }
      if (kind === 'Lookahead') {
        const label = (node.negative ? '?!' : '?=') + '...'
        return new NonTerminal('(' + label + ')')
      }
      if (kind === 'Lookbehind') {
        const label = (node.negative ? '?<!' : '?<=') + '...'
        return new NonTerminal('(' + label + ')')
      }
      return new Terminal(node.raw || kind)
    }

    case 'Backreference': {
      return new Terminal('\\' + (node.number || node.reference))
    }

    default:
      // Unknown node type - try to get raw text
      return new Terminal(node.raw || node.type || '?')
  }
}

// 从 AST 节点获取原始文本
function getNodeRaw(node) {
  if (!node) return '?'
  if (node.raw) return node.raw
  if (node.type === 'CharacterClass') {
    const exprs = node.expressions || []
    const parts = exprs.map(e => {
      if (e.type === 'ClassRange') {
        return (e.from ? getNodeRaw(e.from) : '') + '-' + (e.to ? getNodeRaw(e.to) : '')
      }
      return getNodeRaw(e)
    })
    const inner = parts.join('')
    return node.negative ? '[^' + inner + ']' : '[' + inner + ']'
  }
  if (node.type === 'Char') {
    return node.value || ''
  }
  return ''
}

// HTML 转义
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 生成铁路图
async function generate() {
  parseError.value = ''
  successMsg.value = ''
  svgContent.value = ''

  if (!pattern.value.trim()) {
    return
  }

  try {
    // 先验证正则表达式是否合法（使用原生 RegExp）
    try {
      new RegExp(pattern.value, flags.value)
    } catch (e) {
      parseError.value = '正则表达式语法错误：' + e.message
      return
    }

    // 使用 regexp-tree 解析
    let ast
    try {
      const regexStr = '/' + pattern.value + '/' + flags.value
      ast = regexpTree.parse(regexStr)
    } catch (e) {
      parseError.value = '解析失败：' + e.message
      return
    }

    // 转换为 railroad 元素
    const rrElement = astToRailroad(ast.body || ast)

    // 生成 Diagram（自动添加 Start/End 箭头）
    const diagram = new Diagram(rrElement)

    // 获取 SVG 字符串
    const svgStr = diagram.toString()

    svgContent.value = svgStr
  } catch (e) {
    parseError.value = '生成铁路图失败：' + e.message
  }
}

// 复制 SVG 代码
async function copySvg() {
  if (!svgContent.value) return
  try {
    await navigator.clipboard.writeText(svgContent.value)
    successMsg.value = 'SVG 代码已复制到剪贴板'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (e) {
    parseError.value = '复制失败：' + e.message
  }
}

// 导出 SVG 文件
function downloadSvg() {
  if (!svgContent.value) return
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'regex-railroad.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  successMsg.value = 'SVG 文件已下载'
  setTimeout(() => { successMsg.value = '' }, 2000)
}

// 清空
function clearAll() {
  pattern.value = ''
  flags.value = ''
  svgContent.value = ''
  parseError.value = ''
  successMsg.value = ''
}
</script>

<style scoped>
/* === 正则输入行 === */
.regex-pattern-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 8px 12px;
}

.regex-slash {
  color: var(--red);
  font-family: var(--mono);
  font-size: 16px;
  font-weight: bold;
}

.regex-pattern-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 0;
  outline: none;
}

.regex-pattern-input::placeholder {
  color: var(--dim);
}

.regex-flags-input {
  width: 60px;
  border: none;
  background: transparent;
  color: var(--accent);
  font-family: var(--mono);
  font-size: 14px;
  padding: 0;
  outline: none;
  text-align: center;
}

.regex-flags-input::placeholder {
  color: var(--dim);
}

/* === Flags 提示 === */
.flags-hint {
  margin-top: 4px;
  margin-bottom: 8px;
}

.hint-text {
  color: var(--dim);
  font-family: var(--mono);
  font-size: 11px;
}

/* === 模板按钮 === */
.template-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-btn {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.template-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 10px var(--green-glow);
}

/* === 铁路图容器 === */
.diagram-container {
  border: 1px solid var(--line);
  background: var(--panel);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}

.diagram-placeholder {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 14px;
  text-align: center;
  padding: 40px 20px;
}

.diagram-error {
  color: var(--red);
  font-family: var(--mono);
  font-size: 13px;
  padding: 40px 20px;
  text-align: center;
}

.diagram-svg-wrapper {
  width: 100%;
  overflow-x: auto;
}

.diagram-svg-wrapper :deep(svg.railroad-diagram) {
  max-width: 100%;
  height: auto;
  background: transparent;
}

.diagram-svg-wrapper :deep(svg.railroad-diagram path) {
  stroke: var(--green);
}

.diagram-svg-wrapper :deep(svg.railroad-diagram rect) {
  fill: var(--panel-2);
  stroke: var(--green);
}

.diagram-svg-wrapper :deep(svg.railroad-diagram text) {
  fill: var(--text);
  font-family: var(--mono);
  font-size: 14px;
}

/* === 图信息 === */
.diagram-info {
  margin-top: 8px;
}

.info-text {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
}

/* === 响应式 === */
@media (max-width: 640px) {
  .diagram-container {
    min-height: 150px;
    padding: 10px;
  }

  .regex-pattern-wrapper {
    padding: 6px 8px;
  }

  .regex-pattern-input {
    font-size: 13px;
  }

  .template-btn {
    font-size: 11px;
    padding: 5px 8px;
  }

  .diagram-svg-wrapper :deep(svg.railroad-diagram text) {
    font-size: 11px;
  }
}
</style>
