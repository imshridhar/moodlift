/**
 * Search Controller
 */

const searchService = require('../services/search.service');

module.exports = {
  search: searchService.search,
};
