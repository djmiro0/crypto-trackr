import { useFetch } from "nuxt/app";

// ~/composables/useCryptoPrices.ts
export const useCryptoPrices = () => {
  return $fetch('https://api.coingecko.com/api/v3/simple/price', {
    params: {
      ids: 'bitcoin,ethereum',
      vs_currencies: 'eur'
    },
    headers: {
      'x-cg-demo-api-key': 'CG-AHfA2LvqPBB7f6StnmeU5XTp'
    }
  });
};
