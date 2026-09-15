import { api } from './api';
import type {
  ChallengeDifficulty,
  ChallengeLeaderboardResponse,
  ChallengeParticipant,
  ChallengeStatus,
  ChallengeSummary,
} from '../types/wellbeing';

export const challengeApi = {
  // Get all active challenges
  getChallenges: async (filters?: {
    category?: string;
    difficulty?: string;
    limit?: number;
    skip?: number;
  }): Promise<ChallengeSummary[]> => {
    const response = await api.get('/challenges', { params: filters });
    return response.data.data;
  },

  // Get specific challenge
  getChallenge: async (challengeId: string): Promise<ChallengeSummary> => {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data.data;
  },

  // Create challenge
  createChallenge: async (data: {
    title: string;
    description: string;
    category: string;
    durationDays: number;
    goal: number;
      difficulty?: ChallengeDifficulty;
      isRecurring?: boolean;
      reward?: string;
  }): Promise<ChallengeSummary> => {
    const response = await api.post('/challenges', data);
    return response.data.data;
  },

  // Join challenge
  joinChallenge: async (challengeId: string): Promise<ChallengeParticipant> => {
    const response = await api.post(`/challenges/${challengeId}/join`);
    return response.data.data;
  },

  // Get user's challenges
  getUserChallenges: async (status?: ChallengeStatus): Promise<ChallengeParticipant[]> => {
    const response = await api.get('/challenges/my', { params: status ? { status } : {} });
    return response.data.data;
  },

  // Get user's progress on challenge
  getUserProgress: async (challengeId: string): Promise<ChallengeParticipant> => {
    const response = await api.get(`/challenges/${challengeId}/my-progress`);
    return response.data.data;
  },

  // Update progress
  updateProgress: async (challengeId: string, progressDelta: number): Promise<ChallengeParticipant> => {
    const response = await api.post(`/challenges/${challengeId}/progress`, { progressDelta });
    return response.data.data;
  },

  // Get leaderboard
  getLeaderboard: async (challengeId: string, limit?: number): Promise<ChallengeLeaderboardResponse> => {
    const response = await api.get(`/challenges/${challengeId}/leaderboard`, {
      params: limit ? { limit } : {},
    });
    return {
      leaderboard: response.data.data,
      userRank: response.data.user_rank,
    };
  },

  // Abandon challenge
  abandonChallenge: async (challengeId: string): Promise<ChallengeParticipant> => {
    const response = await api.patch(`/challenges/${challengeId}/abandon`);
    return response.data.data;
  },
};
