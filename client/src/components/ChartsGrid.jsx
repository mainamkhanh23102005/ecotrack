import IndicatorChart from './IndicatorChart';

const CHART_COLORS = {
  gdp:          '#3b82f6',
  inflation:    '#ef4444',
  unemployment: '#f59e0b',
  interestRate: '#8b5cf6',
  population:   '#10b981',
};

export default function ChartsGrid({ data, loading }) {
  const indicators = [
    { key: 'gdp' },
    { key: 'inflation' },
    { key: 'unemployment' },
    { key: 'interestRate' },
    { key: 'population' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {indicators.map(({ key }) => (
        <IndicatorChart
          key={key}
          indicatorKey={key}
          label={data?.[key]?.label || key}
          data={data?.[key]?.data}
          loading={loading || !data}
          color={CHART_COLORS[key]}
        />
      ))}
    </div>
  );
}
