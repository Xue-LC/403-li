<template>
  <section class="tool-pane">
    <div class="tool-pane-head">
      <span>&#128279; HTML 实体编解码</span>
      <span>在线工具</span>
    </div>
    <div class="tool-pane-body">
      <div class="tool-body">
        <div class="tool-two-col">
          <div class="tool-col">
            <label class="tool-label">输入：</label>
            <textarea
              v-model="input"
              placeholder="输入文本或 HTML 实体字符串..."
              rows="10"
              class="code-input"
            ></textarea>
          </div>
          <div class="tool-col">
            <label class="tool-label">输出：</label>
            <textarea
              :value="output"
              readonly
              rows="10"
              class="code-input output"
              placeholder="结果显示在这里..."
            ></textarea>
          </div>
        </div>

        <!-- 实体格式选择 -->
        <div class="radio-group" style="margin-top: 16px;">
          <label class="radio-label">
            <input type="radio" v-model="entityMode" value="named" />
            <span>命名实体 (&amp;amp; &amp;lt;)</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="entityMode" value="numeric" />
            <span>数字实体 (&amp;#38; &amp;#60;)</span>
          </label>
        </div>

        <div class="button-group button-group-4">
          <button class="tool-button primary" @click="encode">
            &#128274; 编码
          </button>
          <button class="tool-button" @click="decode">
            &#128275; 解码
          </button>
          <button class="tool-button" @click="copyOutput" :disabled="!output.trim()">
            &#128203; 复制
          </button>
          <button class="tool-button danger" @click="clear">
            &#128465;&#65039; 清空
          </button>
        </div>

        <div v-if="error" class="status-error">
          &#10060; 错误：{{ error }}
        </div>

        <div v-if="success" class="status-success">
          &#9989; {{ successMsg }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { copyText } from '../../utils/clipboard'

const NAMED_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export default {
  name: 'HtmlEntityTool',
  data() {
    return {
      input: '',
      output: '',
      entityMode: 'named',
      error: '',
      success: false,
      successMsg: '成功'
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
        if (this.entityMode === 'named') {
          this.output = this.encodeNamedEntities(this.input)
        } else {
          this.output = this.encodeNumericEntities(this.input)
        }
        this.success = true
        this.successMsg = '编码成功'
        setTimeout(() => { this.success = false }, 2000)
      } catch (e) {
        this.error = '编码失败：' + e.message
        this.output = ''
      }
    },

    encodeNamedEntities(text) {
      // Use DOM to encode — handles all special HTML characters
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },

    encodeNumericEntities(text) {
      let result = ''
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const code = char.charCodeAt(0)
        // Always encode special HTML chars and high Unicode
        if (NAMED_ENTITIES[char] || code > 127) {
          result += '&#' + code + ';'
        } else {
          result += char
        }
      }
      return result
    },

    decode() {
      this.error = ''
      this.success = false

      if (!this.input) {
        this.error = '请输入要解码的 HTML 实体字符串'
        return
      }

      try {
        // Use DOM to decode — handles both named and numeric entities
        const div = document.createElement('div')
        div.innerHTML = this.input
        this.output = div.textContent
        this.success = true
        this.successMsg = '解码成功'
        setTimeout(() => { this.success = false }, 2000)
      } catch (e) {
        this.error = '解码失败：请检查实体格式是否正确'
        this.output = ''
      }
    },

    async copyOutput() {
      if (await copyText(this.output)) {
        this.success = true
        this.successMsg = '已复制'
        setTimeout(() => { this.success = false }, 2000)
      }
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
/* 全部使用全局样式，无需重复定义 */
</style>
