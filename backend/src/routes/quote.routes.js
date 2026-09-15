/**
 * Quote Routes
 */
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { Quote, UserQuoteInteraction } = require('../models');
const { setCache, getCache } = require('../config/redis');
const { serialize } = require('../utils/serialize');

// GET /quotes/daily - Daily motivational quote
router.get('/daily', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `quote:daily:${new Date().toISOString().split('T')[0]}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const [quote] = await Quote.aggregate([
      { $match: { is_active: true } },
      { $sample: { size: 1 } },
    ]);

    const data = { quote: serialize(quote) };
    if (quote) {
      await setCache(cacheKey, data, 86400);
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /quotes - All quotes with filters
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, mood_tag, page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const filter = { is_active: true };
    if (category) {filter.category = category;}
    if (mood_tag) {filter.mood_tags = mood_tag;}

    const quotes = await Quote.find(filter)
      .sort({ like_count: -1, created_at: -1 })
      .skip(offset)
      .limit(limitNumber)
      .lean();

    res.json({ success: true, data: { quotes: serialize(quotes) } });
  } catch (err) {
    next(err);
  }
});

// POST /quotes/:id/like
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const existing = await UserQuoteInteraction.findOne({
      user_id: req.user.id,
      quote_id: req.params.id,
      interaction_type: 'like',
    }).lean();

    if (!existing) {
      await UserQuoteInteraction.create({
        user_id: req.user.id,
        quote_id: req.params.id,
        interaction_type: 'like',
      });

      await Quote.findByIdAndUpdate(req.params.id, { $inc: { like_count: 1 } });
    }

    res.json({ success: true, message: 'Quote liked' });
  } catch (err) {
    next(err);
  }
});

// POST /quotes/:id/save
router.post('/:id/save', authenticate, async (req, res, next) => {
  try {
    await UserQuoteInteraction.updateOne(
      {
        user_id: req.user.id,
        quote_id: req.params.id,
        interaction_type: 'save',
      },
      {
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Quote saved' });
  } catch (err) {
    next(err);
  }
});

// GET /quotes/saved
router.get('/saved/me', authenticate, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const savedQuotes = await UserQuoteInteraction.aggregate([
      {
        $match: {
          user_id: userId,
          interaction_type: 'save',
        },
      },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: 'quotes',
          localField: 'quote_id',
          foreignField: '_id',
          as: 'quote',
        },
      },
      { $unwind: '$quote' },
      {
        $project: {
          _id: '$quote._id',
          content: '$quote.content',
          author: '$quote.author',
          category: '$quote.category',
          mood_tags: '$quote.mood_tags',
          language: '$quote.language',
          is_active: '$quote.is_active',
          like_count: '$quote.like_count',
          created_at: '$quote.created_at',
          saved_at: '$created_at',
        },
      },
    ]);

    res.json({ success: true, data: { quotes: serialize(savedQuotes) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
