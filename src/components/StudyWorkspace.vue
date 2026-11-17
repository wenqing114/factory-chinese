<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  import('../legacy/app.js')
})
</script>

<template>
  <div id="app"></div>
</template>
