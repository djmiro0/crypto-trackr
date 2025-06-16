<template>
    <div class="wrapper">
        <h1 class="greeting">Crypto Trackr</h1>
        <NuxtLink class="link" to='/portfolio'>
            View Portfolio
        </NuxtLink>

        <ModalChart v-if="showModal" :visible="showModal" :coin="selectedCoin" :fullHistory="priceHistory"
            :startDate="startDate" :endDate="endDate" @close="showModal = false" />

        <div class="filters">
            <input type="date" v-model="startDate" />
            <input type="date" v-model="endDate" />
            <button @click="filterByDate">Search</button>
            <button @click="reset">Reset</button>
        </div>

        <div v-if="filteredHistory.length">
            <table class="crypto-table" v-if="showCurrentTable">
                <thead>
                    <tr>
                        <th>Coin</th>
                        <th>Date</th>
                        <th>Last 24h</th>
                        <th>Last Week</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="coin in trackedCoins" :key="coin" @click="openModal(coin)">
                        <td>{{ coinLabels[coin] }}</td>
                        <td>{{ currentValue[0]?.date }}</td>
                        <td :class="getChangeClass(changes[coin]?.oneDay)">{{ changes[coin]?.oneDay }}%</td>
                        <td :class="getChangeClass(changes[coin]?.week)">{{ changes[coin]?.week }}%</td>
                        <td><b>{{ currentValue[0]?.[coin] }} €</b></td>
                    </tr>
                </tbody>
            </table>

            <button @click="toggleHistory">{{ showHistory ? 'Hide' : 'Load' }} History</button>

            <table class="crypto-table" v-if="showHistory">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th v-for="coin in trackedCoins" :key="coin">{{ coinLabels[coin] }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(entry, index) in filteredHistory" :key="index">
                        <td>{{ entry.date }}</td>
                        <td v-for="coin in trackedCoins" :key="coin">{{ entry[coin] }} €</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else>Loading...</div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ModalChart from '@/components/Modal.vue';

const trackedCoins = ['bitcoin', 'ethereum', 'ripple', 'cardano'];
const coinLabels = {
    bitcoin: 'Bitcoin (BTC)',
    ethereum: 'Ethereum (ETH)',
    ripple: 'Ripple (XRP)',
    cardano: 'Cardano (ADA)'
};

const priceHistory = ref([]);
const filteredHistory = ref([]);
const startDate = ref(null);
const endDate = ref(null);
const daysBack = ref(90);
const currentValue = ref([]);
const showHistory = ref(false);
const showModal = ref(false);
const showCurrentTable = ref(true)
const selectedCoin = ref('');

const changes = ref({});

const getChangeClass = (val) => val >= 0 ? 'increase' : 'decrease';

const sortByDateDesc = (arr) => arr.sort((a, b) => new Date(b.date) - new Date(a.date));

const openModal = (coin) => {
    selectedCoin.value = coin;
    showModal.value = true;
};

const fetchData = async () => {
    const coinData = await Promise.all(trackedCoins.map(coin =>
        useFetch(`https://api.coingecko.com/api/v3/coins/${coin}/market_chart`, {
            params: { vs_currency: 'eur', days: daysBack }
        })
    ));

    const dateMap = new Map();

    trackedCoins.forEach((coin, i) => {
        const coinPrices = coinData[i].data.value?.prices || [];
        coinPrices.forEach(([timestamp, price], idx) => {
            const date = new Date(timestamp).toISOString().split('T')[0];
            if (!dateMap.has(date)) dateMap.set(date, { date });
            dateMap.get(date)[coin] = price.toFixed(2);
        });
    });

    priceHistory.value = sortByDateDesc(Array.from(dateMap.values()));
    filteredHistory.value = priceHistory.value.slice(0, 20);
    currentValue.value = filteredHistory.value.slice(0, 1);

    calculateChanges();
};

const calculateChanges = () => {
    const sorted = priceHistory.value;
    if (!sorted.length) return;

    const current = sorted[0];
    const currentDate = new Date(current.date);

    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const oneDayAgo = new Date(currentDate);
    oneDayAgo.setDate(currentDate.getDate() - 1);

    const pastWeek = sorted.find(e => new Date(e.date) <= sevenDaysAgo);
    const pastDay = sorted.find(e => new Date(e.date) <= oneDayAgo);

    trackedCoins.forEach(coin => {
        const now = parseFloat(current[coin]);
        const week = pastWeek ? parseFloat(pastWeek[coin]) : null;
        const day = pastDay ? parseFloat(pastDay[coin]) : null;

        changes.value[coin] = {
            week: week ? ((now - week) / week * 100).toFixed(2) : 'N/A',
            oneDay: day ? ((now - day) / day * 100).toFixed(2) : 'N/A'
        };
    });
};

const filterByDate = () => {
    if (!startDate.value || !endDate.value) {
        filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20);
        return;
    }

    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    filteredHistory.value = sortByDateDesc(
        priceHistory.value.filter(entry => {
            const date = new Date(entry.date);
            return date >= start && date <= end;
        })
    ).slice(0, 20);
    showCurrentTable.value = false
    showHistory.value = true
};

const toggleHistory = () => {
    showHistory.value = !showHistory.value;
    showCurrentTable.value = true
};

const reset = () => {
    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20);

    showCurrentTable.value = true
    showHistory.value = false
};
await fetchData();
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

body {
    margin: 0;
    padding: 0;
    background: #f9f9f9;
    font-family: 'Inter', sans-serif;
    color: #1f1f1f;
}

.wrapper {
    margin: 0 auto;
    padding: 2rem;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
}

.greeting {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 3rem;
    color: #333;
    text-align: center;
}

.link {
    display: inline-block;
    margin-bottom: 2rem;
    text-decoration: none;
    color: #0066cc;
    font-weight: 600;
    border: 1px solid #0066cc;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.link:hover {
    background-color: #0066cc;
    color: #fff;
}

input[type="date"],
button {
    margin-right: 1rem;
    margin-bottom: 1rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border-radius: 6px;
    border: 1px solid #ccc;
}

button {
    background-color: #0066cc;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #004a99;
}

.crypto-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    font-size: 0.95rem;
}

.crypto-table th,
.crypto-table td {
    padding: 0.75rem 1rem;
    text-align: center;
    border: 1px solid #e0e0e0;
}

.crypto-table th {
    background-color: #cccccc;
    font-weight: 600;
    color: #333;
}

.crypto-table tbody tr:hover {
    background-color: #f0f0f0;
}

.increase {
    color: green
}

.decrease {
    color: crimson
}
</style>
