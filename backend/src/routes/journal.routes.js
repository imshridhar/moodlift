/**
 * Journal Routes
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { JournalEntry } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { analyzeJournalEntry } = require('../services/ai.service');
const { serialize } = require('../utils/serialize');

router.use(authenticate);

// GET /journal
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, tag, search } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const filter = { user_id: userId };

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [entries, total] = await Promise.all([
      JournalEntry.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .lean(),
      JournalEntry.countDocuments(filter),
    ]);

    const serializedEntries = serialize(entries).map((entry) => ({
      id: entry.id,
      title: entry.title,
      excerpt: entry.content?.slice(0, 200) || '',
      tags: entry.tags || [],
      word_count: entry.word_count,
      sentiment_score: entry.sentiment_score,
      created_at: entry.created_at,
    }));

    res.json({
      success: true,
      data: {
        entries: serializedEntries,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /journal
router.post('/', [
  body('content').notEmpty().isLength({ min: 10, max: 10000 }),
  body('title').optional().isLength({ max: 200 }),
  body('tags').optional().isArray(),
  body('mood_entry_id').optional().isMongoId(),
], validate, async (req, res, next) => {
  try {
    const { title, content, tags = [], mood_entry_id, prompt_used } = req.body;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    const aiInsights = await analyzeJournalEntry({
      title,
      content,
      tags,
      prompt_used,
    });

    const entry = await JournalEntry.create({
      user_id: req.user.id,
      title,
      content,
      tags,
      mood_entry_id: mood_entry_id || null,
      word_count: wordCount,
      reading_time_minutes: readingTime,
      prompt_used: prompt_used || null,
      sentiment_score: typeof aiInsights?.sentiment_score === 'number'
        ? Math.max(-1, Math.min(1, aiInsights.sentiment_score))
        : undefined,
      ai_insights: aiInsights || undefined,
    });

    res.status(201).json({ success: true, data: { entry: serialize(entry) } });
  } catch (err) {
    next(err);
  }
});

// GET /journal/:id
router.get('/:id', [param('id').isMongoId()], validate, async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!entry) {
      throw new NotFoundError('Journal entry');
    }

    res.json({ success: true, data: { entry: serialize(entry) } });
  } catch (err) {
    next(err);
  }
});

// PUT /journal/:id
router.put('/:id', [param('id').isMongoId()], validate, async (req, res, next) => {
  try {
    const updates = {};
    const { title, content, tags } = req.body;

    if (title !== undefined) {updates.title = title;}
    if (content !== undefined) {
      updates.content = content;
      updates.word_count = content.trim().split(/\s+/).length;
      updates.reading_time_minutes = Math.ceil(updates.word_count / 200);
    }
    if (tags !== undefined) {updates.tags = tags;}

    const entry = await JournalEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.user.id,
      },
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).lean();

    if (!entry) {
      throw new NotFoundError('Journal entry');
    }

    res.json({ success: true, data: { entry: serialize(entry) } });
  } catch (err) {
    next(err);
  }
});

// DELETE /journal/:id
router.delete('/:id', [param('id').isMongoId()], validate, async (req, res, next) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    }).lean();

    if (!entry) {
      throw new NotFoundError('Journal entry');
    }

    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /journal/prompts - Daily writing prompts
router.get('/prompts/daily', async (req, res) => {
  const prompts = [
    'What three things are you grateful for today, and why do they matter to you?',
    'Describe a moment today when you felt truly present. What made it special?',
    'What emotion has been most present today? Where do you feel it in your body?',
    "What's one small thing you can do tomorrow to take care of yourself?",
    'Write about a challenge you faced recently. What did it teach you?',
    'Who made you feel good today? How did their presence impact you?',
    'What would you tell your past self from a year ago?',
    'Describe your ideal day. What elements can you bring into tomorrow?',
    'What are you holding onto that you need to let go of?',
    "What does 'enough' look like for you right now?",
  ];
  const today = new Date().getDay();
  res.json({ success: true, data: { prompt: prompts[today % prompts.length], all: prompts } });
});

module.exports = router;
