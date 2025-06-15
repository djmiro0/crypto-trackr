<template>
    <div class="wrapper">
        <h1 class="greeting">Crypto Trackr</h1>
        <NuxtLink class="link" to='/portfolio'>
            💼 View Portfolio
        </NuxtLink>


        <div class="filters">
            <input type="date" v-model="startDate" />
            <input type="date" v-model="endDate" />
            <button @click="filterByDate">Search</button>
            <button @click="reset">Reset</button>
        </div>

        <div v-if="filteredHistory">
            <table class="crypto-table">
                <thead>
                    <tr>
                        <th>Coin</th>
                        <th>Date</th>
                        <th>Last 24h</th>
                        <th>Last Week</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody v-for="(entry, index) in currentValue" :key="index">
                    <tr>
                        <td>{{ "Bitcoin (BTC)" }}</td>
                        <td>{{ entry.date }}</td>
                        <td :class="btcClass">{{ changes.bitcoinChangeOneDay }}%</td>
                        <td :class="btcClass">{{ changes.bitcoinChange }}%</td>
                        <td><b>{{ entry.bitcoin }} €</b> </td>
                    </tr>
                    <tr>
                        <td>{{ "Ethereum (ETH)" }}</td>
                        <td>{{ entry.date }}</td>
                        <td :class="ethClass">{{ changes.ethereumChangeOneDay }}%</td>
                        <td :class="ethClass">{{ changes.ethereumChange }}%</td>
                        <td><b>{{ entry.ethereum }} €</b> </td>
                    </tr>

                </tbody>
            </table>

            <button @click="toggleHistory">{{ showHistory ? 'Hide' : 'Load' }} History</button>

            <table class="crypto-table" v-if="showHistory">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Bitcoin (BTC)</th>
                        <th>Ethereum (ETH)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(entry, index) in filteredHistory" :key="index">
                        <td>{{ entry.date }}</td>
                        <td>{{ entry.bitcoin }} €</td>
                        <td>{{ entry.ethereum }} €</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else>Loading...</div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const priceHistory = ref([]);
const filteredHistory = ref([]);
const startDate = ref(null);
const endDate = ref(null);
const daysBack = ref(90);
const currentValue = ref([]);
const showHistory = ref(false);

const changes = ref({ bitcoinChange: null, ethereumChange: null, bitcoinChangeOneDay: null, ethereumChangeOneDay: null });
const hasIncreasedBtc = ref(null);
const hasIncreasedEth = ref(null);
const hasDecreasedBtc = ref(null);
const hasDecreasedEth = ref(null);

const btcClass = computed(() => (hasIncreasedBtc.value ? 'increase' : 'decrease'));
const ethClass = computed(() => (hasIncreasedEth.value ? 'increase' : 'decrease'));

const sortByDateDesc = (arr) => arr.sort((a, b) => new Date(b.date) - new Date(a.date));

const calculateWeeklyChange = () => {
    if (!priceHistory.value.length) return;

    const sorted = sortByDateDesc([...priceHistory.value]);
    const current = sorted[0];
    const currentDate = new Date(current.date);
    const currentBtc = parseFloat(current.bitcoin);
    const currentEth = parseFloat(current.ethereum);

    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const dayAgo = new Date(currentDate);
    dayAgo.setDate(currentDate.getDate() - 1)

    const past = sorted.find(e => new Date(e.date) <= sevenDaysAgo);
    const pastOneDay = sorted.find(e => new Date(e.date) <= dayAgo);
    if (!past) return;

    const btcChange = ((currentBtc - parseFloat(past.bitcoin)) / parseFloat(past.bitcoin)) * 100;
    const ethChange = ((currentEth - parseFloat(past.ethereum)) / parseFloat(past.ethereum)) * 100;

    const btcChangeOneDay = ((currentBtc - parseFloat(pastOneDay.bitcoin)) / parseFloat(pastOneDay.bitcoin)) * 100;
    const ethChangeOneDay = ((currentEth - parseFloat(pastOneDay.ethereum)) / parseFloat(pastOneDay.ethereum)) * 100;


    changes.value.bitcoinChange = btcChange.toFixed(2);
    changes.value.ethereumChange = ethChange.toFixed(2);
    changes.value.bitcoinChangeOneDay = btcChangeOneDay.toFixed(2);
    changes.value.ethereumChangeOneDay = ethChangeOneDay.toFixed(2);

    hasIncreasedBtc.value = btcChange >= 0;
    hasDecreasedBtc.value = btcChange < 0;
    hasIncreasedEth.value = ethChange >= 0;
    hasDecreasedEth.value = ethChange < 0;
};

const { data: btcData } = await useFetch(
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
    { params: { vs_currency: 'eur', days: daysBack } }
);

const { data: ethData } = await useFetch(
    'https://api.coingecko.com/api/v3/coins/ethereum/market_chart',
    { params: { vs_currency: 'eur', days: daysBack } }
);

if (btcData.value && ethData.value) {
    const btcPrices = btcData.value.prices;
    const ethPrices = ethData.value.prices;

    const dailyMap = new Map();

    btcPrices.forEach((btcEntry, i) => {
        const date = new Date(btcEntry[0]).toLocaleString().split('T')[0];

        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                date,
                bitcoin: btcEntry[1].toFixed(2),
                ethereum: ethPrices[i] ? ethPrices[i][1].toFixed(2) : 'N/A',
            });
        }
    });

    priceHistory.value = Array.from(dailyMap.values());

    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20);
    currentValue.value = filteredHistory.value.slice(0, 1);
    calculateWeeklyChange();
}


const toggleHistory = () => {
    showHistory.value = !showHistory.value;
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
};

const reset = () => {
    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20);
};
</script>
<!-- ('2025-06-14', { bitcoin: '65432.12', ethereum: '3321.88' }) -->


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
    max-width: 900px;
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
    background-color: #f0f0f0;
    font-weight: 600;
    color: #333;
}

.crypto-table tbody tr:hover {
    background-color: #f9f9f9;
}

.increase {
    color: green
}

.decrease {
    color: crimson
}
</style>