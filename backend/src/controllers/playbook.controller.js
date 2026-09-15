const playbookService = require('../services/playbook.service');
const { serialize } = require('../utils/serialize');
const { logger } = require('../utils/logger');

/**
 * Get all playbooks
 */
async function getPlaybooksController(req, res, next) {
  try {
    const { category, difficulty, limit, skip } = req.query;

    const playbooks = await playbookService.getPlaybooks({
      category,
      difficulty,
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0,
    });

    res.json({
      success: true,
      data: playbooks.map(p => serialize(p)),
    });
  } catch (error) {
    logger.error('Error in getPlaybooksController:', error);
    next(error);
  }
}

/**
 * Get specific playbook
 */
async function getPlaybookController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const playbook = await playbookService.getPlaybook(playbookId);

    res.json({
      success: true,
      data: {
        ...serialize(playbook),
        lessons: playbook.lessons.map(l => serialize(l)),
      },
    });
  } catch (error) {
    logger.error('Error in getPlaybookController:', error);
    next(error);
  }
}

/**
 * Enroll in playbook
 */
async function enrollPlaybookController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const userId = req.user.id;

    const userPlaybook = await playbookService.enrollUser(userId, playbookId);

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in playbook',
      data: serialize(userPlaybook),
    });
  } catch (error) {
    logger.error('Error in enrollPlaybookController:', error);
    next(error);
  }
}

/**
 * Get user's playbooks
 */
async function getUserPlaybooksController(req, res, next) {
  try {
    const userId = req.user.id;
    const status = req.query.status;

    const userPlaybooks = await playbookService.getUserPlaybooks(userId, status);

    res.json({
      success: true,
      data: userPlaybooks.map(up => ({
        ...serialize(up),
        playbook: serialize(up.playbook_id),
      })),
    });
  } catch (error) {
    logger.error('Error in getUserPlaybooksController:', error);
    next(error);
  }
}

/**
 * Get user's progress on specific playbook
 */
async function getUserPlaybookProgressController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const userId = req.user.id;

    const progress = await playbookService.getUserPlaybookProgress(userId, playbookId);

    res.json({
      success: true,
      data: {
        ...serialize(progress),
        playbook: serialize(progress.playbook),
        lessons: progress.lessons.map(l => serialize(l)),
      },
    });
  } catch (error) {
    logger.error('Error in getUserPlaybookProgressController:', error);
    next(error);
  }
}

/**
 * Complete a lesson
 */
async function completeLessonController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const day = parseInt(req.params.day);
    const userId = req.user.id;

    const updatedProgress = await playbookService.completeLesson(userId, playbookId, day);

    res.json({
      success: true,
      message: 'Lesson completed successfully',
      data: serialize(updatedProgress),
    });
  } catch (error) {
    logger.error('Error in completeLessonController:', error);
    next(error);
  }
}

/**
 * Get specific lesson
 */
async function getLessonController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const day = parseInt(req.params.day);

    const lesson = await playbookService.getLesson(playbookId, day);

    res.json({
      success: true,
      data: serialize(lesson),
    });
  } catch (error) {
    logger.error('Error in getLessonController:', error);
    next(error);
  }
}

/**
 * Abandon a playbook
 */
async function abandonPlaybookController(req, res, next) {
  try {
    const playbookId = req.params.id;
    const userId = req.user.id;

    const updated = await playbookService.abandonPlaybook(userId, playbookId);

    res.json({
      success: true,
      message: 'Playbook abandoned',
      data: serialize(updated),
    });
  } catch (error) {
    logger.error('Error in abandonPlaybookController:', error);
    next(error);
  }
}

module.exports = {
  getPlaybooksController,
  getPlaybookController,
  enrollPlaybookController,
  getUserPlaybooksController,
  getUserPlaybookProgressController,
  completeLessonController,
  abandonPlaybookController,
  getLessonController,
};
