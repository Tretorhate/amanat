import api from './axios';
import {
  Citizen,
  CitizenDocument,
  UpdateCitizenDto,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@/types/citizen';

export const citizensApi = {
  // Citizen Profile
  getProfile: () => api.get<Citizen>('/citizens/'),

  updateProfile: (data: UpdateCitizenDto) => api.put<Citizen>('/citizens/', data),

  // Citizen Documents
  getDocuments: () => api.get<CitizenDocument[]>('/citizens/documents/'),

  createDocument: (data: CreateDocumentDto) => {
    const formData = new FormData();
    formData.append('document_type', data.document_type);
    formData.append('document_number', data.document_number);
    formData.append('issue_date', data.issue_date);
    formData.append('issued_by', data.issued_by);

    if (data.expiry_date) {
      formData.append('expiry_date', data.expiry_date);
    }

    if (data.file) {
      formData.append('file', data.file);
    }

    return api.post<CitizenDocument>('/citizens/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getDocument: (id: number) =>
    api.get<CitizenDocument>(`/citizens/documents/${id}/`),

  updateDocument: (id: number, data: UpdateDocumentDto) => {
    const formData = new FormData();

    if (data.document_type) formData.append('document_type', data.document_type);
    if (data.document_number) formData.append('document_number', data.document_number);
    if (data.issue_date) formData.append('issue_date', data.issue_date);
    if (data.issued_by) formData.append('issued_by', data.issued_by);

    if (data.expiry_date !== undefined) {
      if (data.expiry_date) {
        formData.append('expiry_date', data.expiry_date);
      } else {
        formData.append('expiry_date', '');
      }
    }

    if (data.file) {
      formData.append('file', data.file);
    }

    return api.put<CitizenDocument>(`/citizens/documents/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteDocument: (id: number) =>
    api.delete(`/citizens/documents/${id}/`),
};
