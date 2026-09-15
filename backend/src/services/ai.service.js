/**
 * Gemini AI Service
 * Uses the Gemini API directly via REST with a GEMINI_API_KEY.
 */

const { logger } = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const hasGeminiConfig = () => Boolean(
  GEMINI_API_KEY &&
  !GEMINI_API_KEY.startsWith('your_') &&
  GEMINI_API_KEY !== 'changeme'
);

const extractText = (responseBody) => {
  const parts = responseBody?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
};

const generateStructuredContent = async ({ prompt, schema, temperature = 0.3, maxOutputTokens = 512 }) => {
  if (!hasGeminiConfig()) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
        },
      }),
      signal: controller.signal,
    });

    const body = await response.json();

    if (!response.ok) {
      logger.warn('Gemini request failed', {
        status: response.status,
        error: body?.error?.message,
      });
      return null;
    }

    const text = extractText(body);
    if (!text) {
      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    logger.warn('Gemini request error', { error: error.message });
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const analyzeMoodEntry = async (entry) => generateStructuredContent({
  prompt: [
    'You are a supportive wellness assistant for a mood tracking app.',
    'Analyze the following mood check-in and return a brief, non-clinical summary.',
    'Never diagnose or mention medical conditions.',
    '',
    `Mood score: ${entry.mood_score}/10`,
    `Mood label: ${entry.mood_label || 'unknown'}`,
    `Energy level: ${entry.energy_level ?? 'unknown'}/5`,
    `Anxiety level: ${entry.anxiety_level ?? 'unknown'}/5`,
    `Sleep hours: ${entry.sleep_hours ?? 'unknown'}`,
    `Activities: ${(entry.activities || []).join(', ') || 'none'}`,
    `Triggers: ${(entry.triggers || []).join(', ') || 'none'}`,
    `Notes: ${entry.notes || 'none'}`,
    '',
    'Respond with calm, practical language.',
  ].join('\n'),
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      encouragement: { type: 'string' },
      risk_level: {
        type: 'string',
        enum: ['low', 'moderate', 'high'],
      },
      recommended_focus: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['summary', 'encouragement', 'risk_level', 'recommended_focus'],
  },
  temperature: 0.4,
  maxOutputTokens: 300,
});

const analyzeJournalEntry = async (entry) => generateStructuredContent({
  prompt: [
    'You are a reflective journaling assistant for a wellness app.',
    'Read the journal entry and return concise, supportive insights.',
    'Never diagnose or mention medical conditions.',
    'Sentiment score must be a number from -1.0 to 1.0, where negative is more distressed and positive is more hopeful.',
    '',
    `Title: ${entry.title || 'Untitled'}`,
    `Tags: ${(entry.tags || []).join(', ') || 'none'}`,
    `Prompt used: ${entry.prompt_used || 'none'}`,
    `Content: ${entry.content}`,
  ].join('\n'),
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      sentiment_score: { type: 'number' },
      themes: {
        type: 'array',
        items: { type: 'string' },
      },
      gentle_reframe: { type: 'string' },
    },
    required: ['summary', 'sentiment_score', 'themes', 'gentle_reframe'],
  },
  temperature: 0.4,
  maxOutputTokens: 400,
});

const callGeminiAPI = async (prompt, temperature = 0.7, maxOutputTokens = 500) => {
  if (!hasGeminiConfig()) {
    return 'I\'m here to support you. Please share more about how you\'re feeling.';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }),
      signal: controller.signal,
    });

    const body = await response.json();

    if (!response.ok) {
      logger.warn('Gemini request failed', {
        status: response.status,
        error: body?.error?.message,
      });
      if (response.status === 403 || response.status === 401) {
        return 'I am currently offline because my AI connection key was disabled or expired. Please update the API key in the backend environment variables to restore our conversation!';
      }
      return 'I\'m here to support you. Please share more about how you\'re feeling.';
    }

    const text = extractText(body);
    return text || 'I\'m here to support you. Please share more about how you\'re feeling.';
  } catch (error) {
    logger.warn('Gemini request error', { error: error.message });
    return 'I\'m here to support you. Please share more about how you\'re feeling.';
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  hasGeminiConfig,
  callGeminiAPI,
  analyzeMoodEntry,
  analyzeJournalEntry,
};
