import { When } from './common';

export interface IProjectStage {
  label: string;
  completed: boolean;
  completedAt?: When | null;
}

export type ProjectStatus = 'not_started' | 'in_progress' | 'review' | 'completed';

export interface IProject {
  projectId: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;            // 0–100, worked out from the stages
  stages: IProjectStage[];
  startDate: When;
  dueDate: When | null;
  completedAt?: When | null;
  createdAt: When;
}

/** The stages a new video project starts with (the owner can edit them). */
export const DEFAULT_STAGES = [
  'Brief agreed',
  'Pre-production',
  'Filming',
  'Editing',
  'Client review',
  'Final delivery',
];
