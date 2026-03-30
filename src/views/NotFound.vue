<template>
  <div class="not-found">
    <!-- Topbar -->
    <Topbar toolCount="0" />

    <!-- 404 Content -->
    <section class="pane">
      <div class="pane-body">
        <div class="content">
          <h1 class="error-code glitch">404</h1>
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
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00)), var(--panel);
  box-shadow: var(--shadow);
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
  background: linear-gradient(90deg, var(--green), var(--cyan), var(--green));
  opacity: 0.4;
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

.error-code {
  font-size: 6rem;
  font-family: var(--mono);
  color: var(--error);
  text-shadow: 0 0 30px rgba(255,138,138,0.6);
  display: inline-block;
  margin: 0;
  line-height: 1;
  animation: glitch 2s infinite;
  max-width: 100%;
  word-break: break-word;
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
}

h2 {
  font-size: 19px;
  margin: 1.5rem 0 0.5rem;
  color: var(--text);
  font-family: var(--mono);
}

p {
  color: var(--text-dim);
  margin: 0.5rem 0 2rem;
  font-size: 16px;
}

.home-btn {
  display: inline-block;
  border: 1px solid var(--line-strong);
  background: rgba(255,255,255,0.02);
  color: var(--accent);
  padding: 10px 20px;
  font-family: var(--mono);
  font-size: 12px;
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
  font-size: 12px;
  color: var(--dim);
  text-transform: uppercase;
}

/* === Responsive === */
@media (max-width: 640px) {
  .error-code {
    font-size: 4rem; /* 移动端 4rem */
  }
  
  h2 {
    font-size: 17px; /* 移动端与主页标题一致 */
    margin: 1rem 0 0.5rem;
  }
  
  p {
    font-size: 15px; /* 移动端与主页描述一致 */
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
    width: 100%; /* 移动端全宽 */
    max-width: 100%;
    padding: 14px 24px; /* 触摸目标至少 44px 高度 */
    min-height: 44px;
    text-align: center;
    font-size: 12px; /* 与底栏一致 */
  }
  
  .content {
    padding: 0;
  }
}

/* 超小屏幕 */
@media (max-width: 375px) {
  .error-code {
    font-size: 3.5rem;
  }
  
  h2 {
    font-size: 17px;
  }
  
  p {
    font-size: 15px;
  }
  
  .pane-body {
    padding: 0.75rem;
  }
  
  .home-btn {
    font-size: 11px;
  }
}
</style>
