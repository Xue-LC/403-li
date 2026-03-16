<template>
  <div class="tools">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~/tools</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body">
        <h2>🛠️ 工具列表</h2>
        <p style="color: var(--text-dim); margin: 1rem 0;">选择工具开始使用：</p>
        
        <div class="tool-list">
          <div class="tool-item" @click="$router.push('/tools/json')">
            <span class="tool-number">[1]</span>
            <span>📦 JSON 格式化</span>
            <span style="color: var(--text-dim); margin-left: auto;">格式化/验证 JSON</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/base64')">
            <span class="tool-number">[2]</span>
            <span>🔐 Base64 编解码</span>
            <span style="color: var(--text-dim); margin-left: auto;">编码/解码</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/qrcode')">
            <span class="tool-number">[3]</span>
            <span>📱 二维码生成</span>
            <span style="color: var(--text-dim); margin-left: auto;">生成二维码</span>
          </div>
        </div>
        
        <div class="command-line">
          <span class="prompt">root@403:~/tools$</span>
          <input type="text" class="command-input" placeholder="输入工具编号或名称..." />
          <span class="cursor"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tools'
}
</script>

<style scoped>
.tools {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  color: var(--text-success);
  margin-bottom: 1rem;
}
</style>
