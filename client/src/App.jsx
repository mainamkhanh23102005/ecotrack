import { useState } from 'react';
import CountrySearch from './components/CountrySearch';
import TimeRangeSelector from './components/TimeRangeSelector';
import SummaryCards from './components/SummaryCards';
import ChartsGrid from './components/ChartsGrid';
import WakeUpBanner from './components/WakeUpBanner';
import useIndicators from './hooks/useIndicators';
import './index.css';

export default function App() {
  const [countryCode, setCountryCode] = useState('VN');
  const [countryName, setCountryName] = useState('Vietnam');
  const [years, setYears] = useState(10);

  const { data, loading, error } = useIndicators(countryCode, years);

  function handleCountryChange(code, name) {
    setCountryCode(code);
    if (name) setCountryName(name);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">EcoTrack</span>
            <span className="text-gray-400 text-sm hidden sm:inline">Economic Indicators</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CountrySearch
              value={countryCode}
              onChange={(code, name) => handleCountryChange(code, name)}
            />
            <TimeRangeSelector value={years} onChange={setYears} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{countryName}</h1>
          <p className="text-sm text-gray-500">
            {years ? `Last ${years} years` : 'All available data'} · World Bank Open Data
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <SummaryCards data={data} loading={loading} />
        <ChartsGrid data={data} loading={loading} />
      </main>

      <WakeUpBanner />
    </div>
  );
}
