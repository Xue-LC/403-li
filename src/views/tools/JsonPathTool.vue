<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔍 JSON Path 查询器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">JSON 数据：</label>
              <textarea
                v-model="jsonInput"
                placeholder='粘贴 JSON 数据，如 {"data":{"users":[{"name":"Alice"}]}}'
                rows="8"
                class="code-input"
                @input="autoQuery"
              ></textarea>
              <label class="tool-label" style="margin-top:12px">路径表达式：</label>
              <input
                v-model="pathExpr"
                type="text"
                placeholder="如 data.users[0].name"
                class="code-input-sm"
                style="width:100%"
                @input="autoQuery"
              />
              <div class="path-hints">
                <span class="hint-label">示例：</span>
                <button
                  v-for="example in examples"
                  :key="example.label"
                  class="hint-btn"
                  @click="applyExample(example)"
                >{{ example.label }}</button>
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">查询结果：</label>
              <textarea
                :value="formattedResult"
                readonly
                rows="8"
                class="code-input output"
                placeholder="查询结果将显示在这里..."
              ></textarea>
            </div>
          </div>

          <div class="button-group button-group-3">
            <button class="tool-button primary" @click="queryPath">🔍 查询</button>
            <button class="tool-button" @click="copyResult" :disabled="result === null || error">📋 复制结果</button>
            <button class="tool-button danger" @click="clear">🗑️ 清空</button>
          </div>

          <div v-if="error" class="status-error">❌ {{ error }}</div>
          <div v-if="success" class="status-success">✅ {{ success }}</div>

          <!-- 路径可视化 -->
          <div v-if="pathSegments.length && result !== null && result !== undefined && !error" class="path-section">
            <label class="tool-label">路径解析：</label>
            <div class="path-visual">
              <span v-for="(seg, idx) in pathSegments" :key="idx" class="seg-wrapper">
                <span v-if="idx > 0" class="path-sep"> → </span>
                <span v-if="seg.key !== null" class="seg-key">{{ seg.key }}</span>
                <span v-if="seg.index !== null" class="seg-index">[{{ seg.index }}]</span>
              </span>
            </div>
          </div>

          <!-- 结果类型展示 -->
          <div v-if="result !== null && result !== undefined && !error" class="result-meta">
            <span class="meta-item">类型：<strong>{{ resultType }}</strong></span>
            <span v-if="resultType === 'Array'" class="meta-item">长度：<strong>{{ result.length }}</strong></span>
            <span v-if="resultType === 'String'" class="meta-item">长度：<strong>{{ result.length }} 字符</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const jsonInput = ref('')
const pathExpr = ref('')
const result = ref(null)
const error = ref('')
const success = ref('')
const pathSegments = ref([])

const examples = [
  { label: '对象属性', path: 'store.book[0].title', json: '{"store":{"book":[{"title":"1984","price":12.99},{"title":"Dune","price":15.99}]}}' },
  { label: '嵌套数组', path: 'data.users[1].name', json: '{"data":{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}]}}' },
  { label: '简单路径', path: 'config.theme.colors.primary', json: '{"config":{"theme":{"colors":{"primary":"#0ff","bg":"#111"}}}}' },
  { label: '根级数组', path: 'items[0]', json: '{"items":["apple","banana","cherry"]}' },
  { label: '深层嵌套', path: 'a.b.c.d.e', json: '{"a":{"b":{"c":{"d":{"e":"found!"}}}}}' }
]

// Parse a path string into segments
function parsePath(path) {
  if (!path || !path.trim()) return []

  const segments = []
  // Remove leading/trailing dots and whitespace
  const clean = path.trim().replace(/^\.+|\.+$/g, '')
  if (!clean) return []

  const parts = clean.split('.')
  for (const part of parts) {
    if (!part) continue

    // Check for array indexing: key[index] or key[index1][index2]...[indexN]
    const keyMatch = part.match(/^(\w+)((?:\[\d+\])+)$/)
    if (keyMatch) {
      segments.push({ key: keyMatch[1], index: null })
      const brackets = keyMatch[2].match(/\[(\d+)\]/g)
      if (brackets) {
        for (const b of brackets) {
          segments.push({ key: null, index: parseInt(b.match(/\d+/)[0], 10) })
        }
      }
    } else {
      // Just a standalone [index]
      const bracketMatch = part.match(/^\[(\d+)\]$/)
      if (bracketMatch) {
        segments.push({ key: null, index: parseInt(bracketMatch[1], 10) })
      } else {
        segments.push({ key: part, index: null })
      }
    }
  }
  return segments
}

