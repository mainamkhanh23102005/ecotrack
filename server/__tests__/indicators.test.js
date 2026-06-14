import { jest } from '@jest/globals';

const mockFetchIndicator = jest.fn();
const mockFetchInterestRate = jest.fn();
const mockFetchCountries = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();

jest.unstable_mockModule('../services/worldbank.js', () => ({
  fetchCountries: mockFetchCountries,
  fetchIndicator: mockFetchIndicator,
  fetchInterestRate: mockFetchInterestRate,
}));

jest.unstable_mockModule('../models/IndicatorCache.js', () => ({
  default: {
    findOne: mockFindOne,
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

const request = (await import('supertest')).default;
const { default: app } = await import('../app.js');

const sampleData = [
  { year: 2020, value: 100 },
  { year: 2021, value: 110 },
];

const fullResponse = {
  gdp:          { data: sampleData, label: 'GDP' },
  inflation:    { data: sampleData, label: 'Inflation Rate' },
  unemployment: { data: sampleData, label: 'Unemployment Rate' },
  interestRate: { data: sampleData, label: 'Interest Rate (Real)' },
  population:   { data: sampleData, label: 'Population' },
};

describe('GET /api/indicators/:countryCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid country code', async () => {
    const res = await request(app).get('/api/indicators/TOOLONG');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for lowercase country code', async () => {
    const res = await request(app).get('/api/indicators/vn');
    expect(res.status).toBe(400);
  });

  it('returns 200 with cached data when cache is valid', async () => {
    mockFindOne.mockResolvedValueOnce({
      data: fullResponse,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    const res = await request(app).get('/api/indicators/VN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fullResponse);
    expect(mockFetchIndicator).not.toHaveBeenCalled();
  });

  it('fetches all 5 indicators and caches on cache miss', async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockFetchIndicator
      .mockResolvedValueOnce(sampleData) // GDP
      .mockResolvedValueOnce(sampleData) // Inflation
      .mockResolvedValueOnce(sampleData) // Unemployment
      .mockResolvedValueOnce(sampleData); // Population
    mockFetchInterestRate.mockResolvedValueOnce({ data: sampleData, label: 'Real' });
    mockFindOneAndUpdate.mockResolvedValueOnce({});

    const res = await request(app).get('/api/indicators/VN');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('gdp');
    expect(res.body).toHaveProperty('inflation');
    expect(res.body).toHaveProperty('unemployment');
    expect(res.body).toHaveProperty('interestRate');
    expect(res.body).toHaveProperty('population');
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns empty data for a failing indicator without crashing', async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockFetchIndicator
      .mockRejectedValueOnce(new Error('API error')) // GDP fails
      .mockResolvedValueOnce(sampleData)
      .mockResolvedValueOnce(sampleData)
      .mockResolvedValueOnce(sampleData);
    mockFetchInterestRate.mockResolvedValueOnce({ data: sampleData, label: 'Real' });
    mockFindOneAndUpdate.mockResolvedValueOnce({});

    const res = await request(app).get('/api/indicators/VN');

    expect(res.status).toBe(200);
    expect(res.body.gdp.data).toEqual([]);
    expect(res.body.gdp.error).toBe('No data');
  });

  it('returns 3-letter country codes', async () => {
    mockFindOne.mockResolvedValueOnce({
      data: fullResponse,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    const res = await request(app).get('/api/indicators/USA');
    expect(res.status).toBe(200);
  });
});
