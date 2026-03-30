<template>
  <div class="json-formatter">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~/tools/json</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body">
        <h2 class="flicker">📦 JSON 格式化工具</h2>
        <p style="color: var(--muted); margin: 1rem 0;">输入 JSON，点击格式化</p>
        
        <div class="tool-body">
          <label class="input-label">输入 JSON：</label>
          <textarea 
            v-model="input" 
            placeholder='{"name": "test", "value": 123}'
            rows="8"
            class="code-input"
          ></textarea>
          
          <div class="button-group">
            <button class="button" @click="format">✨ 格式化</button>
            <button class="button" @click="minify">📦 压缩</button>
            <button class="button" @click="clear">🗑️ 清空</button>
          </div>
          
          <label class="input-label">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="8"
            class="code-input output"
          ></textarea>
          
          <div v-if="error" class="status-error">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="valid" class="status-success">
            ✅ JSON 格式正确
          </div>
        </div>
        
        <div class="command-line">
          <span class="prompt">root@403:~/tools/json$</span>
          <input type="text" class="command-input" placeholder="按 Enter 格式化..." @keyup.enter="format" />
          <span class="cursor"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JsonFormatter',
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
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed, null, 2)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
      }
    },
    minify() {
      this.error = ''
      this.valid = false
      
      try {
        const parsed = JSON.parse(this.input)
        this.output = JSON.stringify(parsed)
        this.valid = true
      } catch (e) {
        this.error = e.message
        this.output = ''
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
@import '../assets/styles.css';

.json-formatter {
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
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 17px;
  text-shadow: 0 0 10px var(--green-glow);
}

.tool-body {
  margin-top: 1rem;
}

.input-label {
  color: var(--green);
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
}

.code-input {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--panel-2);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  padding: 12px;
  resize: vertical;
  transition: all 0.2s;
}

.code-input:focus {
  outline: 0;
  border-color: var(--line-strong);
  box-shadow: 0 0 20px var(--green-glow);
}

.code-input::placeholder {
  color: var(--dim);
}

.code-input.output {
  background: rgba(157,255,107,0.03);
  border-color: rgba(157,255,107,0.2);
}

.button-group {
  display: flex;
  gap: 8px;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.button {
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.button:hover {
  border-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
  box-shadow: 0 0 15px var(--green-glow);
}

.status-error {
  color: var(--red);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255,107,125,0.3);
  background: rgba(255,107,125,0.05);
}

.status-success {
  color: var(--green);
  margin-top: 1rem;
  font-family: var(--mono);
  font-size: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(157,255,107,0.3);
  background: var(--green-soft);
}

.command-line {
  display: flex;
  align-items: center;
  gap: 10px;
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
  .json-formatter {
    width: min(var(--max), calc(100vw - 12px));
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button {
    width: 100%;
    text-align: center;
  }
}
</style>
