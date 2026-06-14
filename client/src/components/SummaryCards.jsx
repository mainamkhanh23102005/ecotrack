import { formatValue } from '../utils/formatters';

const INDICATORS = [
  { key: 'gdp',          label: 'GDP',               unit: 'USD' },
  { key: 'inflation',    label: 'Inflation',          unit: '%' },
  { key: 'unemployment', label: 'Unemployment',       unit: '%' },
  { key: 'interestRate', label: 'Interest Rate',      unit: '%' },
  { key: 'population',   label: 'Population',         unit: '' },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-2 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function SummaryCards({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {INDICATORS.map(ind => <SkeletonCard key={ind.key} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {INDICATORS.map(ind => {
        const series = data[ind.key];
        const latest = series?.data?.at(-1);
        const label = ind.key === 'interestRate' ? series?.label : ind.label;

        return (
          <div key={ind.key} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {latest ? formatValue(latest.value, ind.key) : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{latest ? latest.year : 'No data'}</p>
          </div>
        );
      })}
    </div>
  );
}
