<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔍 正则表达式测试器</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <!-- 正则输入区域 -->
          <div class="regex-input-row">
            <div class="regex-field">
              <label class="tool-label">正则表达式：</label>
              <div class="regex-pattern-wrapper">
                <span class="regex-slash">/</span>
                <input
                  v-model="pattern"
                  type="text"
                  placeholder="输入正则表达式..."
                  class="regex-pattern-input"
                />
                <span class="regex-slash">/</span>
                <input
                  v-model="flags"
                  type="text"
                  placeholder="gimsuy"
                  class="regex-flags-input"
                  maxlength="6"
                />
              </div>
            </div>
            <div class="flags-hint">
              <span class="hint-text">g:全局 i:忽略大小写 m:多行 s:单行 u:Unicode y:粘连</span>
            </div>
          </div>

          <!-- 模板库 -->
          <div class="template-section">
            <label class="tool-label">常用模板：</label>
            <div class="template-buttons">
              <button
                v-for="template in templates"
                :key="template.name"
                class="template-btn"
                @click="applyTemplate(template)"
              >
                {{ template.name }}
              </button>
            </div>
          </div>

          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">测试文本：</label>
              <textarea
                v-model="testText"
                placeholder="输入要测试的文本..."
                rows="6"
                class="code-input"
              ></textarea>
              <div class="replace-section">
                <label class="tool-label">替换文本（可选）：</label>
                <div class="replace-row">
                  <input v-model="replacement" type="text" placeholder="使用 $1, $2 引用捕获组..." class="replace-input" />
                  <button class="tool-button" @click="replaceAll">🔄 替换</button>
                </div>
                <div v-if="replacedText" class="replaced-result">
                  <label class="input-label">替换结果：</label>
                  <div class="code-input output">{{ replacedText }}</div>
                </div>
              </div>
            </div>
            <div class="tool-col">
              <label class="tool-label">匹配高亮：</label>
              <div v-if="testText && matches.length > 0" class="highlight-section">
                <div class="highlight-output" v-html="highlightedText"></div>
              </div>
              <div v-else class="result-display" style="color: var(--muted);">匹配结果将显示在这里...</div>
            </div>
          </div>

          <div class="button-group button-group-2">
            <button class="tool-button primary" @click="runMatch">🔍 执行匹配</button>
            <button class="tool-button" @click="clear">🗑️ 清空</button>
          </div>

          <div v-if="error" class="status-error">{{ error }}</div>

          <div v-if="stats.matches > 0" class="stats-section">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">匹配次数</span>
                <span class="stat-value">{{ stats.matches }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">捕获组数</span>
                <span class="stat-value">{{ stats.groups }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">执行耗时</span>
                <span class="stat-value">{{ stats.time }}ms</span>
              </div>
            </div>
          </div>

          <!-- 匹配结果列表 -->
          <div v-if="matches.length > 0" class="matches-section">
            <label class="tool-label">匹配结果（{{ matches.length }}个）：</label>
            <div class="matches-list">
              <div
                v-for="(match, index) in matches"
                :key="index"
                class="match-item"
              >
                <div class="match-header">
                  <span class="match-index">#{{ index + 1 }}</span>
                  <span class="match-position">位置: {{ match.index }} - {{ match.endIndex }}</span>
                </div>
                <div class="match-content">
                  <div class="match-full">
                    <span class="label">完整匹配：</span>
                    <span class="value code">{{ match.text }}</span>
                  </div>
                  <div v-if="match.groups.length > 0" class="match-groups">
                    <div
                      v-for="(group, gIndex) in match.groups"
                      :key="gIndex"
                      class="group-item"
                    >
                      <span class="label">组 {{ gIndex + 1 }}：</span>
                      <span class="value code">{{ group || '(空)' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>

export default {
  name: 'RegexTool',
  components: {},
  data() {
    return {
      pattern: '',
      flags: 'g',
      testText: '',
      replacement: '',
      replacedText: '',
      error: '',
      matches: [],
      stats: {
        matches: 0,
        groups: 0,
        time: 0
      },
      templates: [
        { name: '手机号', pattern: '1[3-9]\\d{9}', flags: 'g', desc: '中国大陆手机号' },
        { name: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', flags: 'g', desc: '电子邮箱地址' },
        { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?', flags: 'gi', desc: 'HTTP/HTTPS 链接' },
        { name: 'IPv4', pattern: '(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)', flags: 'g', desc: 'IP 地址' },
        { name: '身份证', pattern: '\\d{17}[\\dXx]|\\d{15}', flags: 'g', desc: '中国身份证号' },
        { name: '日期', pattern: '\\d{4}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\\d|3[01])', flags: 'g', desc: '日期格式' },
        { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', flags: 'g', desc: '匹配中文' },
        { name: '数字', pattern: '\\d+', flags: 'g', desc: '连续数字' },
        { name: '单词', pattern: '\\w+', flags: 'g', desc: '单词字符' }
      ]
    }
  },
  computed: {
    highlightedText() {
      if (!this.testText || this.matches.length === 0) {
        return this.escapeHtml(this.testText)
      }

      let text = this.testText
      let result = ''
      let lastIndex = 0

      // 按索引排序匹配结果
      const sortedMatches = [...this.matches].sort((a, b) => a.index - b.index)

      for (const match of sortedMatches) {
        // 添加未匹配部分
        result += this.escapeHtml(text.slice(lastIndex, match.index))
        // 添加高亮匹配部分
        result += `<mark>${this.escapeHtml(match.text)}</mark>`
        lastIndex = match.endIndex
      }

      // 添加剩余部分
      result += this.escapeHtml(text.slice(lastIndex))

      return result
    }
  },
  methods: {
    escapeHtml(text) {
      if (!text) return ''
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },
    runMatch() {
      this.error = ''
      this.matches = []
      this.stats = { matches: 0, groups: 0, time: 0 }
      this.replacedText = ''

      if (!this.pattern) {
        this.error = '请输入正则表达式'
        return
      }

      if (!this.testText) {
        this.error = '请输入测试文本'
        return
      }

      const startTime = performance.now()

      try {
        // 验证 flags 有效性
        const validFlags = new Set(['g', 'i', 'm', 's', 'u', 'y'])
        const flagsSet = new Set(this.flags.split(''))
        const invalidFlags = [...flagsSet].filter(f => !validFlags.has(f))
        if (invalidFlags.length > 0) {
          this.error = `无效的 flags: ${invalidFlags.join(', ')}`
          return
        }

        // 创建正则表达式
        const regex = new RegExp(this.pattern, this.flags)

        // 执行匹配
        const matches = []
        let match
        let matchCount = 0
        let totalGroups = 0

        if (this.flags.includes('g')) {
          // 全局匹配
          while ((match = regex.exec(this.testText)) !== null) {
            // 防止空匹配导致无限循环
            if (match.index === regex.lastIndex) {
              regex.lastIndex++
            }

            matches.push({
              text: match[0],
              index: match.index,
              endIndex: match.index + match[0].length,
              groups: match.slice(1)
            })
            matchCount++
            totalGroups += match.length - 1
          }
        } else {
          // 非全局匹配，只匹配一次
          match = regex.exec(this.testText)
          if (match) {
            matches.push({
              text: match[0],
              index: match.index,
              endIndex: match.index + match[0].length,
              groups: match.slice(1)
            })
            matchCount = 1
            totalGroups = match.length - 1
          }
        }

        const endTime = performance.now()

        this.matches = matches
        this.stats = {
          matches: matchCount,
          groups: totalGroups,
          time: Math.round(endTime - startTime)
        }

        if (matchCount === 0) {
          this.error = '未找到匹配项'
        }
      } catch (e) {
        this.error = '正则表达式❌ 错误：' + e.message
      }
    },
    replaceAll() {
      this.error = ''
      this.replacedText = ''

      if (!this.pattern) {
        this.error = '请输入正则表达式'
        return
      }

      if (!this.testText) {
        this.error = '请输入测试文本'
        return
      }

      try {
        // 确保有 g 标志用于替换
        let flags = this.flags
        if (!flags.includes('g')) {
          flags += 'g'
        }

        const regex = new RegExp(this.pattern, flags)
        this.replacedText = this.testText.replace(regex, this.replacement)
      } catch (e) {
        this.error = '替换失败：' + e.message
      }
    },
    applyTemplate(template) {
      this.pattern = template.pattern
      this.flags = template.flags
      this.error = ''
      // 如果有测试文本，自动执行匹配
      if (this.testText) {
        this.runMatch()
      }
    },
    clear() {
      this.pattern = ''
      this.flags = 'g'
      this.testText = ''
      this.replacement = ''
      this.replacedText = ''
      this.error = ''
      this.matches = []
      this.stats = { matches: 0, groups: 0, time: 0 }
    }
  }
}
</script>

<style scoped>

.regex-tool {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  background: var(--panel);
}

.pane-body {
  padding: 12px;
}

.tool-body {
  margin-top: 1rem;
}

/* === Input Labels === */
.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
}

/* === Regex Input Row === */
.regex-input-row {
  margin-bottom: 1rem;
}

.regex-field {
  margin-bottom: 0.5rem;
}

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
  color: var(--yellow);
  font-family: var(--mono);
  font-size: 14px;
  padding: 0;
  outline: none;
  text-align: center;
}

.regex-flags-input::placeholder {
  color: var(--dim);
}

.flags-hint {
  margin-top: 4px;
}

.hint-text {
  color: var(--dim);
  font-family: var(--mono);
  font-size: 11px;
}

/* === Template Section === */
.template-section {
  margin-bottom: 1rem;
}

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

/* === Input Section === */
.input-section {
  margin-bottom: 1rem;
}

.code-input {
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  resize: vertical;
  transition: all 0.2s;
  border-radius: 0;
  box-sizing: border-box;
  min-height: 120px;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.code-input::placeholder {
  color: var(--dim);
}

.code-input.output {
  background: rgba(157,255,107,0.03);
  border-color: rgba(157,255,107,0.2);
  min-height: 60px;
}

/* === Replace Section === */
.replace-section {
  margin-bottom: 1rem;
}

.replace-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.replace-input {
  flex: 1;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
}

.replace-input:focus {
  border-color: var(--line-strong);
  box-shadow: 0 0 15px var(--green-glow);
}

.replace-input::placeholder {
  color: var(--dim);
}

.replaced-result {
  margin-top: 1rem;
}

/* === Button Group === */
.button-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 1rem 0;
}

.tool-button {
  border: 1px solid var(--line-strong);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  border-radius: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.tool-button:hover:not(:disabled) {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 15px var(--green-glow);
}

.tool-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-button.primary {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.tool-button.primary:hover:not(:disabled) {
  background: rgba(157,255,107,0.2);
  box-shadow: 0 0 20px var(--green-glow);
}

/* === Status Messages === */
.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,107,125,0.3);
  background: rgba(255,107,125,0.05);
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(157,255,107,0.3);
  background: var(--green-soft);
}

/* === Stats Section === */
.stats-section {
  margin-top: 1rem;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  color: var(--dim);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  color: var(--green);
  font-family: var(--mono);
  font-size: 18px;
  font-weight: bold;
}

/* === Highlight Section === */
.highlight-section {
  margin-top: 1rem;
}

.highlight-output {
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--text);
  font-family: var(--mono);
  font-size: 14px;
  padding: 12px;
  min-height: 60px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.highlight-output mark {
  background: rgba(157,255,107,0.3);
  color: var(--text);
  padding: 2px 0;
}

/* === Matches Section === */
.matches-section {
  margin-top: 1rem;
}

.matches-list {
  border: 1px solid var(--line);
  background: var(--panel);
  max-height: 300px;
  overflow: auto;
}

.match-item {
  border-bottom: 1px solid var(--line);
  padding: 12px;
}

.match-item:last-child {
  border-bottom: none;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.match-index {
  color: var(--green);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: bold;
}

.match-position {
  color: var(--dim);
  font-family: var(--mono);
  font-size: 11px;
}

.match-content {
  font-family: var(--mono);
}

.match-full {
  margin-bottom: 8px;
}

.match-full .label,
.group-item .label {
  color: var(--yellow);
  font-size: 11px;
  text-transform: uppercase;
}

.match-full .value,
.group-item .value {
  color: var(--text);
}

.match-full .value.code,
.group-item .value.code {
  background: rgba(157,255,107,0.1);
  padding: 2px 6px;
  border: 1px solid rgba(157,255,107,0.3);
}

.group-item {
  margin-top: 4px;
  padding-left: 12px;
}


/* === Responsive === */
@media (max-width: 640px) {
  .regex-tool {
    width: 100%;
    max-width: 100%;
    padding: 8px 0 16px;
  }

  .pane-body {
    padding: 12px;
  }

  .regex-pattern-wrapper {
    padding: 6px 10px;
  }

  .regex-pattern-input,
  .regex-flags-input {
    font-size: 13px;
  }

  .template-buttons {
    gap: 6px;
  }

  .template-btn {
    padding: 4px 8px;
    font-size: 11px;
  }

  .code-input {
    font-size: 14px;
    padding: 10px;
    min-height: 100px;
  }

  .replace-row {
    flex-direction: column;
    gap: 8px;
  }

  .replace-input {
    width: 100%;
  }

  .button-group {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 0.75rem 0;
  }

  .tool-button {
    height: 44px;
    font-size: 12px;
  }

  .input-label {
    font-size: 12px;
    margin-bottom: 0.4rem;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-value {
    font-size: 16px;
  }

  .highlight-output {
    font-size: 13px;
    padding: 10px;
  }

  .match-item {
    padding: 10px;
  }

  .match-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-error, .status-success {
    font-size: 12px;
    padding: 8px 10px;
    margin-top: 0.75rem;
  }

}

/* 超小屏幕 */
@media (max-width: 375px) {
  .regex-tool {
    padding: 6px 0 14px;
  }

  .pane-body {
    padding: 8px;
  }

  .regex-pattern-wrapper {
    padding: 6px 8px;
  }

  .code-input {
    font-size: 14px;
    padding: 8px;
  }

  .tool-button {
    height: 44px;
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

}
</style>
