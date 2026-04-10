import { User } from './user';
import { Deputy } from './user';

export interface Citizen {
  id: string;
  user: User;
  full_name: string;
  phone: string;
  address: string;
  district: string;
  telegram_user_id: number | null;
  telegram_chat_id: number | null;
  assigned_deputy: Deputy | null;
  created_at: string;
}

export type DocumentType = 'national_id' | 'passport' | 'birth_certificate' | 'other';

export interface CitizenDocument {
  id: number;
  citizen: string; // UUID
  document_type: DocumentType;
  document_number: string;
  issue_date: string; // YYYY-MM-DD
  expiry_date: string | null; // YYYY-MM-DD
  issued_by: string;
  file: string | null; // File URL
  is_verified: boolean;
  created_at: string;
}

export interface UpdateCitizenDto {
  full_name?: string;
  phone?: string;
  address?: string;
  district?: string;
}

export interface CreateDocumentDto {
  document_type: DocumentType;
  document_number: string;
  issue_date: string;
  expiry_date?: string | null;
  issued_by: string;
  file?: File;
}

export interface UpdateDocumentDto {
  document_type?: DocumentType;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string | null;
  issued_by?: string;
  file?: File;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  national_id: 'Удостоверение личности',
  passport: 'Паспорт',
  birth_certificate: 'Свидетельство о рождении',
  other: 'Другое',
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'national_id', label: 'Удостоверение личности' },
  { value: 'passport', label: 'Паспорт' },
  { value: 'birth_certificate', label: 'Свидетельство о рождении' },
  { value: 'other', label: 'Другое' },
] as const;
