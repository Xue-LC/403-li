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
        <h2 class="flicker">🛠️ 工具列表</h2>
        <p style="color: var(--muted); margin: 1rem 0;">选择工具开始使用：</p>
        
        <div class="tool-list">
          <div class="tool-item" @click="$router.push('/tools/json')">
            <span class="tool-number">[01]</span>
            <span class="tool-name">📦 JSON 格式化</span>
            <span class="tool-desc">格式化/验证 JSON</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/base64')">
            <span class="tool-number">[02]</span>
            <span class="tool-name">🔐 Base64 编解码</span>
            <span class="tool-desc">编码/解码</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/qrcode')">
            <span class="tool-number">[03]</span>
            <span class="tool-name">📱 二维码生成</span>
            <span class="tool-desc">生成二维码</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/timestamp')">
            <span class="tool-number">[04]</span>
            <span class="tool-name">🕐 时间戳转换</span>
            <span class="tool-desc">Unix / ISO 格式</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/url')">
            <span class="tool-number">[05]</span>
            <span class="tool-name">🔗 URL 编解码</span>
            <span class="tool-desc">编码/解码</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/hash')">
            <span class="tool-number">[06]</span>
            <span class="tool-name">🔐 哈希计算</span>
            <span class="tool-desc">MD5 / SHA1 / SHA256</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/password')">
            <span class="tool-number">[07]</span>
            <span class="tool-name">🔑 密码生成</span>
            <span class="tool-desc">安全随机密码</span>
          </div>
          
          <div class="tool-item" @click="$router.push('/tools/color')">
            <span class="tool-number">[08]</span>
            <span class="tool-name">🎨 颜色转换</span>
            <span class="tool-desc">HEX / RGB / HSL</span>
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
@import '../assets/styles.css';

.tools {
  width: min(var(--max), calc(100vw - 16px));
  margin: 0 auto;
  padding: 12px 0 20px;
}

.terminal-window {
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow);
  position: relative;
}

.terminal-window::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--green), var(--cyan), var(--green));
  opacity: 0.4;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
}

.terminal-title {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--green);
  text-shadow: 0 0 10px var(--green-glow);
}

.terminal-buttons {
  display: flex;
  gap: 6px;
}

.btn {
  width: 12px;
  height: 12px;
  border-radius: 0;
  border: 1px solid rgba(0,0,0,0.3);
}

.btn-close { background: var(--red); }
.btn-minimize { background: var(--amber); }
.btn-maximize { background: var(--green); }

.terminal-body {
  padding: 12px;
}

h2 {
  color: var(--green);
  margin-bottom: 1rem;
  font-family: var(--mono);
  font-size: 17px;
  text-shadow: 0 0 10px var(--green-glow);
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--mono);
  font-size: 12px;
}

.tool-item:hover {
  border-color: var(--line-strong);
  background: rgba(157,255,107,0.03);
  box-shadow: 0 0 20px var(--green-glow);
  transform: translateX(4px);
}

.tool-number {
  color: var(--green);
  font-weight: 600;
  text-shadow: 0 0 10px var(--green-glow);
  min-width: 32px;
}

.tool-name {
  color: var(--text);
  flex: 1;
}

.tool-desc {
  color: var(--dim);
  font-size: 11px;
  text-transform: uppercase;
}

.command-line {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 12px;
  font-family: var(--mono);
}

.prompt {
  color: var(--green);
  font-size: 12px;
  white-space: nowrap;
  font-weight: 600;
}

.command-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
}

.command-input::placeholder { color: var(--dim); }

.cursor {
  width: 8px;
  height: 18px;
  background: var(--green);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.flicker {
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@media (max-width: 640px) {
  .tools {
    width: min(var(--max), calc(100vw - 12px));
  }
  
  .tool-item {
    flex-wrap: wrap;
    padding: 8px 10px;
  }
  
  .tool-desc {
    width: 100%;
    margin-left: 42px !important;
    margin-top: 4px;
  }
}
</style>
