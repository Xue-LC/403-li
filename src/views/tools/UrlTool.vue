<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔗 URL 编解码</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入：</label>
              <textarea
                v-model="input"
                placeholder="输入文本或 URL 编码字符串"
                rows="4"
                class="code-input"
              ></textarea>
            </div>
            <div class="tool-col">
              <label class="tool-label">结果：</label>
              <textarea
                :value="result"
                readonly
                rows="4"
                class="code-input output"
                placeholder="编码/解码结果将显示在这里..."
              ></textarea>
            </div>
          </div>

          <div class="button-group button-group-3">
            <button class="tool-button" @click="encodeUrl" :disabled="!input.trim()">🔄 编码</button>
            <button class="tool-button" @click="decodeUrl" :disabled="!input.trim()">🔄 解码</button>
            <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
          </div>

          <div v-if="error" class="status-error">❌ {{ error }}</div>
          <div v-if="success" class="status-success">✅ {{ success }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'UrlTool',
  components: {},
  data() {
    return {
      input: '',
      result: '',
      error: '',
      success: '',
      copySuccess: ''
    }
  },
  methods: {
    encodeUrl() {
      this.error = ''
      this.success = ''
      
      if (!this.input.trim()) {
        this.error = '请输入要编码的内容'
        return
      }
      try {
        this.result = encodeURIComponent(this.input.trim())
        this.success = '编码成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '编码失败：' + e.message
      }
    },
    decodeUrl() {
      this.error = ''
      this.success = ''
      
      if (!this.input.trim()) {
        this.error = '请输入要解码的内容'
        return
      }
      try {
        this.result = decodeURIComponent(this.input.trim())
        this.success = '解码成功！'
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = '解码失败：无效的 URL 编码格式'
      }
    },
    async copyResult() {
      if (await copyText(this.result)) {
        this.copySuccess = '复制成功！'
        setTimeout(() => { this.copySuccess = '' }, 2000)
      }
    },
    clearAll() {
      this.input = ''
      this.result = ''
      this.error = ''
      this.success = ''
    }
  }
}
</script>

<style scoped>

/* 组件特有样式 - 无重复，全部使用全局样式 */
</style>