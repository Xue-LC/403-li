<template>
  <div class="tool-wrapper">
    <!-- Topbar -->
    <Topbar :toolCount="toolCount" />

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>{{ title }}</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <!-- 插槽：工具内容 -->
          <slot name="input">
            <label class="tool-label">{{ inputLabel }}：</label>
            <textarea 
              v-model="input" 
              :placeholder="inputPlaceholder"
              :rows="rows"
              class="code-input"
            ></textarea>
          </slot>
          
          <!-- 插槽：按钮组 -->
          <slot name="buttons">
            <div class="button-group button-group-2">
              <button class="tool-button primary" @click="process" :disabled="!input.trim()">
                ⚡ 处理
              </button>
              <button class="tool-button danger full-width" @click="clear">
                🗑️ 清空
              </button>
            </div>
          </slot>
          
          <!-- 插槽：输出区域 -->
          <slot name="output">
            <label class="tool-label">{{ outputLabel }}：</label>
            <textarea 
              v-model="output" 
              readonly 
              :rows="rows"
              class="code-input output"
              :placeholder="outputPlaceholder"
            ></textarea>
          </slot>
          
          <!-- 状态消息 -->
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="success" class="status-success">
            ✅ {{ success }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="tool-footer">
      <span>403.li // {{ title }}</span>
      <span>纯前端处理 · 数据不会上传</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../../components/Topbar.vue'

export default {
  name: 'BaseTool',
  components: {
    Topbar
  },
  props: {
    toolCount: {
      type: String,
      default: '1'
    },
    title: {
      type: String,
      required: true
    },
    inputLabel: {
      type: String,
      default: '输入'
    },
    inputPlaceholder: {
      type: String,
      default: '输入内容...'
    },
    outputLabel: {
      type: String,
      default: '输出'
    },
    outputPlaceholder: {
      type: String,
      default: '结果将显示在这里...'
    },
    rows: {
      type: Number,
      default: 6
    },
    processFn: {
      type: Function,
      required: true
    },
    successMessage: {
      type: String,
      default: '处理成功！'
    }
  },
  data() {
    return {
      input: '',
      output: '',
      error: '',
      success: ''
    }
  },
  methods: {
    process() {
      this.error = ''
      this.success = ''
      
      if (!this.input.trim()) {
        this.error = '请输入内容'
        return
      }
      
      try {
        this.output = this.processFn(this.input)
        this.success = this.successMessage
        setTimeout(() => {
          this.success = ''
        }, 3000)
      } catch (e) {
        this.error = e.message
        this.output = ''
      }
    },
    clear() {
      this.input = ''
      this.output = ''
      this.error = ''
      this.success = ''
    },
    copyOutput() {
      if (!this.output.trim()) {
        this.error = '没有可复制的内容'
        return
      }
      
      navigator.clipboard.writeText(this.output).then(() => {
        this.success = '已复制！'
        setTimeout(() => {
          this.success = ''
        }, 2000)
      }).catch(() => {
        this.error = '复制失败，请手动复制'
      })
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/index.css';
@import '../../assets/styles/tools.css';
</style>
