<template>
  <nav>
    <router-link to="/dashboard">Dashboard</router-link>
    <button @click="logout">Logout</button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const logout = async () => {
  try {
    // Call backend logout endpoint to revoke the token
    await api.post('/api/v1/auth/logout');
  } catch (error) {
    // Even if the backend call fails, we still clear local token
    console.error('Logout API error:', error);
  } finally {
    // Remove token from local storage
    localStorage.removeItem('token');
    // Redirect to login page
    router.push('/login');
  }
}
</script>

<style scoped>
nav {
  background: #333;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
nav a {
  color: white;
  text-decoration: none;
}
nav button {
  background: red;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}
</style>