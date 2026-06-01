export interface IProjectStage {
    label: string;
    completed: boolean;
    completedAt?: Date;
  }
  
  export interface IProject {
    projectId: string;
    clientId: string;
    title: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'review' | 'completed';
    progress: number;
    stages: IProjectStage[];
    startDate: Date;
    dueDate: Date;
    completedAt?: Date;
    createdAt: Date;
  }