// Evaluate path against an object
function evaluatePath(obj, segments) {
  let current = obj
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined

    if (seg.key !== null) {
      current = current[seg.key]
    }
    if (seg.index !== null) {
      if (!Array.isArray(current)) return undefined
      if (seg.index < 0 || seg.index >= current.length) return undefined
      current = current[seg.index]
    }
  }
  return current
}

const formattedResult = computed(() => {
  if (result.value === null || result.value === undefined) return ''
  if (typeof result.value === 'string') return result.value
  try {
    return JSON.stringify(result.value, null, 2)
  } catch {
    return String(result.value)
  }
})

const resultType = computed(() => {
  if (result.value === null) return 'null'
  if (result.value === undefined) return 'undefined'
  if (Array.isArray(result.value)) return 'Array'
  if (typeof result.value === 'object') return 'Object'
  return typeof result.value === 'string' ? 'String' : typeof result.value
})

function queryPath() {
  error.value = ''
  success.value = ''
  result.value = null
  pathSegments.value = []

  if (!jsonInput.value.trim()) {
    error.value = '请输入 JSON 数据'
    return
  }

  let parsed
  try {
    parsed = JSON.parse(jsonInput.value)
  } catch (e) {
    error.value = 'JSON 解析失败：' + e.message
    return
  }

  if (!pathExpr.value.trim()) {
    error.value = '请输入路径表达式'
    return
  }

  const segments = parsePath(pathExpr.value)
  if (!segments.length) {
    error.value = '无效的路径表达式'
    return
  }

  pathSegments.value = segments

  try {
    const value = evaluatePath(parsed, segments)
    if (value === undefined) {
      error.value = '路径不存在或无法访问'
      return
    }
    result.value = value
    success.value = '查询成功'
    setTimeout(() => { success.value = '' }, 2000)
  } catch (e) {
    error.value = '路径查询出错：' + e.message
  }
}

function autoQuery() {
  if (jsonInput.value.trim() && pathExpr.value.trim()) {
    queryPath()
  } else {
    result.value = null
    error.value = ''
    pathSegments.value = []
  }
}

async function copyResult() {
  if (result.value !== null && result.value !== undefined) {
    const text = formattedResult.value
    if (await copyText(text)) {
      success.value = '已复制到剪贴板！'
      setTimeout(() => { success.value = '' }, 2000)
    }
  }
}

function clear() {
  jsonInput.value = ''
  pathExpr.value = ''
  result.value = null
  error.value = ''
  success.value = ''
  pathSegments.value = []
}

function applyExample(example) {
  jsonInput.value = example.json
  pathExpr.value = example.path
  queryPath()
}
</script>

<style scoped>
/* === Path Hints === */
.path-hints {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.hint-label {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
}

.hint-btn {
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
}

.hint-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 8px var(--green-glow);
}

/* === Path Visualization === */
.path-section {
  margin-top: 16px;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.path-visual {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  font-family: var(--mono);
  font-size: 14px;
}

.seg-wrapper {
  display: inline-flex;
  align-items: center;
}

.path-sep {
  color: var(--green);
  font-weight: bold;
  margin: 0 2px;
}

.seg-key {
  color: var(--text);
  background: var(--panel);
  padding: 2px 6px;
  border: 1px solid var(--line);
}

.seg-index {
  color: var(--green);
  font-weight: bold;
}

/* === Result Meta === */
.result-meta {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.meta-item strong {
  color: var(--green);
}

@media (max-width: 640px) {
  .path-visual {
    font-size: 12px;
  }
  .hint-btn {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>
