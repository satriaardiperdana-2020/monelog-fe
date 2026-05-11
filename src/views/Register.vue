<template>
  <div class="auth-container">
    <h2>Register</h2>
    <form @submit.prevent="register">
      <input type="text" v-model="name" placeholder="Nama lengkap" required />
      <input type="email" v-model="email" placeholder="Email" required />
      <input type="password" v-model="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    <p>Sudah punya akun? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const name = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();

const register = async () => {
  try {
    const res = await api.post('/api/v1/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value
    });
    localStorage.setItem('token', res.data.token);
    router.push('/dashboard');
  } catch (err) {
    alert(err.response?.data?.error || 'Register gagal');
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
input, button {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}
button {
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
</style>