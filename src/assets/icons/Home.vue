<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    :stroke-width="strokeWidth"
    stroke-linecap="round" 
    stroke-linejoin="round"
    :class="className"
  >
    <!-- Home icon -->
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
</template>

<script>
export default {
  name: 'IconHome',
  props: {
    size: { type: Number, default: 24 },
    strokeWidth: { type: Number, default: 2 },
    className: { type: String, default: '' }
  }
}
</script>
