/**
 * Intervention Library Controller
 */

const interventionService = require('../services/intervention.service');

module.exports = {
  getInterventions: interventionService.getInterventions,
  getIntervention: interventionService.getIntervention,
};
