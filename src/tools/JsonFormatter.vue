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
        <p style="color: var(--text-dim); margin: 1rem 0;">输入 JSON，点击格式化</p>
        
        <div class="tool-body">
          <label style="color: var(--text-success); display: block; margin-bottom: 0.5rem;">输入 JSON：</label>
          <textarea 
            v-model="input" 
            placeholder='{"name": "test", "value": 123}'
            rows="8"
          ></textarea>
          
          <div style="margin: 1rem 0;">
            <button class="button" @click="format">✨ 格式化</button>
            <button class="button" @click="minify">📦 压缩</button>
            <button class="button" @click="clear">🗑️ 清空</button>
          </div>
          
          <label style="color: var(--text-success); display: block; margin-bottom: 0.5rem;">输出：</label>
          <textarea 
            v-model="output" 
            readonly 
            rows="8"
            style="background: var(--bg-primary);"
          ></textarea>
          
          <div v-if="error" style="color: var(--text-error); margin-top: 1rem;">
            ❌ 错误：{{ error }}
          </div>
          
          <div v-if="valid" style="color: var(--text-success); margin-top: 1rem;">
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
.json-formatter {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  color: var(--text-success);
  margin-bottom: 0.5rem;
}
</style>
