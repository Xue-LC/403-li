<template>
  <!-- 工具主体 -->
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔄 JSON ↔ YAML 转换器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入：</label>
            <textarea
              v-model="input"
              placeholder='粘贴 JSON 或 YAML 内容…&#10;&#10;JSON 示例：{"name": "test", "value": 123}&#10;YAML 示例：name: test&#10;value: 123'
              rows="12"
              class="code-input"
              @input="onInputChange"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              v-model="output"
              readonly
              rows="12"
              class="code-input output"
              placeholder="转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>

        <div class="radio-group" style="margin-bottom: 12px;">
          <label class="radio-label">
            <input type="radio" v-model="direction" value="json-to-yaml" />
            <span>JSON → YAML</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="direction" value="yaml-to-json" />
            <span>YAML → JSON</span>
          </label>
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
import { ref, watch } from 'vue'
import yaml from 'js-yaml'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const output = ref('')
const direction = ref('json-to-yaml')
const error = ref('')
const success = ref('')

// 自动检测输入格式并切换方向
function onInputChange() {
  const trimmed = input.value.trim()
  if (!trimmed) return

  // 检测：以 { 或 [ 开头 → JSON；否则 → YAML
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    direction.value = 'json-to-yaml'
  } else {
    direction.value = 'yaml-to-json'
  }
}

function convert() {
  error.value = ''
  success.value = ''

  if (!input.value.trim()) {
    error.value = '请输入内容'
    return
  }

  try {
    if (direction.value === 'json-to-yaml') {
      const parsed = JSON.parse(input.value)
      output.value = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
      success.value = 'JSON 转 YAML 成功'
    } else {
      const parsed = yaml.load(input.value)
      output.value = JSON.stringify(parsed, null, 2)
      success.value = 'YAML 转 JSON 成功'
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
    if (direction.value === 'json-to-yaml') {
      // 当前输出是 YAML，重新格式化
      const parsed = yaml.load(output.value)
      output.value = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
    } else {
      // 当前输出是 JSON，重新格式化
      const parsed = JSON.parse(output.value)
      output.value = JSON.stringify(parsed, null, 2)
    }
    success.value = '格式化成功'
  } catch (e) {
    error.value = e.message || '格式化失败'
  }
}

async function copyOutput() {
  if (!output.value.trim()) return
  if (await copyText(output.value)) {
    success.value = '已复制到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
/* 组件特有样式 - 全部使用全局样式，这里仅做最小补充 */
</style>
