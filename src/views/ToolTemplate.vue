<template>
  <!-- 工具主体：Topbar 和 Footer 由 ToolLayout 提供，工具组件只写内容区 -->
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>工具名称</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <label class="tool-label">输入：</label>
        <textarea
          v-model="input"
          placeholder="输入内容..."
          class="code-input"
        ></textarea>

        <div class="button-row">
          <button class="tool-button primary" @click="handleAction">执行</button>
          <button class="tool-button danger full-width" @click="clear">清空</button>
        </div>

        <label class="tool-label">输出：</label>
        <textarea
          v-model="output"
          readonly
          placeholder="结果将显示在这里..."
          class="code-input output"
        ></textarea>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ToolTemplate',
  data() {
    return {
      input: '',
      output: ''
    }
  },
  methods: {
    handleAction() {
      // 工具逻辑
      this.output = this.input
    },
    clear() {
      this.input = ''
      this.output = ''
    }
  }
}
</script>

<style scoped>
/* 只放组件特有的样式，全局样式在 index.css 和 tools.css 中 */
</style>
