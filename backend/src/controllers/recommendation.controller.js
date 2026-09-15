/**
 * Recommendation Controller
 */

const recommendationService = require('../services/recommendation.service');

module.exports = {
  getRecommendations: recommendationService.getRecommendations,
  completeRecommendation: recommendationService.completeRecommendation,
  dismissRecommendation: recommendationService.dismissRecommendation,
};
