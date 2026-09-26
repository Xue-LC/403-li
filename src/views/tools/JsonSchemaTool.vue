<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📋 JSON Schema 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">JSON 样本数据：</label>
            <textarea
              v-model="input"
              placeholder='粘贴 JSON 样本数据，自动生成 JSON Schema…

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
            <label class="tool-label">生成的 JSON Schema：</label>
            <textarea
              v-model="output"
              readonly
              rows="14"
              class="code-input output"
              placeholder="JSON Schema 将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="radio-group" style="margin-bottom: 12px;">
          <label class="radio-label">
            <input type="radio" v-model="draftVersion" value="2020-12" />
            <span>Draft 2020-12</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="draftVersion" value="07" />
            <span>Draft-07</span>
          </label>
        </div>

        <div class="options-group" style="margin-bottom: 12px;">
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.inferRequired" checked />
            <span>推断必填字段</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.additionalProperties" />
            <span>允许额外属性</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="opts.intDetection" checked />
            <span>整数检测 (integer vs number)</span>
          </label>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="generate" :disabled="!input.trim()">
            ⚡ 生成 Schema
          </button>
          <button class="tool-button" @click="formatOutput" :disabled="!output.trim()">
            ✨ 格式化
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">❌ 错误：{{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>

        <div v-if="stats" class="stats-section" style="margin-top: 16px;">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">顶层类型</span>
              <span class="stat-value">{{ stats.rootType }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">属性数量</span>
              <span class="stat-value">{{ stats.propertyCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">嵌套深度</span>
              <span class="stat-value">{{ stats.maxDepth }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">必填字段</span>
              <span class="stat-value">{{ stats.requiredCount }}</span>
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
const draftVersion = ref('2020-12')
const opts = reactive({
  inferRequired: true,
  additionalProperties: false,
  intDetection: true
})
const stats = ref(null)

const SCHEMA_URLS = {
  '2020-12': 'https://json-schema.org/draft/2020-12/schema',
  '07': 'http://json-schema.org/draft-07/schema#'
}

function inferType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'number') {
    if (opts.intDetection && Number.isInteger(value)) return 'integer'
    return 'number'
  }
  if (t === 'string') return 'string'
  if (t === 'boolean') return 'boolean'
  return 'string'
}

function generateSchemaFromValue(value, depth = 0) {
  if (depth > 20) return { type: 'string', description: 'Max depth exceeded' }

  const type = inferType(value)

  if (type === 'null') {
    return { type: 'null' }
  }

  if (type === 'string') {
    return { type: 'string' }
  }

  if (type === 'integer') {
    return { type: 'integer' }
  }

  if (type === 'number') {
    return { type: 'number' }
  }

  if (type === 'boolean') {
    return { type: 'boolean' }
  }

  if (type === 'array') {
    if (value.length === 0) {
      return { type: 'array', items: {} }
    }
    // Merge item schemas if multiple types
    const itemSchemas = value.map(item => generateSchemaFromValue(item, depth + 1))
    const merged = mergeSchemas(itemSchemas)
    return { type: 'array', items: merged }
  }

  // object
  const schema = {
    type: 'object',
    properties: {}
  }

  const keys = Object.keys(value)
  if (keys.length > 0 && opts.inferRequired) {
    schema.required = keys
  }

  schema.properties = {}
  for (const key of keys) {
    schema.properties[key] = generateSchemaFromValue(value[key], depth + 1)
  }

  if (opts.additionalProperties) {
    schema.additionalProperties = true
  } else {
    schema.additionalProperties = false
  }

  return schema
}

function mergeSchemas(schemas) {
  if (schemas.length === 0) return {}
  if (schemas.length === 1) return schemas[0]

  // Check if all types are the same
  const types = schemas.map(s => s.type)
  const uniqueTypes = [...new Set(types)]

  if (uniqueTypes.length === 1) {
    const baseType = uniqueTypes[0]
    if (baseType === 'object') {
      // Merge all object properties
      const allKeys = new Set()
      schemas.forEach(s => {
        if (s.properties) Object.keys(s.properties).forEach(k => allKeys.add(k))
      })
      const merged = { type: 'object', properties: {} }
      for (const key of allKeys) {
        const propSchemas = schemas
          .filter(s => s.properties && s.properties[key])
          .map(s => s.properties[key])
        if (propSchemas.length > 0) {
          merged.properties[key] = mergeSchemas(propSchemas)
        }
      }
      // Required = keys present in all objects
      if (opts.inferRequired && schemas.every(s => s.required)) {
        const commonRequired = schemas[0].required.filter(k =>
          schemas.every(s => s.required && s.required.includes(k))
        )
        if (commonRequired.length > 0) {
          merged.required = commonRequired
        }
      }
      merged.additionalProperties = opts.additionalProperties
      return merged
    }
    if (baseType === 'array') {
      const itemSchemas = schemas.map(s => s.items || {}).filter(Boolean)
      return { type: 'array', items: mergeSchemas(itemSchemas) }
    }
    return schemas[0]
  }

  // Mixed types
  return { oneOf: schemas }
}

function getStats(value, schema) {
  const stats = {
    rootType: inferType(value),
    propertyCount: 0,
    maxDepth: 0,
    requiredCount: 0
  }

  function walk(obj, depth) {
    stats.maxDepth = Math.max(stats.maxDepth, depth)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const keys = Object.keys(obj)
      stats.propertyCount += keys.length
      if (schema && schema.required && Array.isArray(schema.required)) {
        stats.requiredCount += schema.required.length
      }
      for (const key of keys) {
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
    const schema = generateSchemaFromValue(parsed)
    const wrapper = {
      $schema: SCHEMA_URLS[draftVersion.value],
      ...schema
    }
    output.value = JSON.stringify(wrapper, null, 2)
    stats.value = getStats(parsed, schema)
    success.value = 'Schema 生成成功'
  } catch (e) {
    error.value = 'Schema 生成失败：' + e.message
  }
}

function formatOutput() {
  if (!output.value.trim()) return
  try {
    const parsed = JSON.parse(output.value)
    output.value = JSON.stringify(parsed, null, 2)
    success.value = '格式化成功'
    setTimeout(() => { if (success.value === '格式化成功') success.value = '' }, 2000)
  } catch (e) {
    error.value = '格式化失败：' + e.message
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { if (success.value === '已复制到剪贴板') success.value = '' }, 2000)
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
/* 组件特有样式 */
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
