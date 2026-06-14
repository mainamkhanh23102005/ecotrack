import { jest } from '@jest/globals';

const mockFetchCountries = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();

jest.unstable_mockModule('../services/worldbank.js', () => ({
  fetchCountries: mockFetchCountries,
  fetchIndicator: jest.fn(),
  fetchInterestRate: jest.fn(),
}));

jest.unstable_mockModule('../models/IndicatorCache.js', () => ({
  default: {
    findOne: mockFindOne,
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

const request = (await import('supertest')).default;
const { default: app } = await import('../app.js');

const countries = [
  { name: 'Vietnam', code: 'VN', capitalCity: 'Hanoi', region: 'East Asia' },
];

describe('GET /api/countries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with cached data when cache is valid', async () => {
    mockFindOne.mockResolvedValueOnce({
      data: countries,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    const res = await request(app).get('/api/countries');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(countries);
    expect(mockFetchCountries).not.toHaveBeenCalled();
  });

  it('fetches from World Bank and caches when no cache exists', async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockFetchCountries.mockResolvedValueOnce(countries);
    mockFindOneAndUpdate.mockResolvedValueOnce({});

    const res = await request(app).get('/api/countries');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(countries);
    expect(mockFetchCountries).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when cache is expired', async () => {
    mockFindOne.mockResolvedValueOnce({
      data: countries,
      expiresAt: new Date(Date.now() - 1000),
    });
    mockFetchCountries.mockResolvedValueOnce(countries);
    mockFindOneAndUpdate.mockResolvedValueOnce({});

    const res = await request(app).get('/api/countries');

    expect(res.status).toBe(200);
    expect(mockFetchCountries).toHaveBeenCalledTimes(1);
  });
});
