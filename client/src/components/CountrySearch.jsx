import { useState, useEffect } from 'react';
import { getCountries } from '../services/api';

export default function CountrySearch({ value, onChange }) {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  const filtered = search
    ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : countries;

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search country..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {search && (
        <ul className="absolute z-10 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.map(c => (
            <li
              key={c.code}
              onClick={() => { onChange(c.code, c.name); setSearch(''); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === c.code ? 'bg-blue-100 font-medium' : ''}`}
            >
              {c.name}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400">No results</li>
          )}
        </ul>
      )}
    </div>
  );
}
