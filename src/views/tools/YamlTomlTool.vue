<template>
  <!-- 工具主体 -->
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔄 YAML ↔ TOML 转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <div class="col-head">
              <label class="tool-label">输入：</label>
              <button class="copy-btn-inline" @click="copyInput" :disabled="!input" title="复制输入内容">📋 复制</button>
            </div>
            <textarea
              v-model="input"
              placeholder='粘贴 YAML 或 TOML 内容…&#10;&#10;YAML 示例：&#10;name: test&#10;version: 1.0&#10;enabled: true&#10;&#10;TOML 示例：&#10;name = "test"&#10;version = 1.0&#10;enabled = true'
              rows="12"
              class="code-input"
              spellcheck="false"
              @input="autoDetect"
            ></textarea>
          </div>
          <div class="tool-col">
            <div class="col-head">
              <label class="tool-label">输出：</label>
              <button class="copy-btn-inline" @click="copyOutput" :disabled="!output" title="复制转换结果">📋 复制</button>
            </div>
            <textarea
              v-model="output"
              readonly
              rows="12"
              class="code-input output"
              spellcheck="false"
              placeholder="转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="radio-group" style="margin-bottom: 12px;">
          <label class="radio-label">
            <input type="radio" v-model="direction" value="auto" />
            <span>自动识别</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="direction" value="yaml-to-toml" />
            <span>YAML → TOML</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="direction" value="toml-to-yaml" />
            <span>TOML → YAML</span>
          </label>
        </div>

        <div v-if="detected && direction === 'auto'" class="detect-hint">
          <span>📡 已识别为 {{ detected }} 格式，将转换为 {{ detected === 'YAML' ? 'TOML' : 'YAML' }}</span>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="convert" :disabled="!input.trim()">
            🔄 转换
          </button>
          <button class="tool-button" @click="formatOutput" :disabled="!output.trim()">
            ✨ 格式化输出
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            📋 复制
          </button>
          <button class="tool-button danger full-width" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="error" class="status-error">
          ❌ 错误：{{ error }}
        </div>

        <div v-if="success" class="status-success">
          ✅ {{ success }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import yaml from 'js-yaml'
import { parse, stringify } from 'smol-toml'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const direction = ref('auto')
const detected = ref('')
const error = ref('')
const success = ref('')

/**
 * 启发式识别输入格式：
 * TOML 特征：`key = value` 赋值行、`[table]` 表头
 * YAML 特征：`key: value` 键值行
 */
function detectFormat(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return null

  let tomlScore = 0
  let yamlScore = 0
  for (const line of lines) {
    if (/^[\w."'-]+\s*=/.test(line) || (line.startsWith('[') && line.endsWith(']'))) {
      tomlScore++
    }
    if (/^[\w."'-]+\s*:/.test(line)) {
      yamlScore++
    }
  }

  if (tomlScore === yamlScore) {
    // 平局时按第一行判断
    const first = lines[0]
    if (/^[\w."'-]+\s*=/.test(first) || (first.startsWith('[') && first.endsWith(']'))) {
      return 'toml'
    }
    return 'yaml'
  }
  return tomlScore > yamlScore ? 'toml' : 'yaml'
}

// 自动识别模式下，输入变化时更新识别结果
function autoDetect() {
  if (direction.value !== 'auto') {
    detected.value = ''
    return
  }
  const trimmed = input.value.trim()
  if (!trimmed) {
    detected.value = ''
    return
  }
  const fmt = detectFormat(trimmed)
  detected.value = fmt === 'toml' ? 'TOML' : 'YAML'
}

// 递归将 Map（js-yaml 的 !!map 标签）转为普通对象，并清理 undefined
function normalize(v) {
  if (v instanceof Map) {
    const o = {}
    for (const [k, val] of v) o[String(k)] = normalize(val)
    return o
  }
  if (Array.isArray(v)) return v.map(normalize)
  if (v && typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v)) o[k] = normalize(v[k])
    return o
  }
  return v
}

function convert() {
  error.value = ''
  success.value = ''

  if (!input.value.trim()) {
    error.value = '请输入内容'
    return
  }

  const dir = direction.value === 'auto' ? detectFormat(input.value) : direction.value
  if (!dir) {
    error.value = '无法识别输入格式，请手动选择转换方向'
    return
  }

  try {
    if (dir === 'yaml-to-toml') {
      const parsed = normalize(yaml.load(input.value))
      if (parsed === null || parsed === undefined) {
        throw new Error('YAML 内容为空，没有可转换的数据')
      }
      if (typeof parsed !== 'object') {
        throw new Error('YAML 顶层必须是对象或数组才能转换为 TOML，当前顶层是 ' + typeof parsed)
      }
      if (Array.isArray(parsed)) {
        throw new Error('TOML 文档顶层必须是键值对表，不支持顶层数组，请用 key: [ ... ] 包裹数组')
      }
      output.value = stringify(parsed)
      success.value = 'YAML 转 TOML 成功'
    } else {
      const parsed = parse(input.value)
      output.value = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
      success.value = 'TOML 转 YAML 成功'
    }
  } catch (e) {
    error.value = e.message || '转换失败，请检查输入格式'
    output.value = ''
  }
}

function formatOutput() {
  error.value = ''
  success.value = ''

  if (!output.value.trim()) return

  try {
    const fmt = detectFormat(output.value)
    if (fmt === 'toml') {
      output.value = stringify(parse(output.value))
    } else {
      const parsed = yaml.load(output.value)
      output.value = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
    }
    success.value = '格式化成功'
  } catch (e) {
    error.value = e.message || '格式化失败'
  }
}

function flash(msg) {
  success.value = msg
  setTimeout(() => { success.value = '' }, 2000)
}

async function copyInput() {
  if (!input.value) return
  if (await copyText(input.value)) {
    flash('已复制输入内容')
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

async function copyOutput() {
  if (!output.value) return
  if (await copyText(output.value)) {
    flash('已复制转换结果')
  } else {
    error.value = '复制失败，请手动选择复制'
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
  detected.value = ''
}
</script>

<style scoped>
/* === 栏标题行（标签 + 复制按钮） === */
.col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.col-head .tool-label {
  margin: 0;
}

/* === 行内复制按钮 === */
.copy-btn-inline {
  padding: 4px 10px;
  font-family: var(--mono);
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--green);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn-inline:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
}

.copy-btn-inline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* === 自动识别提示 === */
.detect-hint {
  margin: 0 0 4px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.5px;
}
</style>
