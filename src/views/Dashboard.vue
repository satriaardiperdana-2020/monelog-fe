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
          <tr><th>ID</th><th>Category</th><th>Amount</th><th>Note</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <td>{{ tx.id }}</td>
            <td>{{ getCategoryName(tx.category_id) }}</td>
            <td>{{ formatCurrency(tx.amount) }}</td>
            <td>{{ tx.note || '-' }}</td>
            <td>{{ tx.date }}</td>
            <td><button @click="deleteTransaction(tx.id)">Delete</button></td>
          </tr>
        
        </tbody>
      </table>

      <!-- Add Transaction Modal -->
      <div v-if="showForm" style="margin-top: 1rem; border: 1px solid #ccc; padding: 1rem;">
        <h3>Add Transaction</h3>
        <select v-model="newTransaction.category_id" required>
          <option :value="null" disabled>Select Category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }} ({{ cat.type === 'expense' ? 'Expense' : 'Income' }})
          </option>
        </select>
        <input v-model.number="newTransaction.amount" type="number" placeholder="Amount" required />
        <input v-model="newTransaction.note" placeholder="Note (optional)" />
        <input v-model="newTransaction.date" type="date" required />
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
const categories = ref([]);
const from = ref(new Date().toISOString().slice(0, 10));
const to = ref(new Date().toISOString().slice(0, 10));
const showForm = ref(false);
const newTransaction = ref({
  category_id: null,
  amount: 0,
  note: '',
  date: new Date().toISOString().slice(0, 10),
});

// Fetch all categories for the logged-in user
const fetchCategories = async () => {
  try {
    const res = await api.get('/api/v1/categories');
    categories.value = res.data;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
};

// Fetch transactions within the selected date range
const fetchTransactions = async () => {
  try {
    const res = await api.get(`/api/v1/transactions?from=${from.value}&to=${to.value}`);
    transactions.value = res.data;
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to fetch transactions');
  }
};

// Create a new transaction
const createTransaction = async () => {
  if (!newTransaction.value.category_id || newTransaction.value.amount <= 0) {
    alert('Please select a category and enter a valid amount.');
    return;
  }
  try {
    await api.post('/api/v1/transactions', newTransaction.value);
    showForm.value = false;
    // Reset form
    newTransaction.value = {
      category_id: null,
      amount: 0,
      note: '',
      date: new Date().toISOString().slice(0, 10),
    };
    fetchTransactions(); // refresh list
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to add transaction');
  }
};

// Soft delete a transaction
const deleteTransaction = async (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await api.delete(`/api/v1/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete transaction');
    }
  }
};

// Helper: get category name from ID
const getCategoryName = (categoryId) => {
  const cat = categories.value.find(c => c.id === categoryId);
  return cat ? cat.name : '?';
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

onMounted(() => {
  fetchCategories();
  fetchTransactions();
});
</script>