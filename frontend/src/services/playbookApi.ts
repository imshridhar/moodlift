import { api } from './api';
import type {
  PlaybookDetail,
  PlaybookLesson,
  PlaybookStatus,
  PlaybookSummary,
  UserPlaybook,
  UserPlaybookProgress,
} from '../types/wellbeing';

export const playbookApi = {
  // Get all playbooks
  getPlaybooks: async (filters?: {
    category?: string;
    difficulty?: string;
    limit?: number;
    skip?: number;
  }): Promise<PlaybookSummary[]> => {
    const response = await api.get('/playbooks', { params: filters });
    return response.data.data;
  },

  // Get specific playbook
  getPlaybook: async (playbookId: string): Promise<PlaybookDetail> => {
    const response = await api.get(`/playbooks/${playbookId}`);
    return response.data.data;
  },

  // Enroll in playbook
  enrollPlaybook: async (playbookId: string): Promise<UserPlaybook> => {
    const response = await api.post(`/playbooks/${playbookId}/enroll`);
    return response.data.data;
  },

  // Get user's playbooks
  getUserPlaybooks: async (status?: PlaybookStatus): Promise<UserPlaybook[]> => {
    const response = await api.get('/playbooks/my', { params: status ? { status } : {} });
    return response.data.data;
  },

  // Get user's progress on playbook
  getUserProgress: async (playbookId: string): Promise<UserPlaybookProgress> => {
    const response = await api.get(`/playbooks/${playbookId}/my-progress`);
    return response.data.data;
  },

  // Complete lesson
  completeLesson: async (playbookId: string, day: number): Promise<UserPlaybook> => {
    const response = await api.post(`/playbooks/${playbookId}/lessons/${day}/complete`);
    return response.data.data;
  },

  // Get specific lesson
  getLesson: async (playbookId: string, day: number): Promise<PlaybookLesson> => {
    const response = await api.get(`/playbooks/${playbookId}/lessons/${day}`);
    return response.data.data;
  },

  // Abandon playbook
  abandonPlaybook: async (playbookId: string): Promise<UserPlaybook> => {
    const response = await api.patch(`/playbooks/${playbookId}/abandon`);
    return response.data.data;
  },
};
