const RANGES = [
  { label: '5Y',  value: 5 },
  { label: '10Y', value: 10 },
  { label: '20Y', value: 20 },
  { label: 'All', value: null },
];

export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {RANGES.map(r => (
        <button
          key={r.label}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            value === r.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
