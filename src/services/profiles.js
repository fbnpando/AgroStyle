import { supabase } from './supabase';

const SELECT = `
  id,
  fullName:full_name,
  email,
  role,
  status,
  rejectionReason:rejection_reason,
  approvedAt:approved_at,
  rejectedAt:rejected_at,
  createdAt:created_at
`;

export async function listProfiles({ status, excludeRole } = {}) {
  let q = supabase.from('profiles').select(SELECT).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (excludeRole) q = q.neq('role', excludeRole);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function approveProfile(profileId, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    })
    .eq('id', profileId);
  if (error) throw error;
}

export async function rejectProfile(profileId, adminId, reason) {
  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: adminId,
      rejection_reason: reason || 'Sin especificar',
    })
    .eq('id', profileId);
  if (error) throw error;
}
