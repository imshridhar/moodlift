require('dotenv').config();
const mongoose = require('mongoose');
const { Playbook, PlaybookLesson, Challenge, Intervention, User } = require('../src/models');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moodlift_db');
  console.log('Connected to MongoDB');
  
  // Clear existing master data
  await Playbook.deleteMany({});
  await PlaybookLesson.deleteMany({});
  await Challenge.deleteMany({});
  await Intervention.deleteMany({});
  
  console.log('Cleared existing data.');

  // Ensure we have an admin or system user to be a creator
  let sysAdmin = await User.findOne({ username: 'system_admin' });
  if (!sysAdmin) {
    sysAdmin = await User.create({
      email: 'admin@moodlift.app',
      username: 'system_admin',
      password_hash: 'placeholder',
      full_name: 'MoodLift System',
    });
  }

  // 1. Create Interventions
  const int1 = await Intervention.create({
    type: 'breathing',
    title: 'Box Breathing Basics',
    description: 'A 4-part breathing technique to reduce stress instantly.',
    duration: 300,
    steps: ['Inhale for 4s', 'Hold for 4s', 'Exhale for 4s', 'Hold for 4s', 'Repeat'],
    category: 'Anxiety',
    difficulty: 'beginner'
  });

  const int2 = await Intervention.create({
    type: 'journaling',
    title: 'Gratitude Reflection',
    description: 'Write about three things you are grateful for today.',
    duration: 600,
    steps: ['Find a quiet space', 'List 3 things you are grateful for', 'Write why they matter to you'],
    category: 'Positivity',
    difficulty: 'beginner'
  });

  // 2. Create Playbooks
  const p1 = await Playbook.create({
    title: 'Cognitive Reframing Basics',
    description: 'Learn how to identify and reshape negative thought patterns into objective observations over 3 days.',
    category: 'Mindset',
    duration_days: 3,
    difficulty: 'beginner',
    target_mood: [3, 4, 5, 6],
    lesson_count: 3
  });

  await PlaybookLesson.create([
    { playbook_id: p1._id, day: 1, title: 'Identifying Thought Traps', description: 'What are cognitive distortions?', intervention_id: int2._id, estimated_duration: 15, instructions: 'Read the prompt and identify your own traps.' },
    { playbook_id: p1._id, day: 2, title: 'The Power of Pause', description: 'Taking time before reacting.', intervention_id: int1._id, estimated_duration: 10, instructions: 'Use box breathing before analyzing thoughts.' },
    { playbook_id: p1._id, day: 3, title: 'Reframing in Action', description: 'Practical exercise in reframing.', estimated_duration: 20, instructions: 'Write out a negative thought and actively rewrite it.' }
  ]);

  const p2 = await Playbook.create({
    title: 'Deep Sleep Protocol',
    description: 'A 5-day journey to better sleep hygiene and nighttime relaxation.',
    category: 'Sleep',
    duration_days: 5,
    difficulty: 'intermediate',
    target_mood: [5, 6, 7],
    lesson_count: 5
  });

  await PlaybookLesson.create([
    { playbook_id: p2._id, day: 1, title: 'Screen Curfew', description: 'Setting a hard stop to blue light.', estimated_duration: 5, instructions: 'Turn off screens 1 hour before bed.' },
    { playbook_id: p2._id, day: 2, title: 'Wind-Down Breathing', description: 'Breathwork for sleep.', intervention_id: int1._id, estimated_duration: 10, instructions: 'Practice for 10 minutes.' },
    { playbook_id: p2._id, day: 3, title: 'Temperature Control', description: 'Optimal sleeping environment.', estimated_duration: 5, instructions: 'Lower room temperature by 2 degrees.' },
    { playbook_id: p2._id, day: 4, title: 'Journaling Before Bed', description: 'Empty your mind.', intervention_id: int2._id, estimated_duration: 15, instructions: 'Write out your worries and tasks for tomorrow.' },
    { playbook_id: p2._id, day: 5, title: 'Consistency is Key', description: 'Setting a firm 7-day schedule.', estimated_duration: 5, instructions: 'Commit to waking up at the exact same time every day.' }
  ]);

  // 3. Create Challenges
  await Challenge.create([
    {
      title: '7 Days of Active Gratitude',
      description: 'Log 7 gratitude journals this week to build a sustainable positive outlook.',
      category: 'Growth',
      duration_days: 7,
      goal: 7,
      creator_id: sysAdmin._id,
      difficulty: 'easy',
      is_recurring: true,
      reward: 'Gratitude Master Badge'
    },
    {
      title: 'Consistent Mover',
      description: 'Check in with a "Great" mood 5 times by keeping physically active.',
      category: 'Health',
      duration_days: 14,
      goal: 5,
      creator_id: sysAdmin._id,
      difficulty: 'medium',
      is_recurring: false,
      reward: 'Endorphin Junkie Badge'
    }
  ]);

  console.log('Seed data successfully injected!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
