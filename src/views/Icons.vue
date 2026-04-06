<template>
  <div class="icons-demo">
    <div class="terminal-window">
      <div class="terminal-header">
        <span class="terminal-title glitch">user@403-li:~/icons</span>
        <div class="terminal-buttons">
          <span class="btn btn-close"></span>
          <span class="btn btn-minimize"></span>
          <span class="btn btn-maximize"></span>
        </div>
      </div>
      <div class="terminal-body">
        <h1 class="page-title">
          <span class="prompt">$</span>
          <span class="command">ls ./icons</span>
        </h1>
        
        <div class="icon-grid">
          <div v-for="icon in icons" :key="icon.name" class="icon-card">
            <div class="icon-display">
              <Icon :name="icon.name" :size="48" :strokeWidth="2" />
            </div>
            <div class="icon-info">
              <code class="icon-name">{{ icon.name }}</code>
              <p class="icon-desc">{{ icon.desc }}</p>
            </div>
            <div class="icon-comparison">
              <span class="comparison-label">旧:</span>
              <span class="emoji-icon">{{ icon.emoji }}</span>
              <span class="comparison-label">新:</span>
              <Icon :name="icon.name" :size="20" />
            </div>
          </div>
        </div>

        <div class="ascii-section">
          <h2 class="section-title">
            <span class="prompt">$</span>
            <span class="command">cat ascii-art.txt</span>
          </h2>
          <pre class="ascii-art">
  _  _  ___  ____  ____ 
 ( \( )/ __)(  _ \(  __)
  )  (( (__  )   / ) _)
 (__\_)\___)(__\_)(____)
          </pre>
        </div>

        <div class="usage-section">
          <h2 class="section-title">
            <span class="prompt">$</span>
            <span class="command">usage.md</span>
          </h2>
          <div class="code-block">
            <pre>&lt;Icon name="home" :size="24" /&gt;
&lt;Icon name="tools" :size="32" /&gt;
&lt;Icon name="github" :strokeWidth="2.5" /&gt;</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from '../components/Icon.vue'

export default {
  name: 'IconsDemo',
  components: {
    Icon
  },
  data() {
    return {
      icons: [
        { name: 'home', desc: '首页 / Home', emoji: '🏠' },
        { name: 'tools', desc: '工具 / Tools', emoji: '🛠️' },
        { name: 'game', desc: '游戏 / Games', emoji: '🎮' },
        { name: 'github', desc: 'GitHub / Code', emoji: '📦' },
        { name: 'theme', desc: '主题 / Theme', emoji: '🌙/☀️' },
        { name: 'qr', desc: '二维码 / QR', emoji: '📱' },
        { name: 'security', desc: '安全 / Security', emoji: '🔐' },
        { name: 'settings', desc: '设置 / Settings', emoji: '⚙️' }
      ]
    }
  }
}
</script>

<style scoped>
@import '../assets/styles/index.css';

.icons-demo {
  padding: 2rem;
}

.page-title {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--text-success);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt {
  color: var(--text-success);
  font-weight: bold;
}

.command {
  color: var(--text-primary);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.icon-card {
  background: var(--card-bg);
  border: 1px solid var(--line);
  box-shadow: var(--card-shadow);
  position: relative;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
}

.icon-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.icon-card:hover {
  border-color: var(--green);
  background: rgba(18,22,27,0.98);
  box-shadow: 0 0 20px var(--green-glow), inset 0 1px 0 rgba(255,255,255,0.05);
  transform: translateY(-2px);
}

.icon-display {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.icon-info {
  margin-bottom: 1rem;
}

.icon-name {
  display: block;
  background: var(--card-bg);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  color: var(--amber);
  margin-bottom: 0.5rem;
  position: relative;
}

.icon-name::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.3;
}

.icon-desc {
  color: var(--text-dim);
  font-size: 0.9rem;
}

.icon-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
}

.comparison-label {
  color: var(--text-dim);
}

.emoji-icon {
  font-size: 1.2rem;
  margin: 0 0.3rem;
}

.ascii-section,
.usage-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ascii-art {
  background: var(--card-bg);
  border: 1px solid var(--line);
  box-shadow: var(--card-shadow);
  position: relative;
  padding: 1.5rem;
  color: var(--green);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  overflow-x: auto;
  text-align: center;
}

.ascii-art::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.code-block {
  background: var(--card-bg);
  border: 1px solid var(--line);
  box-shadow: var(--card-shadow);
  position: relative;
  padding: 1.5rem;
  overflow-x: auto;
}

.code-block::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.code-block pre {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  margin: 0;
}
</style>
