// Crisis Detection Keywords Database

const suicidalKeywords = [
  'suicide',
  'suicidal',
  'kill myself',
  'kill me',
  'end it all',
  'end my life',
  'don\'t want to live',
  'don\'t want to be here',
  'better off dead',
  'everyone would be better off',
  'no reason to live',
  'life is meaningless',
  'want to die',
  'should be dead',
  'goodbye',
  'farewell',
  'last message',
  'final goodbye',
  'hang myself',
  'overdose',
  'jump',
  'slit wrist',
  'cut wrist',
];

const selfHarmKeywords = [
  'self harm',
  'self-harm',
  'cutting',
  'cut myself',
  'hurt myself',
  'harm myself',
  'bang head',
  'punch wall',
  'break something',
  'hit myself',
  'slap myself',
  'burn myself',
  'scratch myself',
];

const extremeDistressKeywords = [
  'hopeless',
  'helpless',
  'worthless',
  'useless',
  'burden',
  'unwanted',
  'unwelcome',
  'can\'t take it anymore',
  'can\'t do this',
  'can\'t handle it',
  'falling apart',
  'falling into darkness',
  'lost all hope',
  'complete despair',
  'absolutely devastated',
  'utterly broken',
  'everything is pointless',
];

/**
 * Detect risk signals in text
 * @param {string} text - The text to analyze
 * @returns {object} - { severity, flags, indicators }
 */
function detectRiskSignals(text) {
  if (!text || typeof text !== 'string') {
    return { severity: 'low', flags: [], indicators: [] };
  }

  const lowerText = text.toLowerCase();
  const indicators = [];
  let riskScore = 0;

  // Check suicidal keywords
  for (const keyword of suicidalKeywords) {
    if (lowerText.includes(keyword)) {
      indicators.push(`suicidal_keyword: ${keyword}`);
      riskScore += 3;
    }
  }

  // Check self-harm keywords
  for (const keyword of selfHarmKeywords) {
    if (lowerText.includes(keyword)) {
      indicators.push(`self_harm_keyword: ${keyword}`);
      riskScore += 2;
    }
  }

  // Check extreme distress keywords
  for (const keyword of extremeDistressKeywords) {
    if (lowerText.includes(keyword)) {
      indicators.push(`distress_keyword: ${keyword}`);
      riskScore += 1;
    }
  }

  // Check for multiple negative words combined
  const negativeWordCount = (
    (lowerText.match(/no|not|never|nothing|can't|cannot|don't|doesn't|won't|wouldn't/g) || []).length
  );

  if (negativeWordCount >= 5 && indicators.length > 0) {
    indicators.push('multiple_negative_words');
    riskScore += 1;
  }

  // Determine severity
  let severity = 'low';
  let flagType = null;

  if (indicators.some(ind => ind.includes('suicidal_keyword'))) {
    severity = 'high';
    flagType = 'suicidal_ideation';
  } else if (indicators.some(ind => ind.includes('self_harm_keyword'))) {
    severity = 'medium';
    flagType = 'self_harm';
  } else if (indicators.some(ind => ind.includes('distress_keyword')) && indicators.length >= 2) {
    severity = 'medium';
    flagType = 'extreme_distress';
  } else if (indicators.some(ind => ind.includes('distress_keyword'))) {
    severity = 'low';
    flagType = 'extreme_distress';
  }

  const confidence = Math.min(riskScore / 10, 1);

  return {
    severity,
    flagType,
    flags: indicators,
    indicators,
    confidence,
    riskScore,
  };
}

module.exports = {
  suicidalKeywords,
  selfHarmKeywords,
  extremeDistressKeywords,
  detectRiskSignals,
};
