<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔐 哈希计算</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入文本：</label>
              <textarea
                v-model="inputText"
                placeholder="输入要计算哈希的文本"
                rows="4"
                class="code-input"
              ></textarea>
            </div>
            <div class="tool-col">
              <label class="tool-label">哈希结果：</label>
              <div class="hash-results" v-if="hashResults.length" style="flex:1">
                <div v-for="item in hashResults" :key="item.algo" class="hash-item">
                  <span class="hash-algo">{{ item.algo }}</span>
                  <div class="hash-value-wrapper">
                    <code class="hash-value">{{ item.hash }}</code>
                    <button class="copy-btn" @click="copyHash(item.hash)" title="复制">📋</button>
                  </div>
                </div>
              </div>
              <div v-else class="result-display" style="color: var(--muted);">哈希结果将显示在这里...</div>
            </div>
          </div>

          <button class="tool-button primary full-width" @click="calculateHash">
            🔐 计算哈希
          </button>

          <div v-if="error" class="status-error">❌ {{ error }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'
import MD5 from 'crypto-js/md5'
import SHA1 from 'crypto-js/sha1'
import SHA256 from 'crypto-js/sha256'
import SHA512 from 'crypto-js/sha512'

export default {
  name: 'HashTool',
  components: {},
  data() {
    return {
      inputText: '',
      hashResults: [],
      error: '',
      success: ''
    }
  },
  methods: {
    calculateHash() {
      this.error = ''
      this.success = ''
      
      if (!this.inputText.trim()) {
        this.error = '请输入要计算的文本'
        return
      }
      
      try {
        this.hashResults = [
          { algo: 'MD5', hash: MD5(this.inputText).toString() },
          { algo: 'SHA1', hash: SHA1(this.inputText).toString() },
          { algo: 'SHA256', hash: SHA256(this.inputText).toString() },
          { algo: 'SHA512', hash: SHA512(this.inputText).toString() }
        ]
        this.success = '计算成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '计算失败：' + e.message
      }
    },
    async copyHash(hash) {
      if (await copyText(hash)) {
        this.success = '已复制到剪贴板！'
        setTimeout(() => { this.success = '' }, 2000)
      }
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

/* 哈希结果列表 */
.hash-results {
  margin-top: 1rem;
}

.hash-item {
  margin: 1rem 0;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}

.hash-algo {
  display: block;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--green);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.hash-value-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hash-value {
  flex: 1;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  background: rgba(255,255,255,0.02);
  padding: 8px;
  border: 1px solid var(--line);
}

.hash-value-wrapper .copy-btn {
  position: static;
  background: transparent;
  border: none;
  color: var(--green);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.hash-value-wrapper .copy-btn:hover {
  color: var(--text);
  transform: scale(1.1);
}

@media (max-width: 375px) {
  .hash-value {
    font-size: 11px;
  }
}
</style>