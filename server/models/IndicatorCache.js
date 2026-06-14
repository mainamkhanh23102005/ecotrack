import mongoose from 'mongoose';

const indicatorCacheSchema = new mongoose.Schema({
  countryCode: { type: String, required: true },
  dataType:    { type: String, required: true },
  data:        { type: mongoose.Schema.Types.Mixed, required: true },
  cachedAt:    { type: Date, default: Date.now },
  expiresAt:   { type: Date, required: true },
});

indicatorCacheSchema.index({ countryCode: 1, dataType: 1 }, { unique: true });
indicatorCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('IndicatorCache', indicatorCacheSchema);
