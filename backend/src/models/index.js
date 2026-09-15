const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationPreferencesDefault = () => ({
  email: true,
  push: true,
  daily_reminder: true,
  reminder_time: '09:00',
});

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, trim: true },
  avatar_url: { type: String, trim: true },
  bio: { type: String },
  timezone: { type: String, default: 'UTC' },
  date_of_birth: { type: Date },
  gender: { type: String },
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  is_premium: { type: Boolean, default: false },
  streak_count: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  last_check_in: { type: Date },
  notification_preferences: { type: Schema.Types.Mixed, default: notificationPreferencesDefault },
  theme_preference: { type: String, default: 'system' },
  language: { type: String, default: 'en' },
  onboarding_completed: { type: Boolean, default: false },
  refresh_token_hash: { type: String },
  password_reset_token: { type: String },
  password_reset_expires: { type: Date },
  email_verification_token: { type: String },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const moodEntrySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mood_score: { type: Number, required: true, min: 1, max: 10 },
  mood_label: { type: String, required: true, trim: true, maxlength: 50 },
  mood_emoji: { type: String, trim: true, maxlength: 10 },
  energy_level: { type: Number, min: 1, max: 5 },
  anxiety_level: { type: Number, min: 1, max: 5 },
  sleep_hours: { type: Number, min: 0, max: 24 },
  activities: [{ type: String }],
  triggers: [{ type: String }],
  notes: { type: String },
  location_context: { type: String, trim: true, maxlength: 100 },
  weather_context: { type: String, trim: true, maxlength: 50 },
  ai_analysis: { type: Schema.Types.Mixed },
  checked_in_at: { type: Date, default: Date.now, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

moodEntrySchema.index({ user_id: 1, checked_in_at: -1 });

const journalEntrySchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  mood_entry_id: { type: Schema.Types.ObjectId, ref: 'MoodEntry', default: null },
  tags: [{ type: String }],
  is_private: { type: Boolean, default: true },
  sentiment_score: { type: Number },
  word_count: { type: Number },
  reading_time_minutes: { type: Number },
  prompt_used: { type: String, maxlength: 500 },
  ai_insights: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

journalEntrySchema.index({ user_id: 1, created_at: -1 });

const quoteSchema = new Schema({
  content: { type: String, required: true, trim: true },
  author: { type: String, trim: true, maxlength: 150 },
  category: { type: String, trim: true, maxlength: 50, index: true },
  mood_tags: [{ type: String }],
  language: { type: String, default: 'en' },
  is_active: { type: Boolean, default: true },
  like_count: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

const userQuoteInteractionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quote_id: { type: Schema.Types.ObjectId, ref: 'Quote', required: true, index: true },
  interaction_type: {
    type: String,
    required: true,
    enum: ['like', 'save', 'share', 'dismiss'],
  },
  created_at: { type: Date, default: Date.now },
}, {
  versionKey: false,
});

userQuoteInteractionSchema.index({ user_id: 1, quote_id: 1, interaction_type: 1 }, { unique: true });

const achievementSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { type: String, required: true },
  requirement_type: { type: String, required: true },
  requirement_value: { type: Number, required: true },
  points: { type: Number, default: 0 },
  rarity: { type: String, default: 'common' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

const userAchievementSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  achievement_id: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true, index: true },
  earned_at: { type: Date, default: Date.now },
}, {
  versionKey: false,
});

userAchievementSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });

const notificationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, trim: true, maxlength: 50 },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  is_read: { type: Boolean, default: false, index: true },
  read_at: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

// Crisis Detection Service
const riskFlagSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  source: { type: String, required: true, enum: ['chat', 'mood_entry', 'journal'] },
  flag_type: { type: String, required: true, enum: ['suicidal_ideation', 'self_harm', 'extreme_distress'] },
  message: { type: String, required: true },
  indicators: [{ type: String }],
  confidence: { type: Number, min: 0, max: 1 },
  reviewed: { type: Boolean, default: false },
  reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewed_at: { type: Date },
  action_taken: { type: String, maxlength: 1000 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

riskFlagSchema.index({ user_id: 1, created_at: -1, severity: 1 });

// AI Micro Coach Service
const conversationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true, maxlength: 200 },
  context: {
    last_mood_score: { type: Number, min: 1, max: 10 },
    current_challenges: [{ type: String }],
  },
  message_count: { type: Number, default: 0 },
  started_at: { type: Date, default: Date.now },
  last_message_at: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

