<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📝 Git Commit 信息生成器</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <!-- ✅ 双栏布局：桌面端左右并排，移动端上下堆叠 -->
        <div class="tool-two-col">
          <!-- 左栏：配置 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">提交配置：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制生成的提交信息"
                :disabled="!commitMessage"
                @click="copyGenerated"
              >📋</button>
            </div>

            <label class="tool-label">类型 (type)：</label>
            <select v-model="type" class="tool-select">
              <option v-for="t in commitTypes" :key="t.value" :value="t.value">
                {{ t.emoji }} {{ t.value }} — {{ t.label }}
              </option>
            </select>
            <p class="field-hint">{{ currentType.desc }}</p>

            <label class="tool-label">作用域 (scope，可选)：</label>
            <input
              v-model="scope"
              class="code-input-sm"
              placeholder="如 api / ui / auth（可留空）"
              spellcheck="false"
            />

            <label class="tool-label">简短描述 (description)*：</label>
            <input
              v-model="description"
              class="code-input-sm"
              placeholder="祈使句，如 add login form validation"
              spellcheck="false"
              @keydown.enter="copyGenerated"
            />

            <label class="tool-label">详细说明 (body，可选)：</label>
            <textarea
              v-model="body"
              class="code-input"
              rows="4"
              placeholder="说明改动原因、背景与影响（可留空）"
            ></textarea>

            <label class="tool-label">脚注 (footer，可选)：</label>
            <textarea
              v-model="footer"
              class="code-input"
              rows="2"
              placeholder="如 Closes #123 / Reviewed-by: xxx"
            ></textarea>

            <div class="options-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="breaking" />
                <span>破坏性变更 (BREAKING CHANGE)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="withEmoji" />
                <span>描述前附加 emoji</span>
              </label>
            </div>

            <template v-if="breaking">
              <label class="tool-label">破坏性变更说明：</label>
              <input
                v-model="breakingNote"
                class="code-input-sm"
                placeholder="描述不兼容的改动，留空则复用简短描述"
              />
            </template>
          </div>

          <!-- 右栏：预览 -->
          <div class="tool-col">
            <div class="label-row">
              <label class="tool-label">提交信息预览：</label>
              <button
                class="copy-btn label-copy-btn"
                title="复制生成的提交信息"
                :disabled="!commitMessage"
                @click="copyGenerated"
              >📋</button>
            </div>

            <pre
              class="commit-preview"
              :class="{ 'is-empty': !commitMessage }"
            >{{ commitMessage || '填写左侧配置后，这里会实时生成符合 Conventional Commits 规范的提交信息…' }}</pre>

            <div v-if="commitMessage" class="check-list">
              <div
                v-for="item in checks"
                :key="item.label"
                class="check-item"
                :class="item.level"
              >
                <span class="check-icon">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </div>
            </div>

            <label class="tool-label">完整 git 命令：</label>
            <pre class="command-preview">{{ gitCommand || 'git commit -m "…"' }}</pre>
          </div>
        </div>

        <!-- ✅ 全宽区域：按钮与状态提示 -->
        <div class="button-group button-group-3">
          <button
            class="tool-button primary"
            :disabled="!commitMessage"
            @click="copyGenerated"
          >📋 复制提交信息</button>
          <button
            class="tool-button"
            :disabled="!commitMessage"
            @click="copyCommand"
          >⌨️ 复制 git 命令</button>
          <button class="tool-button danger" @click="clear">🗑️ 清空</button>
        </div>

        <div v-if="error" class="status-error">❌ {{ error }}</div>
        <div v-if="success" class="status-success">✅ {{ success }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { copyText } from '../../utils/clipboard'

const commitTypes = [
  { value: 'feat', emoji: '✨', label: '新功能', desc: 'feat：新增功能特性（feature）' },
  { value: 'fix', emoji: '🐛', label: '修复缺陷', desc: 'fix：修复 bug' },
  { value: 'docs', emoji: '📝', label: '文档', desc: 'docs：仅文档变更' },
  { value: 'style', emoji: '💄', label: '格式', desc: 'style：不影响代码含义的格式调整（空格、缩进、分号等）' },
  { value: 'refactor', emoji: '♻️', label: '重构', desc: 'refactor：既非新增功能也非修复缺陷的代码重构' },
  { value: 'perf', emoji: '⚡', label: '性能', desc: 'perf：提升性能的代码改动' },
  { value: 'test', emoji: '✅', label: '测试', desc: 'test：新增或修改测试代码' },
  { value: 'build', emoji: '📦', label: '构建', desc: 'build：影响构建系统或外部依赖的变更（npm、webpack 等）' },
  { value: 'ci', emoji: '🤖', label: 'CI', desc: 'ci：修改 CI 配置或脚本' },
  { value: 'chore', emoji: '🔧', label: '杂务', desc: 'chore：其他不修改 src 或测试文件的变更' },
  { value: 'revert', emoji: '⏪', label: '回滚', desc: 'revert：回滚此前的某次提交' }
]

const type = ref('feat')
const scope = ref('')
const description = ref('')
const body = ref('')
const footer = ref('')
const breaking = ref(false)
const breakingNote = ref('')
const withEmoji = ref(false)

const error = ref('')
const success = ref('')

const currentType = computed(
  () => commitTypes.find(t => t.value === type.value) || commitTypes[0]
)

// ---------- 生成 ----------

const subject = computed(() => {
  const desc = description.value.trim()
  if (!desc) return ''

  const scopePart = scope.value.trim() ? `(${scope.value.trim()})` : ''
  const bang = breaking.value ? '!' : ''
  const emoji = withEmoji.value ? `${currentType.value.emoji} ` : ''
  return `${type.value}${scopePart}${bang}: ${emoji}${desc}`
})

const commitMessage = computed(() => {
  if (!subject.value) return ''

  const parts = [subject.value]

  const bodyText = body.value.trim()
  if (bodyText) parts.push(bodyText)

  const footerParts = []
  if (breaking.value) {
    const note = breakingNote.value.trim() || description.value.trim()
    footerParts.push(`BREAKING CHANGE: ${note}`)
  }
  const footerText = footer.value.trim()
  if (footerText) footerParts.push(footerText)

  if (footerParts.length) parts.push(footerParts.join('\n'))

  return parts.join('\n\n')
})

const gitCommand = computed(() => {
  if (!commitMessage.value) return ''
  const escaped = commitMessage.value.replace(/"/g, '\\"')
  return `git commit -m "${escaped}"`
})

// ---------- 校验提示 ----------

const subjectLength = computed(() => subject.value.length)

const checks = computed(() => {
  const list = []
  const len = subjectLength.value

  if (len > 72) {
    list.push({ icon: '✖', level: 'bad', label: `标题长度 ${len} 字符，超过 72，建议精简` })
  } else if (len > 50) {
    list.push({ icon: '!', level: 'warn', label: `标题长度 ${len} 字符，建议控制在 50 以内` })
  } else {
    list.push({ icon: '✔', level: 'good', label: `标题长度 ${len} 字符，符合规范` })
  }

  const desc = description.value.trim()
  if (/[.。]$/.test(desc)) {
    list.push({ icon: '!', level: 'warn', label: '标题结尾不建议加句号' })
  } else {
    list.push({ icon: '✔', level: 'good', label: '标题结尾未加句号' })
  }

  if (/^[A-Z]/.test(desc)) {
    list.push({ icon: '!', level: 'warn', label: '标题建议使用小写开头' })
  } else {
    list.push({ icon: '✔', level: 'good', label: '标题小写开头' })
  }

  if (breaking.value) {
    list.push({ icon: '⚠', level: 'warn', label: '包含破坏性变更，已添加 ! 与 BREAKING CHANGE 脚注' })
  }

  return list
})

// ---------- 操作 ----------

async function copyGenerated() {
  error.value = ''
  success.value = ''
  if (!commitMessage.value) {
    error.value = '请先填写简短描述（description）'
    return
  }
  if (await copyText(commitMessage.value)) {
    success.value = '已复制提交信息到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
  }
}

async function copyCommand() {
  error.value = ''
  success.value = ''
  if (!gitCommand.value) {
    error.value = '请先填写简短描述（description）'
    return
  }
  if (await copyText(gitCommand.value)) {
    success.value = '已复制 git 命令到剪贴板'
    setTimeout(() => { success.value = '' }, 2000)
  } else {
    error.value = '复制失败，请手动选择文本复制'
  }
}

function clear() {
  scope.value = ''
  description.value = ''
  body.value = ''
  footer.value = ''
  breaking.value = false
  breakingNote.value = ''
  withEmoji.value = false
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 标签内联复制按钮（覆盖全局绝对定位） */
.label-copy-btn {
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.label-copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  border-radius: 0;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.tool-select:focus {
  border-color: var(--green);
}

.tool-select option {
  background: var(--panel-2);
  color: var(--text);
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--muted);
  line-height: 1.5;
}

.commit-preview,
.command-preview {
  margin: 0;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--green);
  color: var(--green);
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 0;
  min-height: 120px;
}

.command-preview {
  min-height: auto;
  border-color: var(--line);
  color: var(--text);
  margin-top: 0;
}

.commit-preview.is-empty {
  border-color: var(--line);
  color: var(--muted);
  font-style: italic;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}

.check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}

.check-icon {
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  font-weight: bold;
}

.check-item.good .check-icon {
  color: var(--green);
}

.check-item.warn .check-icon {
  color: var(--green);
  opacity: 0.7;
}

.check-item.bad .check-icon {
  color: var(--red);
}

.check-item.bad {
  color: var(--red);
}
</style>
