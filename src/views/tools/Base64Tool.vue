<template>
  <div class="base64-tool">
    <!-- Topbar -->
    <Topbar toolCount="1" />

    <!-- 工具主体 -->
    <section class="pane">
      <div class="pane-head">
        <span>🔐 Base64 编解码</span>
        <span>在线工具</span>
      </div>
      <div class="pane-body">
        <div class="tool-body">
          <label class="input-label">输入：</label>
          <textarea 
            v-model="input" 
            placeholder="输入要编码/解码的文本..."
            rows="10"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button class="button primary" @click="encode">
              🔐 编码
            </button>
            <button class="button" @click="decode">
              🔓 解码
            </button>
            <button class="button" @click="copyOutput" :disabled="!output.trim()">
              📋 复制
            </button>
            <button class="button danger full-width" @click="clear">
              🗑️ 清空
            </button>
          </div>
          
          <label class="input-label">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="10"
            class="code-input output"
            placeholder="结果显示在这里..."
          ></textarea>
          
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
    <footer class="footer">
      <span>403.li // Base64 工具</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'Base64Tool',
  components: {
    Topbar
  },
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
    copyOutput() {
      if (!this.output.trim()) {
        this.error = '没有可复制的内容'
        return
      }
      
      navigator.clipboard.writeText(this.output).then(() => {
        this.success = true
        setTimeout(() => this.success = false, 2000)
      }).catch(() => {
        this.error = '复制失败，请手动复制'
      })
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
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';
</style>
