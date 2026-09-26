<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>📦 JSON 格式化</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="tool-two-col">
            <div class="tool-col">
              <label class="tool-label">输入 JSON：</label>
              <textarea
                v-model="input"
                placeholder='{"name": "test", "value": 123}'
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
                placeholder="结果将显示在这里..."
              ></textarea>
            </div>
          </div>

          <div class="button-group button-group-4">
            <button class="tool-button primary" @click="format" :disabled="!input.trim()">
              ✨ 格式化
            </button>
            <button class="tool-button" @click="minify" :disabled="!input.trim()">
              📦 压缩
            </button>
            <button class="tool-button" @click="validate" :disabled="!input.trim()">
              ✓ 校验
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

          <div v-if="valid" class="status-success">
            ✅ JSON 格式正确
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { copyText } from '../../utils/clipboard'

export default {
  name: 'JsonFormatter',
  components: {},
  data() {
    return {
      input: '',
      output: '',
      error: '',
      valid: false
    }
  },
  methods: {
    format() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed, null, 2)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    minify() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    validate() {
      this.error = ''
      this.valid = false
      
      if (!this.input.trim()) {
        this.error = '请输入 JSON 内容'
        return
      }
      
      try {
        JSON.parse(this.input)
        this.valid = true
        this.output = this.input
      } catch (e) {
        this.error = e.message
        this.output = ''
        this.valid = false
      }
    },
    async copyOutput() {
      if (!this.output.trim()) return
      if (await copyText(this.output)) {
        this.valid = true
        setTimeout(() => { this.valid = false }, 2000)
      }
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.valid = false
    }
  }
}
</script>

<style scoped>

/* 组件特有样式 - 无重复，全部使用全局样式 */
</style>