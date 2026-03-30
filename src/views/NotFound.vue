<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Content -->
    <section class="pane">
      <div class="pane-body">
        <div class="content">
          <h1 class="error-code" data-text="404">404</h1>
          <h2>页面未找到</h2>
          <p>抱歉，你访问的页面不存在或已被移除</p>
          <router-link to="/" class="home-btn">
            ← 返回首页
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>403.li // 中文终端工具站</span>
      <span>纯前端 · 无追踪 · 开源</span>
    </footer>
  </div>
</template>

<script>
import Topbar from '../components/Topbar.vue'

export default {
  name: 'NotFound',
  components: {
    Topbar
  }
}
</script>

<style scoped>
@import '../assets/styles.css';

.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === Pane === */
.pane {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: var(--card-bg-gradient), var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.pane::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--card-top-line);
  opacity: 0.5;
}

.pane-body {
  padding: 2rem;
  width: 100%;
  max-width: 100%;
}

.content {
  text-align: center;
  padding: 0 1rem;
}

/* === 404 Glitch Effect === */
.error-code {
  font-size: 6rem;
  font-family: var(--mono);
  color: var(--error);
  position: relative;
  display: inline-block;
  margin: 0;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 8px;
}

/* 红色层 */
.error-code::before {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: #ff003c;
  opacity: 0.8;
  overflow: hidden;
  animation: glitch-1 2.5s infinite linear alternate-reverse;
}

/* 蓝色层 */
.error-code::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: #00f0ff;
  opacity: 0.8;
  overflow: hidden;
  animation: glitch-2 3s infinite linear alternate-reverse;
}

/* 随机切片效果 */
@keyframes glitch-1 {
  0% { clip-path: inset(80% 0 0 0); transform: translate(-2px, 1px); }
  5% { clip-path: inset(20% 0 60% 0); transform: translate(2px, -1px); }
  10% { clip-path: inset(50% 0 30% 0); transform: translate(-1px, 2px); }
  15% { clip-path: inset(10% 0 80% 0); transform: translate(1px, -2px); }
  20% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 1px); }
  25% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 1px); }
  30% { clip-path: inset(90% 0 0 0); transform: translate(-1px, -1px); }
  35% { clip-path: inset(15% 0 70% 0); transform: translate(1px, 2px); }
  40% { clip-path: inset(55% 0 25% 0); transform: translate(-2px, -1px); }
  45% { clip-path: inset(5% 0 85% 0); transform: translate(2px, 2px); }
  50% { clip-path: inset(75% 0 5% 0); transform: translate(-1px, 1px); }
  55% { clip-path: inset(25% 0 60% 0); transform: translate(1px, -2px); }
  60% { clip-path: inset(65% 0 20% 0); transform: translate(-2px, 2px); }
  65% { clip-path: inset(0 0 90% 0); transform: translate(2px, -1px); }
  70% { clip-path: inset(45% 0 40% 0); transform: translate(-1px, -2px); }
  75% { clip-path: inset(85% 0 5% 0); transform: translate(1px, 1px); }
  80% { clip-path: inset(35% 0 55% 0); transform: translate(-2px, -2px); }
  85% { clip-path: inset(10% 0 75% 0); transform: translate(2px, 1px); }
  90% { clip-path: inset(60% 0 30% 0); transform: translate(-1px, 2px); }
  95% { clip-path: inset(20% 0 65% 0); transform: translate(1px, -1px); }
  100% { clip-path: inset(80% 0 10% 0); transform: translate(-2px, 1px); }
}

@keyframes glitch-2 {
  0% { clip-path: inset(10% 0 70% 0); transform: translate(2px, -1px); }
  5% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 1px); }
  10% { clip-path: inset(25% 0 65% 0); transform: translate(1px, 2px); }
  15% { clip-path: inset(80% 0 10% 0); transform: translate(-1px, -2px); }
  20% { clip-path: inset(5% 0 85% 0); transform: translate(2px, 2px); }
  25% { clip-path: inset(50% 0 35% 0); transform: translate(-2px, -1px); }
  30% { clip-path: inset(90% 0 0 0); transform: translate(1px, 1px); }
  35% { clip-path: inset(15% 0 75% 0); transform: translate(-1px, -2px); }
  40% { clip-path: inset(70% 0 15% 0); transform: translate(2px, -2px); }
  45% { clip-path: inset(30% 0 55% 0); transform: translate(-2px, 1px); }
  50% { clip-path: inset(85% 0 5% 0); transform: translate(1px, 2px); }
  55% { clip-path: inset(0 0 95% 0); transform: translate(-1px, -1px); }
  60% { clip-path: inset(45% 0 45% 0); transform: translate(2px, 1px); }
  65% { clip-path: inset(20% 0 70% 0); transform: translate(-2px, -2px); }
  70% { clip-path: inset(75% 0 10% 0); transform: translate(1px, 1px); }
  75% { clip-path: inset(35% 0 50% 0); transform: translate(-1px, 2px); }
  80% { clip-path: inset(95% 0 0 0); transform: translate(2px, -1px); }
  85% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, -1px); }
  90% { clip-path: inset(55% 0 35% 0); transform: translate(1px, -2px); }
  95% { clip-path: inset(25% 0 60% 0); transform: translate(-1px, 1px); }
  100% { clip-path: inset(65% 0 25% 0); transform: translate(2px, 2px); }
}

h2 {
  font-size: 18px;
  margin: 1.5rem 0 0.5rem;
  color: var(--text);
  font-family: var(--mono);
}

p {
  color: var(--text-dim);
  margin: 0.5rem 0 2rem;
  font-size: 15px;
}

.home-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 13px;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.2s;
  min-height: 44px;
}

.home-btn:hover {
  border-color: var(--green);
  background: var(--green-soft);
  box-shadow: 0 0 20px var(--green-glow);
  color: var(--green);
}

/* === Footer === */
.footer {
  margin-top: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .error-code {
    font-size: 4rem;
    letter-spacing: 4px;
  }
  
  h2 {
    font-size: 16px;
    margin: 1rem 0 0.5rem;
  }
  
  p {
    font-size: 13px;
    margin: 0.5rem 0 1.5rem;
  }
  
  .pane-body {
    padding: 1rem;
  }
  
  .pane {
    min-height: auto;
    margin-top: 8px;
  }
  
  .home-btn {
    display: block;
    width: 100%;
    max-width: 100%;
    padding: 14px 24px;
    min-height: 44px;
    text-align: center;
    font-size: 13px;
  }
  
  .content {
    padding: 0;
  }
  
  .footer {
    font-size: 12px;
  }
}

@media (max-width: 375px) {
  .error-code {
    font-size: 3.5rem;
    letter-spacing: 3px;
  }
  
  h2 {
    font-size: 16px;
  }
  
  p {
    font-size: 13px;
  }
  
  .pane-body {
    padding: 0.75rem;
  }
  
  .home-btn {
    font-size: 12px;
  }
  
  .footer {
    font-size: 11px;
  }
}
</style>
