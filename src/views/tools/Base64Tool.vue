<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>🔐 Base64 编解码</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入：</label>
              <textarea
                v-model="input"
                placeholder="输入要编码/解码的文本..."
                rows="10"
                class="code-input"
              ></textarea>
            </div>
            <div class="tool-col">
              <label class="tool-label">输出：</label>
              <textarea
                v-model="output"
                readonly
                rows="10"
                class="code-input output"
                placeholder="结果显示在这里..."
              ></textarea>
            </div>
          </div>

          <div class="button-group button-group-4">
            <button class="tool-button primary" @click="encode">
              🔐 编码
            </button>
            <button class="tool-button" @click="decode">
              🔓 解码
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
            ✅ 成功
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'Base64Tool',
  components: {},
  data() {
    return {
      input: '',
      output: '',
      error: '',
      success: false
    }
  },
  methods: {
    encode() {
      this.error = ''
      this.success = false
      
      if (!this.input) {
        this.error = '请输入要编码的内容'
        return
      }
      
      try {
        this.output = btoa(unescape(encodeURIComponent(this.input)))
        this.error = ''
        this.success = true
        setTimeout(() => this.success = false, 2000)
      } catch (e) {
        this.error = '编码失败：' + e.message
        this.output = ''
        this.success = false
      }
    },
    decode() {
      this.error = ''
      this.success = false
      
      if (!this.input) {
        this.error = '请输入要解码的 Base64 字符串'
        return
      }
      
      try {
        this.output = decodeURIComponent(escape(atob(this.input)))
        this.error = ''
        this.success = true
        setTimeout(() => this.success = false, 2000)
      } catch (e) {
        this.error = '解码失败：无效的 Base64 字符串'
        this.output = ''
        this.success = false
      }
    },
    async copyOutput() {
      if (await copyText(this.output)) {
        this.success = true
        setTimeout(() => { this.success = false }, 2000)
      }
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.success = false
    }
  }
}
</script>

<style scoped>

/* 组件特有样式 - 无重复，全部使用全局样式 */
</style>