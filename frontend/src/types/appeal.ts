export enum AppealStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum AppealCategory {
  INFRASTRUCTURE = 'infrastructure',
  SAFETY = 'safety',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  ENVIRONMENT = 'environment',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  UTILITIES = 'utilities',
  SOCIAL_SERVICES = 'social_services',
  OTHER = 'other',
}

export interface AppealAttachment {
  id: string;
  appeal_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface Appeal {
  id: string;
  title: string;
  description: string;
  category: AppealCategory;
  status: AppealStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message_count: number;
  message_limit?: number;
  citizen: {
    id: string;
    user: {
      id: string;
      full_name: string;
      phone: string;
      username: string;
    };
    district: string;
  };
  deputy: {
    id: string;
    user: {
      id: string;
      full_name: string;
    };
    district: string;
  };
  created_at: string;
  responded_at: string | null;
  closed_at: string | null;
  satisfaction_rating: number | null;
  messages?: Message[];
  comments?: Message[];
  dialogue_messages?: AppealMessage[];
  appeal_comments?: AppealComment[];
  attachments?: AppealAttachment[];
}

export interface Message {
  id: string;
  appeal_id: string;
  sender_type: 'citizen' | 'deputy';
  sender_id: string;
  content: string;
  created_at: string;
}

export interface AppealMessage {
  id: string;
  appeal: string;
  sender_type: 'citizen' | 'deputy' | 'system';
  sender_user: string | null;
  sender_user_name: string | null;
  message: string;
  created_at: string;
  is_visible_to_citizen: boolean;
  is_read?: boolean;
}

export interface AppealComment {
  id: string;
  appeal: string;
  author: {
    id: string;
    full_name: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppealDto {
  title: string;
  description: string;
}

export interface UpdateStatusDto {
  status: AppealStatus;
  message?: string;
  comment?: string;
  internal_notes?: string;
}
