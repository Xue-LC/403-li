<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔷 JSON → TypeScript 类型</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">JSON 数据：</label>
            <textarea
              v-model="input"
              placeholder='粘贴 JSON 数据，自动生成 TypeScript 类型…

示例：
{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "tags": ["dev", "web"],
  "address": {
    "city": "Beijing",
    "zip": "100000"
  }
}'
              rows="14"
              class="code-input"
              @input="onInputChange"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">TypeScript 类型定义：</label>
            <textarea
              v-model="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="TypeScript 类型将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;">
          <div style="flex: 1; min-width: 140px;">
            <label class="tool-label" style="margin-top: 0; margin-bottom: 6px;">根类型名称：</label>
            <input
              v-model="rootName"
              class="code-input-sm"
              style="padding-right: 12px;"
              placeholder="Root"
            />
          </div>
          <div class="radio-group" style="margin-bottom: 0;">
            <label class="radio-label">
              <input type="radio" v-model="exportKind" value="interface" />
              <span>interface</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="exportKind" value="type" />
              <span>type</span>
            </label>
          </div>
        </div>

        <div class="options-group" style="margin-top: 12px;">
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.optionalFields" />
            <span>所有字段可选 (?)</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.semicolons" checked />
            <span>使用分号</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.exportAll" checked />
            <span>导出所有类型</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.pascalCase" checked />
            <span>PascalCase 命名</span>
          </label>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="generate" :disabled="!input.trim()">
            ⚡ 生成类型
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button" @click="copyInput" :disabled="!input.trim()">
            📋 复制输入
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <div v-if="stats" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">顶层类型</span>
              <span class="stat-value">{{ stats.rootType }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">接口数量</span>
              <span class="stat-value">{{ stats.interfaceCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">属性数量</span>
              <span class="stat-value">{{ stats.propertyCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">嵌套深度</span>
              <span class="stat-value">{{ stats.maxDepth }}</span>
            </div>
          </div>
        </div>
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
const rootName = ref('Root')
const exportKind = ref('interface')
const opts = reactive({
  optionalFields: false,
  semicolons: true,
  exportAll: true,
  pascalCase: true
})
const stats = ref(null)

function toPascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toCamelCase(str) {
  const pascal = toPascalCase(str)
  if (!pascal) return ''
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function safePropName(key) {
  // If key is a valid JS identifier, use it as-is; otherwise quote it
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key
  return `'${key.replace(/'/g, "\\'")}'`
}

function inferTsType(value) {
  if (value === null) return { kind: 'null' }
  if (Array.isArray(value)) return { kind: 'array' }
  const t = typeof value
  if (t === 'string') return { kind: 'string' }
  if (t === 'number') return { kind: Number.isInteger(value) ? 'number' : 'number' }
  if (t === 'boolean') return { kind: 'boolean' }
  return { kind: 'unknown' }
}

function generateTypesFromValue(value, interfaceName, collected) {
  const name = interfaceName || rootName.value

  if (value === null) return { tsType: 'null' }
  if (typeof value === 'string') return { tsType: 'string' }
  if (typeof value === 'number') return { tsType: 'number' }
  if (typeof value === 'boolean') return { tsType: 'boolean' }

  if (Array.isArray(value)) {
    if (value.length === 0) return { tsType: 'any[]' }
    const itemTypes = value.map(item => generateTypesFromValue(item, name + 'Item', collected))
    const merged = mergeTsTypes(itemTypes)
    return { tsType: `${merged.tsType}[]` }
  }

  // Object
  if (collected.has(name)) {
    return { tsType: name }
  }

  const keys = Object.keys(value)
  const props = []

  for (const key of keys) {
    const val = value[key]
    let propName = safePropName(key)
    const subName = name + (opts.pascalCase ? toPascalCase(key) : toCamelCase(key))

    if (val === null) {
      props.push({ name: propName, tsType: 'null', optional: true })
      continue
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        props.push({ name: propName, tsType: 'any[]', optional: opts.optionalFields })
        continue
      }
      const itemTypes = val.map(item => generateTypesFromValue(item, subName + 'Item', collected))
      const merged = mergeTsTypes(itemTypes)
      const typeStr = merged.isInterface ? `${merged.tsType}[]` : `${merged.tsType}[]`
      props.push({ name: propName, tsType: typeStr, optional: opts.optionalFields })
      continue
    }

    if (val !== null && typeof val === 'object') {
      const result = generateTypesFromValue(val, subName, collected)
      props.push({ name: propName, tsType: result.tsType, optional: opts.optionalFields })
      continue
    }

    const ts = inferTsType(val)
    props.push({ name: propName, tsType: ts.kind, optional: opts.optionalFields })
  }

  const sep = opts.semicolons ? ';' : ''
  const exp = (opts.exportAll && collected.size === 0) ? 'export ' : ''
  const lines = [`${exp}${exportKind.value} ${name} {`]
  for (const prop of props) {
    const opt = prop.optional ? '?' : ''
    lines.push(`  ${prop.name}${opt}: ${prop.tsType}${sep}`)
  }
  lines.push('}')

  collected.set(name, { definition: lines.join('\n'), propCount: props.length })
  return { tsType: name, isInterface: true }
}

function mergeTsTypes(types) {
  if (types.length === 0) return { tsType: 'any' }
  if (types.length === 1) return types[0]

  const tsTypes = types.map(t => t.tsType)
  const unique = [...new Set(tsTypes)]

  if (unique.length === 1) return { tsType: unique[0] }
  return { tsType: unique.join(' | ') }
}

function getStats(value, collected) {
  const stats = {
    rootType: '',
    interfaceCount: collected.size,
    propertyCount: 0,
    maxDepth: 0
  }

  if (value === null) {
    stats.rootType = 'null'
    return stats
  }
  if (Array.isArray(value)) {
    stats.rootType = 'array'
  } else if (typeof value === 'object') {
    stats.rootType = 'object'
  } else {
    stats.rootType = typeof value
  }

  for (const [, entry] of collected) {
    stats.propertyCount += entry.propCount
  }

  function walk(obj, depth) {
    stats.maxDepth = Math.max(stats.maxDepth, depth)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        walk(obj[key], depth + 1)
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        walk(item, depth + 1)
      }
    }
  }

  walk(value, 1)
  return stats
}

function onInputChange() {
  if (error.value && input.value.trim()) {
    error.value = ''
  }
}

function generate() {
  error.value = ''
  success.value = ''
  stats.value = null

  const trimmed = input.value.trim()
  if (!trimmed) {
    error.value = '请输入 JSON 数据'
    return
  }

  let parsed
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    error.value = 'JSON 解析失败：' + e.message
    return
  }

  try {
    const collected = new Map()
    const rootTypeName = opts.pascalCase ? toPascalCase(rootName.value) || 'Root' : rootName.value || 'Root'
    generateTypesFromValue(parsed, rootTypeName, collected)

    const definitions = []
    // Root first, then rest
    if (collected.has(rootTypeName)) {
      definitions.push(collected.get(rootTypeName).definition)
    }
    for (const [name, entry] of collected) {
      if (name !== rootTypeName) {
        definitions.push((opts.exportAll ? 'export ' : '') + entry.definition)
      }
    }

    output.value = definitions.join('\n\n') + '\n'
    stats.value = getStats(parsed, collected)
    success.value = '类型生成成功'
  } catch (e) {
    error.value = '类型生成失败：' + e.message
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '类型已复制到剪贴板'
    setTimeout(() => { if (success.value === '类型已复制到剪贴板') success.value = '' }, 2000)
  }
}

async function copyInput() {
  if (!input.value.trim()) return
  if (await copyText(input.value)) {
    success.value = '输入已复制到剪贴板'
    setTimeout(() => { if (success.value === '输入已复制到剪贴板') success.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
  stats.value = null
}
</script>

<style scoped>
.stats-section {
  margin-top: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  background: var(--panel);
  border: 1px solid var(--line);
  padding: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.stat-value {
  display: block;
  font-family: var(--mono);
  font-size: 18px;
  color: var(--green);
  font-weight: bold;
}

.options-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .options-group {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 375px) {
  .stat-value {
    font-size: 15px;
  }
}
</style>
