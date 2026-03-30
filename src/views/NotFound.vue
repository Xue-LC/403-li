<template>
  <div class="not-found">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~/404</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body">
        <div class="content">
          <h1><span class="error-code">404</span></h1>
          <h2>页面未找到</h2>
          <p>抱歉，你访问的页面不存在或已被移除</p>
          <div class="command-line">
            <span class="prompt">root@403:~$</span>
            <router-link to="/" class="home-link">
              <span>./返回首页</span>
            </router-link>
            <span class="cursor"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
@import '../assets/styles.css';

.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--bg);
}

.terminal-window {
  width: 100%;
  max-width: 600px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow);
  position: relative;
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
  padding: 2rem;
}

.content {
  text-align: center;
}

h1 {
  margin: 0;
  line-height: 1;
}

.error-code {
  font-size: 5rem;
  font-family: var(--mono);
  color: var(--red);
  text-shadow: 0 0 20px rgba(255,107,125,0.5);
  display: inline-block;
  animation: glitch 2s infinite;
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

h2 {
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
  color: var(--text);
  font-family: var(--mono);
}

p {
  color: var(--muted);
  margin: 0.5rem 0 2rem;
  font-size: 14px;
}

.command-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  background: var(--panel-2);
  padding: 10px 12px;
  font-family: var(--mono);
  margin-top: 1rem;
}

.prompt {
  color: var(--green);
  font-size: 12px;
  white-space: nowrap;
  font-weight: 600;
}

.home-link {
  color: var(--cyan);
  text-decoration: none;
  font-size: 12px;
  transition: all 0.2s;
}

.home-link:hover {
  color: var(--green);
  text-shadow: 0 0 10px var(--green-glow);
}

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

@media (max-width: 640px) {
  .error-code {
    font-size: 3.5rem;
  }
  
  h2 {
    font-size: 1.2rem;
  }
  
  .terminal-body {
    padding: 1.5rem;
  }
}
</style>
