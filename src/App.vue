<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* 导入全局样式 */
@import './assets/styles/index.css';

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
}

.app {
  min-height: 100vh;
}
</style>
