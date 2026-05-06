<template>
  <nav>
    <router-link to="/dashboard">Dashboard</router-link>
    <button @click="logout">Logout</button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<style scoped>
nav { background: #333; padding: 1rem; }
nav a { color: white; margin-right: 1rem; text-decoration: none; }
nav button { background: red; color: white; border: none; padding: 0.25rem 0.5rem; cursor: pointer; }
</style>