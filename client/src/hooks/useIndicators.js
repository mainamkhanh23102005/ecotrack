import { useState, useEffect } from 'react';
import { getIndicators } from '../services/api';

const currentYear = new Date().getFullYear();

function filterByYears(data, years) {
  if (!years || !data?.length) return data;
  const cutoff = currentYear - years;
  return data.filter(d => d.year >= cutoff);
}

export default function useIndicators(countryCode, years) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryCode) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getIndicators(countryCode);
        if (!cancelled) setRawData(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [countryCode]);

  if (!rawData) return { loading, error, data: null };

  return {
    loading,
    error,
    data: {
      gdp:          { ...rawData.gdp,          data: filterByYears(rawData.gdp?.data, years) },
      inflation:    { ...rawData.inflation,    data: filterByYears(rawData.inflation?.data, years) },
      unemployment: { ...rawData.unemployment, data: filterByYears(rawData.unemployment?.data, years) },
      interestRate: { ...rawData.interestRate, data: filterByYears(rawData.interestRate?.data, years) },
      population:   { ...rawData.population,   data: filterByYears(rawData.population?.data, years) },
    },
  };
}
