/**
 * Contextual Trigger Controller
 */

const triggerService = require('../services/trigger.service');

module.exports = {
  getContextEvents: triggerService.getContextEvents,
};
