<template>
  <div v-if="error" class="error-fallback">
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>⚠️ 组件错误</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <div class="status-error">
            ❌ 工具加载失败：{{ error.message || '未知错误' }}
          </div>
          <button class="tool-button primary" @click="retry">
            🔄 重试
          </button>
        </div>
      </div>
    </section>
  </div>
  <slot v-else />
</template>

<script>
export default {
  name: 'ErrorBoundary',
  data() {
    return {
      error: null
    }
  },
  errorCaptured(err) {
    this.error = err
    return false // 阻止错误向上传播
  },
  methods: {
    retry() {
      this.error = null
    }
  }
}
</script>
