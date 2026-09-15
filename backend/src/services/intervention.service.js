/**
 * Intervention Library Service
 * Stores and manages mental wellness exercises
 */

const { Intervention } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { serialize } = require('../utils/serialize');
const { setCache, getCache, deleteCachePattern } = require('../config/redis');

const getInterventions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category, difficulty } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const cacheKey = `interventions:${page}:${limit}:${type || ''}:${category || ''}:${difficulty || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const filter = { is_active: true };
    if (type) {filter.type = type;}
    if (category) {filter.category = category;}
    if (difficulty) {filter.difficulty = difficulty;}

    const [interventions, total] = await Promise.all([
      Intervention.find(filter)
        .sort({ usage_count: -1, rating: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      Intervention.countDocuments(filter),
    ]);

    const data = {
      interventions: serialize(interventions),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };

    await setCache(cacheKey, data, 1800);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getIntervention = async (req, res, next) => {
  try {
    const intervention = await Intervention.findById(req.params.id).lean();

    if (!intervention || !intervention.is_active) {
      throw new NotFoundError('Intervention');
    }

    res.json({ success: true, data: { intervention: serialize(intervention) } });
  } catch (error) {
    next(error);
  }
};

const incrementUsage = async (interventionId) => {
  try {
    await Intervention.findByIdAndUpdate(interventionId, { $inc: { usage_count: 1 } });
  } catch (error) {
    // Fail silently for usage tracking
  }
};

module.exports = {
  getInterventions,
  getIntervention,
  incrementUsage,
};
