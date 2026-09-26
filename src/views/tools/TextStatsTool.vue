<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>📊 文本统计</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入文本：</label>
            <textarea
              v-model="input"
              placeholder="粘贴或输入文本，实时统计..."
              rows="12"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">统计结果：</label>
            <div class="stats-section">
              <div v-if="!input.trim()" class="stats-placeholder">
                请在左侧输入文本，统计结果将显示在这里
              </div>
              <div v-else class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">总字符数</span>
                  <span class="stat-value">{{ stats.totalChars.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">不含空格字符数</span>
                  <span class="stat-value">{{ stats.charsNoSpaces.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">英文单词数</span>
                  <span class="stat-value">{{ stats.wordCount.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">中文字数</span>
                  <span class="stat-value">{{ stats.cjkCount.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">行数</span>
                  <span class="stat-value">{{ stats.lineCount.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">段落数</span>
                  <span class="stat-value">{{ stats.paragraphCount.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">UTF-8 字节数</span>
                  <span class="stat-value">{{ stats.byteCount.toLocaleString() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">预计阅读时间</span>
                  <span class="stat-value">{{ stats.readingTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="button-group button-group-2">
          <button class="tool-button" @click="copyStats" :disabled="!input.trim()">
            📋 复制统计
          </button>
          <button class="tool-button danger" @click="clear">
            🗑️ 清空
          </button>
        </div>

        <div v-if="copyMsg" class="status-success">✅ {{ copyMsg }}</div>
      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'TextStatsTool',
  data() {
    return {
      input: '',
      copyMsg: ''
    }
  },
  computed: {
    stats() {
      const text = this.input
      if (!text.trim()) {
        return {
          totalChars: 0,
          charsNoSpaces: 0,
          wordCount: 0,
          cjkCount: 0,
          lineCount: 0,
          paragraphCount: 0,
          byteCount: 0,
          readingTime: '0 秒'
        }
      }

      // Total characters
      const totalChars = text.length

      // Characters without spaces
      const charsNoSpaces = text.replace(/\s/g, '').length

      // English word count (sequences of letters/numbers)
      const wordCount = (text.match(/[a-zA-Z0-9]+/g) || []).length

      // CJK character count (Chinese, Japanese, Korean)
      const cjkCount = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g) || []).length

      // Line count
      const lineCount = text.split('\n').length

      // Paragraph count (separated by one or more blank lines)
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
      const paragraphCount = paragraphs.length

      // UTF-8 byte count
      const encoder = new TextEncoder()
      const byteCount = encoder.encode(text).length

      // Reading time estimation
      // Chinese: ~300 chars/min, English: ~200 words/min
      const cjkMinutes = cjkCount / 300
      const engMinutes = wordCount / 200
      const totalMinutes = cjkMinutes + engMinutes

      let readingTime
      if (totalMinutes < 1) {
        readingTime = Math.max(1, Math.ceil(totalMinutes * 60)) + ' 秒'
      } else if (totalMinutes < 60) {
        const mins = Math.ceil(totalMinutes)
        readingTime = mins + ' 分钟'
      } else {
        const hrs = Math.floor(totalMinutes / 60)
        const mins = Math.ceil(totalMinutes % 60)
        readingTime = hrs + ' 小时 ' + mins + ' 分钟'
      }

      return {
        totalChars,
        charsNoSpaces,
        wordCount,
        cjkCount,
        lineCount,
        paragraphCount,
        byteCount,
        readingTime
      }
    }
  },
  methods: {
    async copyStats() {
      const s = this.stats
      const text = [
        '=== 文本统计结果 ===',
        '总字符数：' + s.totalChars.toLocaleString(),
        '不含空格字符数：' + s.charsNoSpaces.toLocaleString(),
        '英文单词数：' + s.wordCount.toLocaleString(),
        '中文字数：' + s.cjkCount.toLocaleString(),
        '行数：' + s.lineCount.toLocaleString(),
        '段落数：' + s.paragraphCount.toLocaleString(),
        'UTF-8 字节数：' + s.byteCount.toLocaleString(),
        '预计阅读时间：' + s.readingTime
      ].join('\n')

      if (await copyText(text)) {
        this.copyMsg = '统计结果已复制'
        setTimeout(() => { this.copyMsg = '' }, 2000)
      }
    },
    clear() {
      this.input = ''
      this.copyMsg = ''
    }
  }
}
</script>

<style scoped>
.stats-section {
  background: var(--panel-2);
  border: 1px solid var(--accent);
  border-radius: 0;
  padding: 12px;
  min-height: 200px;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.stats-placeholder {
  color: var(--text-muted);
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 13px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  align-content: start;
}

.stat-item {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'MapleMono NF CN', 'Courier New', monospace;
  font-size: 16px;
  color: var(--accent);
  font-weight: bold;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .stat-value {
    font-size: 14px;
  }
}
</style>
