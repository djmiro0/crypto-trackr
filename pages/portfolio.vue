<template>
  <div class="wrapper">
    <h1>💼 My Portfolio</h1>

    <!-- Add Entry Form -->
    <form @submit.prevent="addEntry" class="form">
      <input v-model="newEntry.currency" placeholder="Currency (e.g. Bitcoin)" required />
      <input v-model.number="newEntry.amount" type="number" step="any" placeholder="Amount" required />
      <input v-model.number="newEntry.purchasePrice" type="number" step="any" placeholder="Purchase Price (€)"
        required />
      <input v-model="newEntry.purchaseTime" type="datetime-local" required />
      <button type="submit">➕ Add</button>
    </form>

    <!-- Portfolio Table -->
    <table class="crypto-table" v-if="portfolio.length">
      <thead>
        <tr>
          <th>Currency</th>
          <th>Amount</th>
          <th>Buy Price (€)</th>
          <th>Purchase Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in portfolio" :key="entry.id">
          <td>{{ entry.currency }}</td>
          <td>{{ entry.amount }}</td>
          <td>{{ entry.purchasePrice }}</td>
          <td>{{ formatDate(entry.purchaseTime) }}</td>
          <td><button @click="deleteEntry(entry.id)">🗑 Delete</button></td>
        </tr>
      </tbody>
    </table>

    <p v-else>No portfolio entries yet.</p>

    <!-- Total Value -->
    <div class="total">
      <strong>Total Portfolio Value: </strong>{{ totalValue }} €
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const portfolio = ref([])
const totalValue = ref(0)

const newEntry = ref({
  currency: '',
  amount: null,
  purchasePrice: null,
  purchaseTime: ''
})

// Fetch portfolio from backend
const fetchPortfolio = async () => {
  const { data } = await useFetch('/api/portfolio')
  if (data.value) {
    portfolio.value = data.value.entries
    totalValue.value = data.value.total
  }
}

// Add new portfolio entry
const addEntry = async () => {
  await $fetch('/api/portfolio', {
    method: 'POST',
    body: newEntry.value
  })
  newEntry.value = { currency: '', amount: null, purchasePrice: null, purchaseTime: '' }
  fetchPortfolio()
}

// Delete an entry
const deleteEntry = async (id) => {
  await $fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
  fetchPortfolio()
}

// Format datetime
const formatDate = (iso) => new Date(iso).toLocaleString()

onMounted(() => {
  fetchPortfolio()
})
</script>

<style scoped>
.wrapper {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1;
  min-width: 150px;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background-color: #004a99;
}

.crypto-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.crypto-table th,
.crypto-table td {
  padding: 0.75rem 1rem;
  border: 1px solid #eee;
  text-align: center;
}

.total {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: right;
}
</style>
