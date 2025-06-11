<template>
    <div class="wrapper">
        <h1 class="greeting">Crypto trackr</h1>
        <NuxtLink class="link" to="/portfolio">💼 View Portfolio</NuxtLink>

        <input type="date" v-model="startDate">
        <input type="date" v-model="endDate">
        <button @click="fromTo">Search</button>
        <button @click="reset">Reset</button>

        <div v-if="filteredHistory">
            <table class="crypto-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Last week</th>
                        <th>Bitcoin (BTC)</th>
                        <th>Last week</th>
                        <th>Ethereum (ETH)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(entry, index) in currentValue" :key="index">
                        <td>{{ entry.date }}</td>
                        <td :class="{ increase: hasIncreasedBtc }">{{ changes.bitcoinChange }} %</td>
                        <td>{{ entry.bitcoin }} €</td>
                        <td :class="{ increase: hasIncreasedEth }">{{ changes.ethereumChange }} %</td>
                        <td>{{ entry.ethereum }} €</td>
                    </tr>
                </tbody>
            </table>
            <button @click="handleShowHistory">
                Load history
            </button>
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

        {{ currentDate }}
        {{ lastWeekDate }}
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Refs
const priceHistory = ref([])
const filteredHistory = ref([])
const startDate = ref(null)
const endDate = ref(null)
const daysBack = ref(7)
const currentValue = ref(null)
const showHistory = ref(false)
const changes = ref({ bitcoinChange: null, ethereumChange: 2 })
const hasIncreasedBtc = ref(null)
const hasIncreasedEth = ref(null)


// Dates
const currentDate = new Date()
const lastWeekDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)

// Sort helper
const sortByDateDesc = (arr) =>
    arr.sort((a, b) => new Date(b.date) - new Date(a.date))

// Percentage calculation function
const calculateWeeklyChange = () => {
    if (!priceHistory.value?.length) return null;

    const sorted = sortByDateDesc([...priceHistory.value]);

    // 1. Get current price (most recent entry)
    const currentEntry = sorted[0];
    const currentDate = new Date(currentEntry.date);
    const currentBtc = parseFloat(currentEntry.bitcoin);
    const currentEth = parseFloat(currentEntry.ethereum);

    // 2. Calculate date exactly 7 days ago
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    // 3. Find the closest historical entry to 7 days ago
    const pastEntry = sorted.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate <= sevenDaysAgo;
    });

    if (!pastEntry) return null; // No data from 7 days ago

    // 4. Calculate percentage changes
    const btcChange =
        ((currentBtc - parseFloat(pastEntry.bitcoin)) / parseFloat(pastEntry.bitcoin)) * 100;
    const ethChange =
        ((currentEth - parseFloat(pastEntry.ethereum)) / parseFloat(pastEntry.ethereum)) * 100;


    changes.value.bitcoinChange = btcChange.toFixed(2)
    changes.value.ethereumChange = ethChange.toFixed(2)
    changes.value.bitcoinChange >= 0 ? hasIncreasedBtc.value = true : hasIncreasedBtc.value = false
    changes.value.ethereumChange >= 0 ? hasIncreasedEth.value = true : hasIncreasedEth.value = false

};

// Fetch data (inside top-level async setup)
const { data: btcData } = await useFetch(
    'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
    {
        params: { vs_currency: 'eur', days: daysBack }
    }
)

const { data: ethData } = await useFetch(
    'https://api.coingecko.com/api/v3/coins/ethereum/market_chart',
    {
        params: { vs_currency: 'eur', days: daysBack }
    }
)

if (btcData.value && ethData.value) {
    const btcPrices = btcData.value.prices
    const ethPrices = ethData.value.prices

    priceHistory.value = btcPrices.map((btcEntry, index) => {
        const date = new Date(btcEntry[0]).toISOString().split('.')[0]
        return {
            date,
            bitcoin: btcEntry[1].toFixed(2),
            ethereum: ethPrices[index]
                ? ethPrices[index][1].toFixed(2)
                : 'N/A'
        }
    })

    // Set filtered list and current value
    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20)
    currentValue.value = filteredHistory.value.slice(0, 1)

    calculateWeeklyChange()
}

// Show/hide history
const handleShowHistory = () => {
    showHistory.value = !showHistory.value
}

// From-to date filter
const fromTo = () => {
    if (!startDate.value || !endDate.value) {
        filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20)
        return
    }

    const start = new Date(startDate.value)
    const end = new Date(endDate.value)

    filteredHistory.value = sortByDateDesc(
        priceHistory.value.filter((entry) => {
            const entryDate = new Date(entry.date)
            return entryDate >= start && entryDate <= end
        })
    ).slice(0, 20)
}

// Reset
const reset = () => {
    filteredHistory.value = sortByDateDesc([...priceHistory.value]).slice(0, 20)
    daysBack.value = 7
}
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