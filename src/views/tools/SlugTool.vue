<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>🔗 Slug 生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              rows="14"
              class="code-input"
              placeholder="输入标题或任意文本，如：Hello World! 你好，世界！"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">Slug 结果：</label>
            <textarea
              :value="slug"
              readonly
              rows="14"
              class="code-input output"
              placeholder="URL 友好的 slug 将实时显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 选项区（全宽） -->
        <div class="options-row">
          <div class="option-group">
            <label class="tool-label">分隔符：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="separator" value="-" />
                <span>连字符 -</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="separator" value="_" />
                <span>下划线 _</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="separator" value="." />
                <span>点号 .</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="separator" value="" />
                <span>无分隔</span>
              </label>
            </div>
          </div>

          <div class="option-group">
            <label class="tool-label">最大长度：{{ maxLength }} 字符</label>
            <input
              type="range"
              v-model.number="maxLength"
              min="5"
              max="120"
              step="1"
              class="range-input"
            />
          </div>

          <div class="option-group option-checks">
            <label class="checkbox-label">
              <input type="checkbox" v-model="lowercase" />
              <span>转小写</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="keepNumbers" />
              <span>保留数字</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="keepChinese" />
              <span>保留中文字符</span>
            </label>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="button-group button-group-3">
          <button class="tool-button primary" @click="copySlug" :disabled="!slug">
            📋 复制 Slug
          </button>
          <button class="tool-button" @click="copyInput" :disabled="!input">
            📋 复制输入
          </button>
          <button class="tool-button" @click="clear">🗑️ 清空</button>
        </div>

        <!-- 统计信息 -->
        <div v-if="slug" class="stats-section">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">输入字符数</span>
              <span class="stat-value">{{ input.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Slug 长度</span>
              <span class="stat-value">{{ slug.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">单词数</span>
              <span class="stat-value">{{ tokenCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">完整 URL</span>
              <span class="stat-value url-value">https://example.com/{{ slug }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../../utils/clipboard'

const input = ref('')
const separator = ref('-')
const maxLength = ref(60)
const lowercase = ref(true)
const keepNumbers = ref(true)
const keepChinese = ref(true)
const error = ref('')
const success = ref(false)

/**
 * 将文本拆分为 slug 单词：
 * - 连续中文字符作为整体保留
 * - 连续字母数字作为整体保留
 * - 其余字符（空格、标点、符号）视为分隔边界
 */
function splitTokens(text) {
  const pattern = keepChinese.value
    ? /[\u4e00-\u9fa5]+|[a-zA-Z0-9]+/g
    : /[a-zA-Z0-9]+/g
  return text.match(pattern) || []
}

function buildSlug(text) {
  if (!text) return ''

  let tokens = splitTokens(text)

  // 转小写
  if (lowercase.value) {
    tokens = tokens.map(t => t.toLowerCase())
  }

  // 移除数字
  if (!keepNumbers.value) {
    tokens = tokens
      .map(t => t.replace(/[0-9]+/g, ''))
      .filter(Boolean)
  }

  if (tokens.length === 0) return ''

  // 按最大长度截断（尽量保持完整单词）
  let parts = []
  let length = 0
  const sepLen = separator.value.length

  for (const token of tokens) {
    const cost = parts.length === 0 ? token.length : sepLen + token.length
    if (parts.length > 0 && length + cost > maxLength.value) break
    if (parts.length === 0 && token.length > maxLength.value) {
      // 首个单词就超长：直接按字符截断
      parts.push(token.slice(0, maxLength.value))
      length = maxLength.value
      break
    }
    parts.push(token)
    length += cost
  }

  return parts.join(separator.value)
}

const slug = computed(() => buildSlug(input.value))

const tokenCount = computed(() => splitTokens(input.value).length)

async function copySlug() {
  if (!slug.value) return
  if (await copyText(slug.value)) {
    success.value = 'Slug 已复制到剪贴板'
  } else {
    error.value = '复制失败，请手动复制'
  }
  flash()
}

async function copyInput() {
  if (!input.value) return
  if (await copyText(input.value)) {
    success.value = '输入已复制到剪贴板'
  } else {
    error.value = '复制失败，请手动复制'
  }
  flash()
}

function clear() {
  input.value = ''
  separator.value = '-'
  maxLength.value = 60
  lowercase.value = true
  keepNumbers.value = true
  keepChinese.value = true
  error.value = ''
  success.value = false
}

function flash() {
  setTimeout(() => {
    error.value = ''
    success.value = false
  }, 2000)
}
</script>

<style scoped>
.options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 14px 0 8px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-group > .tool-label {
  margin-bottom: 2px;
}

.option-group .range-input {
  width: 220px;
}

.option-checks {
  flex-direction: column;
  gap: 8px;
}

.option-checks .checkbox-label {
  margin: 0;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.stats-section {
  margin-top: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: var(--panel);
  min-width: 0;
}

.stat-label {
  color: var(--muted);
  font-size: 12px;
}

.stat-value {
  color: var(--green);
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .options-row {
    flex-direction: column;
    gap: 12px;
  }

  .option-group .range-input {
    width: 100%;
  }

  .radio-group {
    gap: 4px 10px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 14px;
  }
}
</style>