conversationSchema.index({ user_id: 1, updated_at: -1 });

const messageSchema = new Schema({
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  content: { type: String, required: true },
  flagged_risk: { type: Boolean, default: false },
  risk_flags: [{ type: String }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

messageSchema.index({ conversation_id: 1, created_at: 1 });
messageSchema.index({ user_id: 1, created_at: -1 });

// Playbook Service
const playbookSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  duration_days: { type: Number, required: true, min: 1 },
  difficulty: { type: String, default: 'intermediate', enum: ['beginner', 'intermediate', 'advanced'] },
  target_mood: [{ type: Number, min: 1, max: 10 }],
  intervention_ids: [{ type: Schema.Types.ObjectId, ref: 'Intervention' }],
  lesson_count: { type: Number, default: 0 },
  enrollment_count: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  review_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const playbookLessonSchema = new Schema({
  playbook_id: { type: Schema.Types.ObjectId, ref: 'Playbook', required: true, index: true },
  day: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  intervention_id: { type: Schema.Types.ObjectId, ref: 'Intervention' },
  estimated_duration: { type: Number, default: 15 },
  instructions: { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

playbookLessonSchema.index({ playbook_id: 1, day: 1 });

const userPlaybookSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  playbook_id: { type: Schema.Types.ObjectId, ref: 'Playbook', required: true, index: true },
  start_date: { type: Date, default: Date.now },
  current_day: { type: Number, default: 1 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  lessons_completed: [{ type: Number }],
  status: { type: String, default: 'active', enum: ['active', 'completed', 'abandoned'] },
  completed_at: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userPlaybookSchema.index({ user_id: 1, status: 1, updated_at: -1 });

// Social Accountability Service
const challengeSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, required: true, trim: true, maxlength: 50 },
  duration_days: { type: Number, required: true, min: 1 },
  goal: { type: Number, required: true },
  creator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participant_count: { type: Number, default: 0 },
  difficulty: { type: String, default: 'medium', enum: ['easy', 'medium', 'hard'] },
  is_recurring: { type: Boolean, default: false },
  reward: { type: String, maxlength: 200 },
  is_active: { type: Boolean, default: true },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const challengeParticipantSchema = new Schema({
  challenge_id: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  progress: { type: Number, default: 0 },
  progress_percent: { type: Number, default: 0, min: 0, max: 100 },
  joined_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  status: { type: String, default: 'active', enum: ['active', 'completed', 'abandoned'] },
  leaderboard_rank: { type: Number },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

challengeParticipantSchema.index({ challenge_id: 1, progress_percent: -1 });
challengeParticipantSchema.index({ user_id: 1, status: 1 });
challengeParticipantSchema.index({ challenge_id: 1, user_id: 1 }, { unique: true });

// User Profile Service
const userProfileSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, trim: true, maxlength: 100 },
  goals: [{ type: String, trim: true, maxlength: 100 }],
  preferred_checkin_time: { type: String, default: '08:00' },
  timezone: { type: String, default: 'UTC' },
  settings: {
    notifications: { type: Boolean, default: true },
    email_notifications: { type: Boolean, default: true },
    dark_mode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
  },
  avatar_url: { type: String, trim: true },
  date_of_birth: { type: Date },
  gender: { type: String, trim: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userProfileSchema.index({ user_id: 1 }, { unique: true });

// Intervention Library Service
const interventionSchema = new Schema({
  type: { type: String, required: true, enum: ['breathing', 'meditation', 'grounding', 'visualization', 'journaling', 'movement'], index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  duration: { type: Number, required: true, min: 30 },
  steps: [{ type: String, required: true }],
  category: { type: String, trim: true, maxlength: 50, index: true },
  difficulty: { type: String, default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] },
  audio_url: { type: String, trim: true },
  image_url: { type: String, trim: true },
  is_active: { type: Boolean, default: true, index: true },
  usage_count: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  review_count: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

interventionSchema.index({ title: 'text', type: 'text', description: 'text', tags: 'text' });

// Analytics Event Service
const analyticsEventSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event_type: { type: String, required: true, index: true },
  metadata: { type: Schema.Types.Mixed },
  source: { type: String, trim: true, maxlength: 50 },
  session_id: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

analyticsEventSchema.index({ user_id: 1, timestamp: -1 });
analyticsEventSchema.index({ event_type: 1, timestamp: -1 });

// Contextual Trigger Engine
const contextEventSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event_type: { type: String, required: true, enum: ['calendar_event', 'location_change', 'time_based', 'mood_drop', 'inactivity'] },
  metadata: { type: Schema.Types.Mixed },
  trigger_fired: { type: Boolean, default: false },
  triggered_intervention_id: { type: Schema.Types.ObjectId, ref: 'Intervention' },
  timestamp: { type: Date, default: Date.now, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

contextEventSchema.index({ user_id: 1, event_type: 1, timestamp: -1 });

// Insights Service - Daily Stats
const dailyStatsSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  avg_mood: { type: Number, min: 1, max: 10 },
  mood_entries_count: { type: Number, default: 0 },
  intervention_count: { type: Number, default: 0 },
  journal_count: { type: Number, default: 0 },
  total_active_minutes: { type: Number, default: 0 },
  streak_active: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

dailyStatsSchema.index({ user_id: 1, date: -1 }, { unique: true });

// Recommendation Engine
const recommendationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  task_type: { type: String, required: true, enum: ['focus_sprint', 'breathing', 'gratitude', 'movement', 'reflection', 'social'] },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 500 },
  duration: { type: Number, default: 300 },
  intervention_id: { type: Schema.Types.ObjectId, ref: 'Intervention' },
  priority: { type: Number, default: 0, min: 0, max: 10 },
  completed: { type: Boolean, default: false, index: true },
  completed_at: { type: Date },
  dismissed: { type: Boolean, default: false },
  expires_at: { type: Date, index: true },
  score: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

recommendationSchema.index({ user_id: 1, completed: 1, created_at: -1 });

// File Storage Service
const fileSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  original_name: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  type: { type: String, required: true, enum: ['audio', 'image', 'document', 'video', 'other'] },
  mime_type: { type: String, trim: true },
  size: { type: Number, required: true },
  storage_key: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now },
  is_public: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

fileSchema.index({ user_id: 1, created_at: -1 });

// Data Privacy Service
const dataExportSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, required: true, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  file_url: { type: String },
  expires_at: { type: Date },
  requested_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

dataExportSchema.index({ user_id: 1, created_at: -1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const MoodEntry = mongoose.models.MoodEntry || mongoose.model('MoodEntry', moodEntrySchema);
const JournalEntry = mongoose.models.JournalEntry || mongoose.model('JournalEntry', journalEntrySchema);
const Quote = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
const UserQuoteInteraction = mongoose.models.UserQuoteInteraction || mongoose.model('UserQuoteInteraction', userQuoteInteractionSchema);
const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.models.UserAchievement || mongoose.model('UserAchievement', userAchievementSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
const RiskFlag = mongoose.models.RiskFlag || mongoose.model('RiskFlag', riskFlagSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
const Playbook = mongoose.models.Playbook || mongoose.model('Playbook', playbookSchema);
const PlaybookLesson = mongoose.models.PlaybookLesson || mongoose.model('PlaybookLesson', playbookLessonSchema);
const UserPlaybook = mongoose.models.UserPlaybook || mongoose.model('UserPlaybook', userPlaybookSchema);
const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);
const ChallengeParticipant = mongoose.models.ChallengeParticipant || mongoose.model('ChallengeParticipant', challengeParticipantSchema);
const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
const Intervention = mongoose.models.Intervention || mongoose.model('Intervention', interventionSchema);
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);
const ContextEvent = mongoose.models.ContextEvent || mongoose.model('ContextEvent', contextEventSchema);
const DailyStats = mongoose.models.DailyStats || mongoose.model('DailyStats', dailyStatsSchema);
const Recommendation = mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema);
const File = mongoose.models.File || mongoose.model('File', fileSchema);
const DataExport = mongoose.models.DataExport || mongoose.model('DataExport', dataExportSchema);

module.exports = {
  User,
  MoodEntry,
  JournalEntry,
  Quote,
  UserQuoteInteraction,
  Achievement,
  UserAchievement,
  Notification,
  RiskFlag,
  Conversation,
  Message,
  Playbook,
  PlaybookLesson,
  UserPlaybook,
  Challenge,
  ChallengeParticipant,
  UserProfile,
  Intervention,
  AnalyticsEvent,
  ContextEvent,
  DailyStats,
  Recommendation,
  File,
  DataExport,
};
