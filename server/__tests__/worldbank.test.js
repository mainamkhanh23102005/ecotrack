import { jest } from '@jest/globals';

// Mock axios before importing the service
const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockGet },
}));

const { fetchCountries, fetchIndicator, fetchInterestRate } = await import('../services/worldbank.js');

const WB_BASE = 'https://api.worldbank.org/v2';

function makeCountryResponse(countries) {
  return [{ page: 1, pages: 1, total: countries.length }, countries];
}

function makeIndicatorResponse(entries) {
  return [{ page: 1, pages: 1 }, entries];
}

describe('fetchCountries', () => {
  it('calls the correct World Bank URL', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeCountryResponse([
        { name: 'Vietnam', id: 'VN', capitalCity: 'Hanoi', region: { id: 'EAP', value: 'East Asia' } },
      ]),
    });
    await fetchCountries();
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining(`${WB_BASE}/country`),
      expect.any(Object)
    );
  });

  it('filters out aggregate entries (region.id === "NA")', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeCountryResponse([
        { name: 'Vietnam', id: 'VN', capitalCity: 'Hanoi', region: { id: 'EAP', value: 'East Asia' } },
        { name: 'World', id: 'WLD', capitalCity: '', region: { id: 'NA', value: 'Aggregates' } },
      ]),
    });
    const result = await fetchCountries();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('VN');
  });

  it('returns objects with name, code, capitalCity, region', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeCountryResponse([
        { name: 'Vietnam', id: 'VN', capitalCity: 'Hanoi', region: { id: 'EAP', value: 'East Asia' } },
      ]),
    });
    const result = await fetchCountries();
    expect(result[0]).toEqual({ name: 'Vietnam', code: 'VN', capitalCity: 'Hanoi', region: 'East Asia' });
  });
});

describe('fetchIndicator', () => {
  it('builds URL with countryCode and indicatorCode', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 100 },
      ]),
    });
    await fetchIndicator('VN', 'NY.GDP.MKTP.CD');
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('VN/indicator/NY.GDP.MKTP.CD'),
      expect.any(Object)
    );
  });

  it('filters out null values', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 100 },
        { date: '2021', value: null },
        { date: '2020', value: 50 },
      ]),
    });
    const result = await fetchIndicator('VN', 'NY.GDP.MKTP.CD');
    expect(result).toHaveLength(2);
    expect(result.every(d => d.value !== null)).toBe(true);
  });

  it('returns data sorted ascending by year', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 300 },
        { date: '2020', value: 100 },
        { date: '2021', value: 200 },
      ]),
    });
    const result = await fetchIndicator('VN', 'NY.GDP.MKTP.CD');
    expect(result.map(d => d.year)).toEqual([2020, 2021, 2022]);
  });

  it('returns objects with year (number) and value', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([{ date: '2022', value: 42 }]),
    });
    const result = await fetchIndicator('VN', 'NY.GDP.MKTP.CD');
    expect(result[0]).toEqual({ year: 2022, value: 42 });
  });
});

describe('fetchInterestRate', () => {
  it('returns real rate data with label "Real" when sufficient data exists', async () => {
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 2.1 },
        { date: '2021', value: 1.8 },
        { date: '2020', value: 1.5 },
        { date: '2019', value: 2.0 },
        { date: '2018', value: 2.3 },
      ]),
    });
    const result = await fetchInterestRate('VN');
    expect(result.label).toBe('Real');
    expect(result.data).toHaveLength(5);
  });

  it('falls back to lending rate with label "Lending" when real rate has < 5 points', async () => {
    // First call (real rate) — sparse
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 1.5 },
        { date: '2021', value: null },
      ]),
    });
    // Second call (lending rate) — rich
    mockGet.mockResolvedValueOnce({
      data: makeIndicatorResponse([
        { date: '2022', value: 8.5 },
        { date: '2021', value: 8.0 },
        { date: '2020', value: 7.5 },
        { date: '2019', value: 7.0 },
        { date: '2018', value: 6.5 },
      ]),
    });
    const result = await fetchInterestRate('VN');
    expect(result.label).toBe('Lending');
    expect(result.data.length).toBeGreaterThanOrEqual(5);
  });
});
