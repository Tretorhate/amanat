import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeRole(role: string): 'citizen' | 'deputy' | 'admin' {
  // Backend roles are already in the correct format
  if (role === 'citizen' || role === 'deputy' || role === 'admin') {
    return role;
  }
  // Fallback to citizen if role is unknown
  return 'citizen';
}
