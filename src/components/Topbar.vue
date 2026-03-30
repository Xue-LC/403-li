<template>
  <header class="topbar">
    <router-link to="/" class="brand" @click.native="handleBrandClick">
      <div class="leds">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="brand-text">403.li / 中文工具站</span>
    </router-link>
    <div class="status">{{ toolCount }} 个工具可用</div>
  </header>
</template>

<script>
export default {
  name: 'Topbar',
  props: {
    toolCount: {
      type: [Number, String],
      default: 0
    }
  },
  methods: {
    handleBrandClick(event) {
      // 确保移动端点击事件正常触发
      console.log('Brand clicked, navigating to home')
    }
  }
}
</script>

<style scoped>
.topbar {
  border: 1px solid var(--line);
  background: rgba(18,22,27,0.94);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  flex-wrap: wrap;
  position: relative;
}

.topbar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--green), transparent);
  opacity: 0.5;
}

[data-theme="light"] .topbar {
  background: rgba(255,255,255,0.94);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-family: var(--mono);
  font-size: 16px; /* 与 styles.css 一致 */
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
  padding: 8px 10px;
  margin: -8px -10px;
  border-radius: 4px;
}

@media (max-width: 640px) {
  .brand {
    font-size: 15px; /* 移动端 15px */
  }
}

.leds {
  display: inline-flex;
  gap: 6px;
  flex: 0 0 auto;
}

.leds span {
  width: 10px;
  height: 10px;
  border: 1px solid #000;
  box-shadow: inset -1px -1px 0 rgba(0,0,0,0.3);
}

.leds span:nth-child(1) { 
  background: var(--red); 
  box-shadow: 0 0 8px rgba(255,107,125,0.4);
}

.leds span:nth-child(2) { 
  background: var(--amber); 
  box-shadow: 0 0 8px rgba(255,216,102,0.4);
}

.leds span:nth-child(3) { 
  background: var(--green); 
  box-shadow: 0 0 8px rgba(157,255,107,0.4);
}

.brand-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  color: var(--dim);
  font-family: var(--mono);
  font-size: 14px; /* 与 styles.css 一致 */
  white-space: nowrap;
}

@media (max-width: 640px) {
  .topbar {
    align-items: flex-start;
  }
  
  .status {
    width: 100%;
    text-align: right;
  }
}
</style>
