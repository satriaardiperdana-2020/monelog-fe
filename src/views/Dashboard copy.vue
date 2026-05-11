<template>
  <div>
    <Navbar />
    <div class="dashboard-container">
      <div class="header">
        <h2>Catatan Keuangan</h2>
        <div class="tabs">
          <span class="active">UTAMA</span>
          <span>LAPORAN</span>
          <span>SETELAN</span>
        </div>
        <div class="today-summary">
          <div>Hari Ini, {{ today }}</div>
          <div class="amounts">
            <span>Rp{{ formatNumber(totalIncomeToday) }}</span>
            <span>Rp{{ formatNumber(totalExpenseToday) }}</span>
          </div>
        </div>
        <button @click="showAddModal = true" class="btn-add">Tambah</button>
      </div>

      <div class="transaction-list">
        <div v-for="item in dailyData" :key="item.date" class="transaction-item">
          <div class="date">{{ formatDate(item.date) }}</div>
          <div class="details">
            <span class="expense">Pengeluaran Rp{{ formatNumber(item.total_expense) }}</span>
            <span class="income">Pemasukan Rp{{ formatNumber(item.total_income) }}</span>
          </div>
        </div>
      </div>

      <!-- Modal Tambah Transaksi -->
      <div v-if="showAddModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <h3>Tambah Transaksi</h3>
          <div class="form-group">
            <label>Tipe</label>
            <select v-model="newTransaction.type" @change="filterCategories">
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>
          <div class="form-group">
            <label>Kategori</label>
            <select v-model="newTransaction.category_id">
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Jumlah</label>
            <input type="number" v-model="newTransaction.amount" />
          </div>
          <div class="form-group">
            <label>Judul</label>
            <input type="text" v-model="newTransaction.note" />
          </div>
          <div class="form-group">
            <label>Tanggal</label>
            <input type="date" v-model="newTransaction.date" />
          </div>
          <div class="modal-buttons">
            <button @click="closeModal">Batal</button>
            <button @click="saveTransaction">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';
import Navbar from '../components/Navbar.vue';

const dailyData = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const newTransaction = ref({
  type: 'expense',
  category_id: null,
  amount: 0,
  note: '',
  date: new Date().toISOString().slice(0, 10)
});

const today = new Date().toISOString().slice(0, 10);
const totalIncomeToday = computed(() => {
  const todayData = dailyData.value.find(d => d.date === today);
  return todayData ? todayData.total_income : 0;
});
const totalExpenseToday = computed(() => {
  const todayData = dailyData.value.find(d => d.date === today);
  return todayData ? todayData.total_expense : 0;
});

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === newTransaction.value.type);
});

const fetchSummary = async () => {
  try {
    const res = await api.get('/api/v1/reports/main-summary');
    dailyData.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get('/api/v1/categories');
    categories.value = res.data;
    if (categories.value.length) {
      const defaultCat = categories.value.find(c => c.type === newTransaction.value.type);
      newTransaction.value.category_id = defaultCat ? defaultCat.id : null;
    }
  } catch (err) {
    console.error(err);
  }
};

const saveTransaction = async () => {
  if (!newTransaction.value.category_id || newTransaction.value.amount <= 0) {
    alert('Lengkapi data transaksi');
    return;
  }
  try {
    await api.post('/api/v1/transactions', {
      category_id: newTransaction.value.category_id,
      amount: newTransaction.value.amount,
      date: newTransaction.value.date,
      note: newTransaction.value.note
    });
    closeModal();
    fetchSummary();
  } catch (err) {
    alert(err.response?.data?.error || 'Gagal simpan transaksi');
  }
};

const closeModal = () => {
  showAddModal.value = false;
  newTransaction.value = {
    type: 'expense',
    category_id: categories.value.find(c => c.type === 'expense')?.id || null,
    amount: 0,
    note: '',
    date: new Date().toISOString().slice(0, 10)
  };
};

const filterCategories = () => {
  const firstCat = categories.value.find(c => c.type === newTransaction.value.type);
  newTransaction.value.category_id = firstCat ? firstCat.id : null;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
};

onMounted(() => {
  fetchSummary();
  fetchCategories();
});
</script>

<style scoped>
.dashboard-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.tabs span {
  margin: 0 10px;
  padding: 5px;
  cursor: pointer;
}
.tabs .active {
  border-bottom: 2px solid #42b983;
  font-weight: bold;
}
.today-summary {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}
.amounts {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 1.2rem;
}
.btn-add {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 0.75rem 0;
}
.date {
  font-weight: bold;
  width: 30%;
}
.details {
  width: 70%;
  display: flex;
  justify-content: space-between;
}
.expense {
  color: #e74c3c;
}
.income {
  color: #2ecc71;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 350px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.modal-buttons button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>