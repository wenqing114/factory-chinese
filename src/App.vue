<script setup>
import AppHeader from './components/AppHeader.vue'
import SidebarNavigation from './components/SidebarNavigation.vue'
import StudyWorkspace from './components/StudyWorkspace.vue'
</script>

<template>
  <header class="site-header">
    <div class="site-brand">
      <span class="site-mark" aria-hidden="true">中</span>
      <div>
        <h1>TE Chinese Lab</h1>
        <p>Tiếng Trung kỹ thuật · TE / ORT / TEST</p>
      </div>
    </div>
    <AppHeader />
  </header>
  <main class="site-layout">
    <SidebarNavigation />
    <section class="content">
      <StudyWorkspace />
    </section>
  </main>
</template>
