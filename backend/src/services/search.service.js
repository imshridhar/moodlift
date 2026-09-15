/**
 * Search Service
 * Search playbooks, interventions, and resources
 */

const { Intervention, Playbook } = require('../models');
const { serialize } = require('../utils/serialize');
const { setCache, getCache } = require('../config/redis');

const search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          results: { interventions: [], playbooks: [] },
          total: 0,
          query: q,
        },
      });
    }

    const cacheKey = `search:${q}:${type}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const searchRegex = new RegExp(q, 'i');

    const results = {};

    if (type === 'all' || type === 'interventions') {
      const interventions = await Intervention.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { type: searchRegex },
          { tags: searchRegex },
        ],
        is_active: true,
      })
        .limit(limitNumber)
        .lean();

      results.interventions = serialize(interventions);
    }

    if (type === 'all' || type === 'playbooks') {
      const playbooks = await Playbook.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ],
        is_active: true,
      })
        .limit(limitNumber)
        .lean();

      results.playbooks = serialize(playbooks);
    }

    const total = (results.interventions?.length || 0) + (results.playbooks?.length || 0);

    const data = {
      results,
      total,
      query: q,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
      },
    };

    await setCache(cacheKey, data, 900);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
};
