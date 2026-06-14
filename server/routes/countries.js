import { Router } from 'express';
import IndicatorCache from '../models/IndicatorCache.js';
import { fetchCountries } from '../services/worldbank.js';

const router = Router();
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

router.get('/', async (req, res, next) => {
  try {
    const cached = await IndicatorCache.findOne({ countryCode: '_all', dataType: 'countries' });
    if (cached && cached.expiresAt > new Date()) {
      return res.json(cached.data);
    }

    const countries = await fetchCountries();
    await IndicatorCache.findOneAndUpdate(
      { countryCode: '_all', dataType: 'countries' },
      { data: countries, cachedAt: new Date(), expiresAt: new Date(Date.now() + TTL_MS) },
      { upsert: true, new: true }
    );
    res.json(countries);
  } catch (err) {
    next(err);
  }
});

export default router;
