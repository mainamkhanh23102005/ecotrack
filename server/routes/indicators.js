import { Router } from 'express';
import IndicatorCache from '../models/IndicatorCache.js';
import { fetchIndicator, fetchInterestRate } from '../services/worldbank.js';

const router = Router();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const COUNTRY_CODE_RE = /^[A-Z]{2,3}$/;

async function safeIndicator(fn, label) {
  try {
    return { data: await fn(), label };
  } catch {
    return { data: [], label, error: 'No data' };
  }
}

router.get('/:countryCode', async (req, res, next) => {
  try {
    const { countryCode } = req.params;

    if (!COUNTRY_CODE_RE.test(countryCode)) {
      return res.status(400).json({ error: 'Invalid country code. Must be 2–3 uppercase letters.' });
    }

    const cached = await IndicatorCache.findOne({ countryCode, dataType: 'indicators' });
    if (cached && cached.expiresAt > new Date()) {
      return res.json(cached.data);
    }

    const [gdp, inflation, unemployment, interestRateResult, population] = await Promise.all([
      safeIndicator(() => fetchIndicator(countryCode, 'NY.GDP.MKTP.CD'), 'GDP'),
      safeIndicator(() => fetchIndicator(countryCode, 'FP.CPI.TOTL.ZG'), 'Inflation Rate'),
      safeIndicator(() => fetchIndicator(countryCode, 'SL.UEM.TOTL.ZS'), 'Unemployment Rate'),
      fetchInterestRate(countryCode).catch(() => ({ data: [], label: 'Real' })),
      safeIndicator(() => fetchIndicator(countryCode, 'SP.POP.TOTL'), 'Population'),
    ]);

    const result = {
      gdp,
      inflation,
      unemployment,
      interestRate: {
        data: interestRateResult.data,
        label: `Interest Rate (${interestRateResult.label})`,
      },
      population,
    };

    await IndicatorCache.findOneAndUpdate(
      { countryCode, dataType: 'indicators' },
      { data: result, cachedAt: new Date(), expiresAt: new Date(Date.now() + TTL_MS) },
      { upsert: true, new: true }
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
