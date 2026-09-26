<template>

    <!-- 工具主体 -->
    <section class="tool-pane">
      <div class="tool-pane-head">
        <span>📝 文本 Diff 对比</span>
        <span>在线工具</span>
      </div>
      <div class="tool-pane-body">
        <div class="tool-body">
          <!-- 文件上传 -->
          <div class="upload-section">
            <div class="upload-area" 
                 :class="{ 'drag-over': dragOver1 }"
                 @dragover.prevent="dragOver1 = true"
                 @dragleave.prevent="dragOver1 = false"
                 @drop.prevent="handleDrop1"
                 @click="$refs.fileInput1.click()">
              <input 
                ref="fileInput1"
                type="file" 
                @change="uploadFile1" 
                accept=".txt,.json,.js,.css,.html,.md,.log"
                style="display: none"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传原文文件</span>
                <span class="upload-hint">支持 TXT, JSON, JS, CSS, HTML, MD, LOG</span>
              </div>
            </div>
            <div class="upload-area" 
                 :class="{ 'drag-over': dragOver2 }"
                 @dragover.prevent="dragOver2 = true"
                 @dragleave.prevent="dragOver2 = false"
                 @drop.prevent="handleDrop2"
                 @click="$refs.fileInput2.click()">
              <input 
                ref="fileInput2"
                type="file" 
                @change="uploadFile2" 
                accept=".txt,.json,.js,.css,.html,.md,.log"
                style="display: none"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击或拖拽上传新文文件</span>
                <span class="upload-hint">支持 TXT, JSON, JS, CSS, HTML, MD, LOG</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button class="tool-button" @click="swapTexts">🔄 交换</button>
            <button class="tool-button danger" @click="clearAll">🗑️ 清空</button>
          </div>

          <!-- 文本输入 -->
          <div class="diff-inputs">
            <div class="input-panel">
              <label class="tool-label">原文：</label>
              <textarea v-model="leftText" placeholder="粘贴原文或上传文件..." rows="10"></textarea>
            </div>
            <div class="input-panel">
              <label class="tool-label">新文：</label>
              <textarea v-model="rightText" placeholder="粘贴新文或上传文件..." rows="10"></textarea>
            </div>
          </div>

          <!-- 对比选项 -->
          <div class="diff-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="ignoreWhitespace" @change="computeDiff" />
              <span>忽略空白</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="ignoreCase" @change="computeDiff" />
              <span>忽略大小写</span>
            </label>
            <button class="tool-button primary" @click="computeDiff">🔍 开始对比</button>
          </div>

          <!-- 统计信息 -->
          <div v-if="stats" class="diff-stats">
            <span>共 {{ stats.total }} 行</span>
            <span class="added">+{{ stats.added }} 行</span>
            <span class="removed">-{{ stats.removed }} 行</span>
            <span class="unchanged">= {{ stats.unchanged }} 行</span>
          </div>

          <!-- Diff 结果 -->
          <div v-if="diffResult.length > 0" class="diff-result">
            <label class="tool-label">对比结果：</label>
            <div class="diff-content">
              <div v-for="(part, idx) in diffResult" :key="idx"
                   class="diff-line"
                   :class="{
                     'added': part.added,
                     'removed': part.removed,
                     'unchanged': !part.added && !part.removed
                   }">
                <span class="line-marker">{{ part.added ? '+' : part.removed ? '-' : ' ' }}</span>
                <span class="line-content">{{ part.value }}</span>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="status-error">
            ❌ {{ error }}
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
</template>

<script>
import { diffLines } from 'diff'

export default {
  name: 'DiffTool',
    data() {
    return {
      leftText: '',
      rightText: '',
      diffResult: [],
      stats: null,
      ignoreWhitespace: false,
      ignoreCase: false,
      error: '',
      dragOver1: false,
      dragOver2: false
    }
  },
  methods: {
    uploadFile1(event) {
      this.readFile(event.target.files[0], 'leftText')
    },
    uploadFile2(event) {
      this.readFile(event.target.files[0], 'rightText')
    },
    handleDrop1(event) {
      this.dragOver1 = false
      const file = event.dataTransfer.files[0]
      if (file) this.readFile(file, 'leftText')
    },
    handleDrop2(event) {
      this.dragOver2 = false
      const file = event.dataTransfer.files[0]
      if (file) this.readFile(file, 'rightText')
    },
    readFile(file, target) {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        this[target] = e.target.result
        this.computeDiff()
      }
      reader.readAsText(file)
    },
    swapTexts() {
      const temp = this.leftText
      this.leftText = this.rightText
      this.rightText = temp
      this.computeDiff()
    },
    clearAll() {
      this.leftText = ''
      this.rightText = ''
      this.diffResult = []
      this.stats = null
      this.error = ''
    },
    computeDiff() {
      let left = this.leftText
      let right = this.rightText

      if (this.ignoreWhitespace) {
        left = left.replace(/\s+/g, ' ').trim()
        right = right.replace(/\s+/g, ' ').trim()
      }
      if (this.ignoreCase) {
        left = left.toLowerCase()
        right = right.toLowerCase()
      }

      const diff = diffLines(left, right)
      this.diffResult = diff.filter(part => part.value !== '\n')
      
      // 统计
      this.stats = {
        total: diff.length,
        added: diff.filter(p => p.added).length,
        removed: diff.filter(p => p.removed).length,
        unchanged: diff.filter(p => !p.added && !p.removed).length
      }
    }
  }
}
</script>

<style scoped>

/* === 组件特有样式 === */

.upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.upload-area {
  border: 2px dashed var(--line);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.2);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--green);
  background: rgba(157, 255, 107, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-text {
  color: var(--text);
  font-size: 14px;
}

.upload-hint {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono);
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}

.diff-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-panel textarea {
  width: 100%;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text);
  resize: vertical;
  min-height: 200px;
}

.diff-options {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.diff-stats {
  display: flex;
  gap: 1rem;
  padding: 10px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  margin-bottom: 1rem;
  font-family: var(--mono);
  font-size: 13px;
}

.diff-stats .added { color: var(--green); }
.diff-stats .removed { color: #ff6b6b; }
.diff-stats .unchanged { color: var(--muted); }

.diff-result {
  margin-top: 1rem;
}

.diff-content {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 0;
  max-height: 500px;
  overflow-y: auto;
  font-family: var(--mono);
  font-size: 13px;
}

.diff-line {
  display: flex;
  padding: 2px 8px;
  line-height: 1.5;
}

.diff-line.added {
  background: rgba(22, 163, 74, 0.15);
  color: var(--green);
}

.diff-line.removed {
  background: rgba(220, 38, 38, 0.15);
  color: #ff6b6b;
}

.diff-line.unchanged {
  background: transparent;
  color: var(--text);
}

.line-marker {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
  font-weight: bold;
}

.line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 640px) {
  .upload-section,
  .diff-inputs {
    grid-template-columns: 1fr;
  }
  
  .diff-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .diff-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>
