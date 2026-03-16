<template>
  <div class="welcome">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body">
        <h1 class="flicker">🦞 欢迎来到 403.li</h1>
        <p>终端风格工具站 | 纯前端 | 无追踪 | 开源</p>
        
        <div class="tool-list">
          <p style="color: var(--text-dim); margin-bottom: 1rem;">可用工具：</p>
          
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
          
          <div class="command-line">
            <span class="prompt">root@403:~$</span>
            <input type="text" class="command-input" placeholder="输入命令或选择工具..." />
            <span class="cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.welcome {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
