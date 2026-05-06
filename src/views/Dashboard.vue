<template>
  <div>
    <Navbar />
    <div style="padding: 1rem;">
      <h2>Dashboard</h2>
      <div>
        <label>From: <input type="date" v-model="from" /></label>
        <label>To: <input type="date" v-model="to" /></label>
        <button @click="fetchTransactions">Filter</button>
      </div>
      <button @click="showForm = true">Add Transaction</button>
      <table border="1" cellpadding="8" style="margin-top: 1rem; width: 100%;">
        <thead>
          <tr><th>ID</th><th>Amount</th><th>Note</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <td>{{ tx.id }}</td>
            <td>{{ formatRupiah(tx.amount) }}</td>
            <td>{{ tx.note }}</td>
            <td>{{ tx.date }}</td>
            <td><button @click="deleteTransaction(tx.id)">Delete</button></td>
          </tr>
        </tbody>
      </table>
      <!-- Simple form modal -->
      <div v-if="showForm" style="margin-top: 1rem; border: 1px solid #ccc; padding: 1rem;">
        <h3>Add Transaction</h3>
        <input v-model="newTransaction.category_id" placeholder="Category ID" />
        <input v-model="newTransaction.amount" placeholder="Amount" />
        <input v-model="newTransaction.note" placeholder="Note" />
        <input v-model="newTransaction.date" type="date" />
        <button @click="createTransaction">Save</button>
        <button @click="showForm = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';

const transactions = ref([]);
const from = ref(new Date().toISOString().slice(0,10));
const to = ref(new Date().toISOString().slice(0,10));
const showForm = ref(false);
const newTransaction = ref({ category_id: null, amount: 0, note: '', date: '' });

const fetchTransactions = async () => {
  const res = await api.get(`/transactions?from=${from.value}&to=${to.value}`);
  transactions.value = res.data;
};

const createTransaction = async () => {
  await api.post('/transactions', newTransaction.value);
  showForm.value = false;
  newTransaction.value = { category_id: null, amount: 0, note: '', date: '' };
  fetchTransactions();
};

const deleteTransaction = async (id) => {
  if (confirm('Delete this transaction?')) {
    await api.delete(`/transactions/${id}`);
    fetchTransactions();
  }
};

const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

onMounted(fetchTransactions);
</script>