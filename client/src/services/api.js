import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export async function getCountries() {
  const { data } = await api.get('/api/countries');
  return data;
}

export async function getIndicators(countryCode) {
  const { data } = await api.get(`/api/indicators/${countryCode}`);
  return data;
}

export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}
