const { Playbook, PlaybookLesson, UserPlaybook } = require('../models');
const { logger } = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all available playbooks
 * @param {object} filters - { category, difficulty, limit, skip }
 * @returns {array} - Playbooks
 */
async function getPlaybooks(filters = {}) {
  try {
    const { category, difficulty, limit = 20, skip = 0 } = filters;

    const query = { is_active: true };
    if (category) {query.category = category;}
    if (difficulty) {query.difficulty = difficulty;}

    const playbooks = await Playbook.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return playbooks;
  } catch (error) {
    logger.error('Error getting playbooks:', error);
    throw error;
  }
}

/**
 * Get specific playbook with all lessons
 * @param {string} playbookId - Playbook ID
 * @returns {object} - Playbook with lessons
 */
async function getPlaybook(playbookId) {
  try {
    const playbook = await Playbook.findById(playbookId).lean();

    if (!playbook) {
      throw new NotFoundError('Playbook not found');
    }

    const lessons = await PlaybookLesson.find({ playbook_id: playbookId })
      .sort({ day: 1 })
      .lean()
      .exec();

    return { ...playbook, lessons };
  } catch (error) {
    logger.error('Error getting playbook:', error);
    throw error;
  }
}

/**
 * Enroll user in a playbook
 * @param {string} userId - User ID
 * @param {string} playbookId - Playbook ID
 * @returns {object} - User playbook enrollment
 */
async function enrollUser(userId, playbookId) {
  try {
    // Check if playbook exists
    const playbook = await Playbook.findById(playbookId);
    if (!playbook) {
      throw new NotFoundError('Playbook not found');
    }

    // Check if already enrolled
    const existing = await UserPlaybook.findOne({
      user_id: userId,
      playbook_id: playbookId,
      status: 'active',
    });

    if (existing) {
      return existing.toObject();
    }

    // Create enrollment
    const enrollments_count_before = await UserPlaybook.countDocuments({
      playbook_id: playbookId,
      status: 'active',
    });

    const userPlaybook = await UserPlaybook.create({
      user_id: userId,
      playbook_id: playbookId,
      start_date: new Date(),
      current_day: 1,
      progress: 0,
      lessons_completed: [],
      status: 'active',
    });

    // Update playbook enrollment count
    await Playbook.findByIdAndUpdate(
      playbookId,
      { enrollment_count: enrollments_count_before + 1 }
    );

    logger.info(`User ${userId} enrolled in playbook ${playbookId}`);
    return userPlaybook.toObject();
  } catch (error) {
    logger.error('Error enrolling user:', error);
    throw error;
  }
}

/**
 * Get user's playbooks
 * @param {string} userId - User ID
 * @param {string} status - Filter by status (active, completed, abandoned)
 * @returns {array} - User playbooks
 */
async function getUserPlaybooks(userId, status = null) {
  try {
    const query = { user_id: userId };
    if (status) {query.status = status;}

    const userPlaybooks = await UserPlaybook.find(query)
      .populate('playbook_id')
      .sort({ updated_at: -1 })
      .lean()
      .exec();

    return userPlaybooks;
  } catch (error) {
    logger.error('Error getting user playbooks:', error);
    throw error;
  }
}

/**
 * Get specific user's progress on a playbook
 * @param {string} userId - User ID
 * @param {string} playbookId - Playbook ID
 * @returns {object} - User playbook with lessons
 */
async function getUserPlaybookProgress(userId, playbookId) {
  try {
    const userPlaybook = await UserPlaybook.findOne({
      user_id: userId,
      playbook_id: playbookId,
    });

    if (!userPlaybook) {
      throw new NotFoundError('User not enrolled in this playbook');
    }

    const playbook = await Playbook.findById(playbookId).lean();
    const lessons = await PlaybookLesson.find({ playbook_id: playbookId })
      .sort({ day: 1 })
      .lean()
      .exec();

    return {
      ...userPlaybook.toObject(),
      playbook,
      lessons,
    };
  } catch (error) {
    logger.error('Error getting user playbook progress:', error);
    throw error;
  }
}

/**
 * Complete a lesson for user
 * @param {string} userId - User ID
 * @param {string} playbookId - Playbook ID
 * @param {number} day - Day number
 * @returns {object} - Updated user playbook
 */
async function completeLesson(userId, playbookId, day) {
  try {
    const userPlaybook = await UserPlaybook.findOne({
      user_id: userId,
      playbook_id: playbookId,
      status: 'active',
    });

    if (!userPlaybook) {
      throw new NotFoundError('User not enrolled in this playbook');
    }

    // Get playbook to know duration
    const playbook = await Playbook.findById(playbookId);
    if (!playbook) {
      throw new NotFoundError('Playbook not found');
    }

    // Add day to completed lessons if not already there
    if (!userPlaybook.lessons_completed.includes(day)) {
      userPlaybook.lessons_completed.push(day);
    }

    // Update current day
    userPlaybook.current_day = Math.max(userPlaybook.current_day, day + 1);

    // Calculate progress
    const totalDays = playbook.duration_days;
    const completedCount = userPlaybook.lessons_completed.length;
    userPlaybook.progress = Math.min(Math.round((completedCount / totalDays) * 100), 100);

    // Check if playbook is complete
    if (userPlaybook.progress === 100) {
      userPlaybook.status = 'completed';
      userPlaybook.completed_at = new Date();
    }

    await userPlaybook.save();

    logger.info(`User ${userId} completed lesson ${day} of playbook ${playbookId}`);
    return userPlaybook.toObject();
  } catch (error) {
    logger.error('Error completing lesson:', error);
    throw error;
  }
}

/**
 * Abandon a playbook
 * @param {string} userId - User ID
 * @param {string} playbookId - Playbook ID
 * @returns {object} - Updated user playbook
 */
async function abandonPlaybook(userId, playbookId) {
  try {
    const userPlaybook = await UserPlaybook.findOneAndUpdate(
      {
        user_id: userId,
        playbook_id: playbookId,
        status: 'active',
      },
      {
        status: 'abandoned',
        updated_at: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!userPlaybook) {
      throw new NotFoundError('User playbook not found or already completed');
    }

    logger.info(`User ${userId} abandoned playbook ${playbookId}`);
    return userPlaybook.toObject();
  } catch (error) {
    logger.error('Error abandoning playbook:', error);
    throw error;
  }
}

/**
 * Get playbook lesson details
 * @param {string} playbookId - Playbook ID
 * @param {number} day - Day number
 * @returns {object} - Lesson details
 */
async function getLesson(playbookId, day) {
  try {
    const lesson = await PlaybookLesson.findOne({
      playbook_id: playbookId,
      day,
    }).lean();

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    return lesson;
  } catch (error) {
    logger.error('Error getting lesson:', error);
    throw error;
  }
}

module.exports = {
  getPlaybooks,
  getPlaybook,
  enrollUser,
  getUserPlaybooks,
  getUserPlaybookProgress,
  completeLesson,
  abandonPlaybook,
  getLesson,
};
