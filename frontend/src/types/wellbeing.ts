export type PlaybookDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PlaybookStatus = 'active' | 'completed' | 'abandoned';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'active' | 'completed' | 'abandoned';

export interface UserLite {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface PlaybookSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: PlaybookDifficulty;
  duration_days: number;
  lesson_count: number;
  enrollment_count: number;
  rating: number;
  review_count: number;
  target_mood?: number[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlaybookLesson {
  id: string;
  playbook_id?: string;
  day: number;
  title: string;
  description: string;
  estimated_duration: number;
  instructions: string;
  intervention_id?: string | null;
  created_at?: string;
}

export interface PlaybookDetail extends PlaybookSummary {
  lessons: PlaybookLesson[];
}

export interface UserPlaybook {
  id: string;
  user_id: string;
  playbook_id?: string | PlaybookSummary;
  playbook: PlaybookSummary;
  start_date: string;
  current_day: number;
  progress: number;
  lessons_completed: number[];
  status: PlaybookStatus;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserPlaybookProgress extends Omit<UserPlaybook, 'playbook'> {
  playbook: PlaybookSummary;
  lessons: PlaybookLesson[];
}

export interface ChallengeSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: ChallengeDifficulty;
  duration_days: number;
  goal: number;
  participant_count: number;
  reward?: string;
  is_recurring?: boolean;
  is_active?: boolean;
  start_date: string;
  end_date?: string;
  creator_id?: string | UserLite;
  created_at?: string;
  updated_at?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id?: string | ChallengeSummary;
  challenge: ChallengeSummary;
  user_id: string;
  progress: number;
  progress_percent: number;
  joined_at: string;
  status: ChallengeStatus;
  completed_at?: string | null;
  leaderboard_rank?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChallengeLeaderboardEntry {
  id: string;
  challenge_id?: string;
  user_id?: string | UserLite;
  user: UserLite;
  progress: number;
  progress_percent: number;
  joined_at: string;
  status: ChallengeStatus;
  rank: number;
}

export interface ChallengeLeaderboardResponse {
  leaderboard: ChallengeLeaderboardEntry[];
  userRank: number | null;
}
