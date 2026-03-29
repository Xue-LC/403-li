<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，你访问的页面不存在</p>
      <router-link to="/" class="home-link">
        <span>🏠</span> 返回首页
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.content {
  max-width: 400px;
}

h1 {
  font-size: 6rem;
  margin: 0;
  color: #ff4757;
  line-height: 1;
}

h2 {
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
  color: #2f3542;
}

p {
  color: #747d8c;
  margin: 0.5rem 0 2rem;
}

.home-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3742fa;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.3s;
}

.home-link:hover {
  background: #5352ed;
}

.home-link span {
  margin-right: 0.5rem;
}
</style>
