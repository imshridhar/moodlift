require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../src/models');
const coachService = require('../src/services/coach.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moodlift_db');
  console.log('Connected to DB');
  
  const user = await User.findOne({});
  if (!user) return console.log('No users found.');
  
  console.log(`Using user: ${user.email} (${user._id})`);
  
  try {
    const conv = await coachService.createConversation(user._id, { title: 'Test from CLI' });
    console.log('Conversation created successfully:', conv.id || conv._id);
    
    // Check if fetching works
    const list = await coachService.getConversations(user._id);
    console.log(`User has ${list.length} conversations.`);
    
    // Check if message works
    const fallback = await coachService.sendCoachMessage(conv.id || conv._id, user._id, 'Hello?');
    console.log('Coach replied:', fallback.assistantResponse);
    process.exit(0);
  } catch (err) {
    console.error('Test crashed:', err);
    process.exit(1);
  }
}

run();
