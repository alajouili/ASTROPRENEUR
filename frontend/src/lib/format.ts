/**
 * Shared formatting and typing utilities for TrustHR.
 */

export type RiskFlagLike =
  | string
  | {
      code?: string;
      severity?: string;
      detail?: string;
      excerpt?: string;
      location?: string;
      candidate_id?: string;
      [key: string]: any;
    };

export const initials = (name?: string): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const roleLabel = (role?: string): string => {
  if (!role) return '';
  switch (role) {
    case 'hr_admin':
      return 'HR Administrator';
    case 'recruiter':
      return 'Recruiter';
    case 'employee':
      return 'Employee';
    default:
      return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
};
