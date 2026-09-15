/**
 * MoodLift Database Seeder
 * Seeds core app data in MongoDB.
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const {
  Achievement,
  Challenge,
  ChallengeParticipant,
  Intervention,
  Playbook,
  PlaybookLesson,
  Quote,
  User,
  UserPlaybook,
} = require('../models');
const { logger } = require('../utils/logger');

const quotes = [
  { content: "You don't have to control your thoughts. You just have to stop letting them control you.", author: 'Dan Millman', category: 'mindfulness', mood_tags: ['anxious', 'overwhelmed'] },
  { content: 'The present moment is the only time over which we have dominion.', author: 'Thich Nhat Hanh', category: 'mindfulness', mood_tags: ['stressed', 'anxious'] },
  { content: 'Every day may not be good, but there is something good in every day.', author: 'Alice Morse Earle', category: 'positivity', mood_tags: ['sad', 'low'] },
  { content: 'What you think, you become. What you feel, you attract. What you imagine, you create.', author: 'Buddha', category: 'motivation', mood_tags: ['neutral', 'okay'] },
  { content: "It's okay not to be okay. It's not okay to stay that way.", author: 'Unknown', category: 'resilience', mood_tags: ['sad', 'awful'] },
  { content: 'Small steps every day add up to big changes.', author: 'Unknown', category: 'growth', mood_tags: ['motivated', 'neutral'] },
  { content: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush', category: 'self-compassion', mood_tags: ['self-doubt', 'low'] },
  { content: "Happiness is not the absence of problems, it's the ability to deal with them.", author: 'Steve Maraboli', category: 'resilience', mood_tags: ['struggling', 'poor'] },
  { content: 'Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.', author: 'Unknown', category: 'self-care', mood_tags: ['tired', 'overwhelmed'] },
  { content: 'The more you praise and celebrate your life, the more there is in life to celebrate.', author: 'Oprah Winfrey', category: 'gratitude', mood_tags: ['good', 'great'] },
  { content: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', category: 'resilience', mood_tags: ['struggling', 'challenged'] },
  { content: "Take care of your body. It's the only place you have to live.", author: 'Jim Rohn', category: 'self-care', mood_tags: ['tired', 'low'] },
  { content: 'You are stronger than you think.', author: 'Unknown', category: 'motivation', mood_tags: ['weak', 'overwhelmed'] },
  { content: 'Be gentle with yourself. You are a child of the universe, no less than the trees and the stars.', author: 'Max Ehrmann', category: 'self-compassion', mood_tags: ['self-critical', 'sad'] },
  { content: 'Joy is not in things; it is in us.', author: 'Richard Wagner', category: 'positivity', mood_tags: ['seeking', 'neutral'] },
  { content: 'The groundwork of all happiness is health.', author: 'Leigh Hunt', category: 'health', mood_tags: ['tired', 'unwell'] },
  { content: "Breathe. You're going to be okay. Breathe and remember that you've been in this place before.", author: 'Daniell Koepke', category: 'anxiety', mood_tags: ['anxious', 'panic'] },
  { content: "It always seems impossible until it's done.", author: 'Nelson Mandela', category: 'motivation', mood_tags: ['discouraged', 'giving up'] },
  { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain', category: 'motivation', mood_tags: ['stuck', 'procrastinating'] },
  { content: "You don't have to be perfect to be worthy of love and belonging.", author: 'Brene Brown', category: 'self-compassion', mood_tags: ['perfectionism', 'shame'] },
];

const achievements = [
  { name: 'First Step', description: 'Complete your first mood check-in', icon: 'seedling', category: 'check-in', requirement_type: 'mood_count', requirement_value: 1, points: 10, rarity: 'common' },
  { name: 'Week Warrior', description: 'Check in 7 days in a row', icon: 'streak', category: 'streak', requirement_type: 'streak', requirement_value: 7, points: 50, rarity: 'common' },
  { name: 'Two Week Champion', description: 'Maintain a 14-day streak', icon: 'bolt', category: 'streak', requirement_type: 'streak', requirement_value: 14, points: 100, rarity: 'rare' },
  { name: 'Monthly Master', description: 'Check in 30 days in a row', icon: 'trophy', category: 'streak', requirement_type: 'streak', requirement_value: 30, points: 300, rarity: 'epic' },
  { name: 'Century Club', description: 'Log 100 mood check-ins', icon: 'hundred', category: 'check-in', requirement_type: 'mood_count', requirement_value: 100, points: 200, rarity: 'rare' },
  { name: 'Wordsmith', description: 'Write your first journal entry', icon: 'pen', category: 'journal', requirement_type: 'journal_count', requirement_value: 1, points: 15, rarity: 'common' },
  { name: 'Journal Keeper', description: 'Write 10 journal entries', icon: 'journal', category: 'journal', requirement_type: 'journal_count', requirement_value: 10, points: 75, rarity: 'common' },
  { name: 'Storyteller', description: 'Write 50 journal entries', icon: 'books', category: 'journal', requirement_type: 'journal_count', requirement_value: 50, points: 250, rarity: 'epic' },
  { name: 'Mood Analyst', description: 'Check in for 30 total days', icon: 'chart', category: 'check-in', requirement_type: 'mood_count', requirement_value: 30, points: 100, rarity: 'rare' },
  { name: 'Legendary Streak', description: 'Maintain a 100-day streak', icon: 'crown', category: 'streak', requirement_type: 'streak', requirement_value: 100, points: 1000, rarity: 'legendary' },
];

const interventions = [
  {
    key: 'box-breathing',
    type: 'breathing',
    title: 'Box Breathing Reset',
    description: 'Use a simple four-count breathing pattern to calm your nervous system.',
    duration: 300,
    steps: ['Inhale for four counts', 'Hold for four counts', 'Exhale for four counts', 'Hold for four counts', 'Repeat for five rounds'],
    category: 'stress',
    difficulty: 'beginner',
    tags: ['breathwork', 'calm', 'grounding'],
  },
  {
    key: 'body-scan',
    type: 'meditation',
    title: 'Five-Minute Body Scan',
    description: 'Notice physical tension and release it one area at a time.',
    duration: 420,
    steps: ['Sit or lie down comfortably', 'Bring attention to your feet', 'Move slowly up the body', 'Release tension with each exhale'],
    category: 'sleep',
    difficulty: 'beginner',
    tags: ['sleep', 'relaxation', 'awareness'],
  },
  {
    key: 'gratitude-journal',
    type: 'journaling',
    title: 'Gratitude Reframe',
    description: 'Write about what is steady, supportive, and hopeful right now.',
    duration: 600,
    steps: ['List three moments that helped today', 'Name why each mattered', 'Write one small next step for tomorrow'],
    category: 'motivation',
    difficulty: 'beginner',
    tags: ['journaling', 'gratitude', 'reflection'],
  },
  {
    key: 'focus-reset',
    type: 'movement',
    title: 'Focus Reset Walk',
    description: 'Pair light movement with a short intention reset to regain momentum.',
    duration: 600,
    steps: ['Stand up and stretch', 'Walk for ten minutes without your phone', 'Choose one task to return to when you sit down'],
    category: 'focus',
    difficulty: 'beginner',
    tags: ['focus', 'movement', 'energy'],
  },
  {
    key: 'thought-reframe',
    type: 'visualization',
    title: 'Thought Reframe Drill',
    description: 'Practice turning a stress story into a grounded next action.',
    duration: 480,
    steps: ['Write the thought that feels loudest', 'Name the evidence for and against it', 'Rewrite it as a useful statement', 'Choose one action'],
    category: 'anxiety',
    difficulty: 'intermediate',
    tags: ['mindset', 'anxiety', 'clarity'],
  },
];

const playbooks = [
  {
    title: 'Focus Reset Sprint',
    description: 'A five-day program for recovering concentration, reducing context switching, and rebuilding steady momentum.',
    category: 'focus',
    duration_days: 5,
    difficulty: 'beginner',
    target_mood: [4, 5, 6, 7],
    rating: 4.8,
    review_count: 126,
    lessons: [
      { day: 1, title: 'Clear the Noise', description: 'Audit what keeps interrupting your attention.', estimated_duration: 12, instructions: 'List your top three distractions and remove one before your next work block.', interventionKey: 'focus-reset' },
      { day: 2, title: 'One-Task Warmup', description: 'Build a shorter and easier start ritual.', estimated_duration: 10, instructions: 'Choose one twenty-minute task and finish it before opening anything else.', interventionKey: 'focus-reset' },
      { day: 3, title: 'Protect Your Peak Hour', description: 'Match your best energy to your highest-value work.', estimated_duration: 15, instructions: 'Identify your strongest hour today and reserve it for a single meaningful task.' },
      { day: 4, title: 'Recovery Without Guilt', description: 'Use breaks to restore attention instead of drifting online.', estimated_duration: 8, instructions: 'Take a timed break, stand up, and reset with one deep breath before returning.' },
      { day: 5, title: 'Make Momentum Repeatable', description: 'Turn what worked into a simple repeatable system.', estimated_duration: 14, instructions: 'Write a two-step focus ritual you can repeat tomorrow and next week.', interventionKey: 'gratitude-journal' },
    ],
  },
  {
    title: 'Calm the Spiral',
    description: 'Seven grounded daily lessons to soften anxious loops and replace urgency with steadier thinking.',
    category: 'anxiety',
    duration_days: 7,
    difficulty: 'beginner',
    target_mood: [2, 3, 4, 5, 6],
    rating: 4.9,
    review_count: 214,
    lessons: [
      { day: 1, title: 'Catch the Trigger', description: 'Notice what sets the loop in motion.', estimated_duration: 10, instructions: 'Write down what happened right before your stress rose today.' },
      { day: 2, title: 'Breathe Before You Solve', description: 'Regulate your body before analyzing the problem.', estimated_duration: 6, instructions: 'Complete five rounds of box breathing before responding to anything stressful.', interventionKey: 'box-breathing' },
      { day: 3, title: 'Separate Facts from Forecasts', description: 'Practice spotting the difference between what happened and what you fear.', estimated_duration: 15, instructions: 'Draw two columns labeled facts and fears, then sort your thoughts.', interventionKey: 'thought-reframe' },
      { day: 4, title: 'Shrink the Next Step', description: 'Trade overwhelmed planning for a single doable move.', estimated_duration: 10, instructions: 'Choose the smallest next action that would still count as progress.' },
      { day: 5, title: 'Ask Better Questions', description: 'Replace catastrophic questions with grounded ones.', estimated_duration: 12, instructions: 'Rewrite one anxious thought as a compassionate and practical question.', interventionKey: 'thought-reframe' },
      { day: 6, title: 'Build a Calm List', description: 'Create a personal set of reliable reset habits.', estimated_duration: 10, instructions: 'List three tools that help your body settle and put them somewhere visible.' },
      { day: 7, title: 'Close the Loop', description: 'Reflect on what reduced the intensity fastest.', estimated_duration: 12, instructions: 'Journal about the moment this week when you felt most grounded again.', interventionKey: 'gratitude-journal' },
    ],
  },
  {
    title: 'Sleep Wind-Down',
    description: 'A five-night reset for people whose mind stays busy long after the day ends.',
    category: 'sleep',
    duration_days: 5,
    difficulty: 'intermediate',
    target_mood: [3, 4, 5, 6, 7],
    rating: 4.7,
    review_count: 93,
    lessons: [
      { day: 1, title: 'Set a Realistic Bedtime', description: 'Choose a bedtime you can actually keep.', estimated_duration: 8, instructions: 'Pick a bedtime that fits tonight and set a reminder thirty minutes before it.' },
      { day: 2, title: 'Dim the Input', description: 'Reduce bright and stimulating inputs before bed.', estimated_duration: 10, instructions: 'Turn off overhead lights and put your phone out of reach for the last hour.' },
      { day: 3, title: 'Release Body Tension', description: 'Signal safety and rest to your body.', estimated_duration: 7, instructions: 'Run through a five-minute body scan while breathing slowly.', interventionKey: 'body-scan' },
      { day: 4, title: 'Empty the Mental Tabs', description: 'Get looping thoughts onto paper.', estimated_duration: 12, instructions: 'Write down unfinished tasks and one sentence for how you will handle each tomorrow.', interventionKey: 'gratitude-journal' },
      { day: 5, title: 'Protect the Morning', description: 'Support better nights by anchoring your next morning.', estimated_duration: 9, instructions: 'Choose a consistent wake-up time and one light morning ritual to keep tomorrow.' },
    ],
  },
  {
    title: 'Momentum Builder',
    description: 'Six days of practical actions for restarting motivation when everything feels heavy or delayed.',
    category: 'motivation',
    duration_days: 6,
    difficulty: 'intermediate',
    target_mood: [4, 5, 6, 7, 8],
    rating: 4.6,
    review_count: 88,
    lessons: [
      { day: 1, title: 'Name the Real Goal', description: 'Clarify what progress means right now.', estimated_duration: 12, instructions: 'Write one goal for this week and one reason it matters to you.' },
      { day: 2, title: 'Stack a Tiny Win', description: 'Create movement with something almost too easy to fail.', estimated_duration: 8, instructions: 'Pick a task you can finish in under ten minutes and do it immediately.' },
      { day: 3, title: 'Use Energy, Not Willpower', description: 'Work with your rhythms instead of fighting them.', estimated_duration: 10, instructions: 'Schedule your hardest task for the time you usually feel most alert.' },
      { day: 4, title: 'Reconnect to Meaning', description: 'Remember the people or values behind the effort.', estimated_duration: 12, instructions: 'Write about who benefits if you keep going and what becomes easier later.', interventionKey: 'gratitude-journal' },
      { day: 5, title: 'Reset with Movement', description: 'Shift state before pushing harder.', estimated_duration: 10, instructions: 'Take a quick focus reset walk before your next task block.', interventionKey: 'focus-reset' },
      { day: 6, title: 'Make Tomorrow Easier', description: 'Leave a visible runway for your next session.', estimated_duration: 10, instructions: 'Set out the first file, note, or document you need before you log off today.' },
    ],
  },
  {
    title: 'Stress Reset Ritual',
    description: 'Four simple days for lowering stress load, loosening tension, and reclaiming a little breathing room.',
    category: 'stress',
    duration_days: 4,
    difficulty: 'beginner',
    target_mood: [2, 3, 4, 5, 6],
    rating: 4.8,
    review_count: 141,
    lessons: [
      { day: 1, title: 'Notice the Load', description: 'Identify where the pressure is coming from.', estimated_duration: 10, instructions: 'List what feels heavy today and mark what is urgent versus noisy.' },
      { day: 2, title: 'Reset the Body First', description: 'Reduce physical intensity before taking action.', estimated_duration: 6, instructions: 'Do one round of box breathing every time you switch tasks today.', interventionKey: 'box-breathing' },
      { day: 3, title: 'Protect One Calm Window', description: 'Create a short block with no demands attached.', estimated_duration: 15, instructions: 'Schedule one fifteen-minute window today with no screens and no obligations.' },
      { day: 4, title: 'Carry the Reset Forward', description: 'Choose the habits worth repeating.', estimated_duration: 12, instructions: 'Pick two stress reducers from this week and decide when you will use them next.' },
    ],
  },
];

const challenges = [
  {
    title: '7-Day Mood Check Streak',
    description: 'Check in every day this week to rebuild awareness before your mood drifts out of view.',
    category: 'mood_tracking',
    duration_days: 7,
    goal: 7,
    difficulty: 'easy',
    reward: 'Streak starter badge',
    is_recurring: true,
  },
  {
    title: 'Daily Reflection Relay',
    description: 'Write five short reflections in seven days and notice what themes keep repeating.',
    category: 'journaling',
    duration_days: 7,
    goal: 5,
    difficulty: 'medium',
    reward: 'Clarity builder badge',
    is_recurring: true,
  },
  {
    title: '10-Minute Calm Club',
    description: 'Log seven calm sessions in ten days with breathwork, meditation, or a body scan.',
    category: 'meditation',
    duration_days: 10,
    goal: 7,
    difficulty: 'easy',
    reward: 'Calm club ribbon',
    is_recurring: false,
  },
  {
    title: 'Energy Walk Week',
    description: 'Move your body on five different days and use each walk as an emotional reset.',
    category: 'fitness',
    duration_days: 7,
    goal: 5,
    difficulty: 'medium',
    reward: 'Movement momentum badge',
    is_recurring: true,
  },
  {
    title: 'Reach Out Challenge',
    description: 'Make four intentional social check-ins this week, from a text message to a real conversation.',
    category: 'social',
    duration_days: 7,
    goal: 4,
    difficulty: 'hard',
    reward: 'Connection catalyst badge',
    is_recurring: false,
  },
];

async function seedQuotes() {
  for (const quote of quotes) {
    await Quote.updateOne(
      { content: quote.content },
      { $setOnInsert: quote },
      { upsert: true }
    );
  }

  logger.info(`Seeded ${quotes.length} quotes`);
}

async function seedAchievements() {
  for (const achievement of achievements) {
    await Achievement.updateOne(
      { name: achievement.name },
      { $setOnInsert: achievement },
      { upsert: true }
    );
  }

  logger.info(`Seeded ${achievements.length} achievements`);
}

async function ensureSystemCreator() {
  await User.updateOne(
    { username: 'system_admin' },
    {
      $setOnInsert: {
        email: 'admin@moodlift.app',
        username: 'system_admin',
        password_hash: 'seeded-system-user',
        full_name: 'MoodLift System',
        is_verified: true,
      },
    },
    { upsert: true }
  );

  return User.findOne({ username: 'system_admin' });
}

async function seedInterventions() {
  const interventionMap = {};

  for (const intervention of interventions) {
    const { key, ...payload } = intervention;
    const record = await Intervention.findOneAndUpdate(
      { title: payload.title },
      { $set: { ...payload, is_active: true } },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    interventionMap[key] = record;
  }

  logger.info(`Seeded ${interventions.length} interventions`);
  return interventionMap;
}

async function seedPlaybooks(interventionMap) {
  for (const playbook of playbooks) {
    const { lessons, ...payload } = playbook;
    const playbookRecord = await Playbook.findOneAndUpdate(
      { title: payload.title },
      {
        $set: {
          ...payload,
          is_active: true,
          lesson_count: lessons.length,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    const seededDays = [];

    for (const lesson of lessons) {
      const intervention = lesson.interventionKey ? interventionMap[lesson.interventionKey] : null;

      seededDays.push(lesson.day);
      await PlaybookLesson.findOneAndUpdate(
        { playbook_id: playbookRecord._id, day: lesson.day },
        {
          $set: {
            playbook_id: playbookRecord._id,
            day: lesson.day,
            title: lesson.title,
            description: lesson.description,
            estimated_duration: lesson.estimated_duration,
            instructions: lesson.instructions,
            intervention_id: intervention ? intervention._id : null,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        }
      );
    }

    await PlaybookLesson.deleteMany({
      playbook_id: playbookRecord._id,
      day: { $nin: seededDays },
    });

    const enrollmentCount = await UserPlaybook.countDocuments({
      playbook_id: playbookRecord._id,
      status: 'active',
    });

    await Playbook.updateOne(
      { _id: playbookRecord._id },
      {
        $set: {
          lesson_count: lessons.length,
          enrollment_count: enrollmentCount,
        },
      }
    );
  }

  logger.info(`Seeded ${playbooks.length} playbooks with lessons`);
}

async function seedChallenges(systemCreator) {
  const startDate = new Date();

  for (const challenge of challenges) {
    const challengeRecord = await Challenge.findOneAndUpdate(
      { title: challenge.title },
      {
        $set: {
          ...challenge,
          creator_id: systemCreator._id,
          is_active: true,
          start_date: startDate,
          end_date: new Date(startDate.getTime() + challenge.duration_days * 24 * 60 * 60 * 1000),
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    const participantCount = await ChallengeParticipant.countDocuments({
      challenge_id: challengeRecord._id,
      status: 'active',
    });

    await Challenge.updateOne(
      { _id: challengeRecord._id },
      { $set: { participant_count: participantCount } }
    );
  }

  logger.info(`Seeded ${challenges.length} challenges`);
}

async function seed() {
  try {
    await connectDB();
    logger.info('Seeding MongoDB...');

    await seedQuotes();
    await seedAchievements();

    const systemCreator = await ensureSystemCreator();
    const interventionMap = await seedInterventions();

    await seedPlaybooks(interventionMap);
    await seedChallenges(systemCreator);

    logger.info('MongoDB seeded successfully');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
