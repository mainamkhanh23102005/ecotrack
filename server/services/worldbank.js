import axios from 'axios';

const BASE = 'https://api.worldbank.org/v2';
const PARAMS = { format: 'json', per_page: 300 };

export async function fetchCountries() {
  const { data } = await axios.get(`${BASE}/country`, { params: PARAMS });
  const [, countries] = data;
  return countries
    .filter(c => c.region?.id !== 'NA')
    .map(c => ({
      name: c.name,
      code: c.id,
      capitalCity: c.capitalCity,
      region: c.region?.value,
    }));
}

export async function fetchIndicator(countryCode, indicatorCode) {
  const { data } = await axios.get(
    `${BASE}/country/${countryCode}/indicator/${indicatorCode}`,
    { params: { format: 'json', per_page: 60, mrv: 60 } }
  );
  const [, entries] = data;
  if (!entries) return [];
  return entries
    .filter(e => e.value !== null)
    .map(e => ({ year: Number(e.date), value: e.value }))
    .sort((a, b) => a.year - b.year);
}

export async function fetchInterestRate(countryCode) {
  const realData = await fetchIndicator(countryCode, 'FR.INR.RINR');
  if (realData.length >= 5) {
    return { data: realData, label: 'Real' };
  }
  const lendingData = await fetchIndicator(countryCode, 'FR.INR.LNDP');
  return { data: lendingData, label: 'Lending' };
}
