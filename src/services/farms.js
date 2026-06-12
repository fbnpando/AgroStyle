import { supabase } from './supabase';

const SELECT = `
  id,
  producerId:producer_id,
  name,
  phone,
  zone,
  lat,
  lng,
  createdAt:created_at,
  updatedAt:updated_at
`;

export async function listProducerFarms(producerId) {
  const { data, error } = await supabase
    .from('farms')
    .select(SELECT)
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createFarm(payload) {
  const row = {
    producer_id: payload.producerId,
    name: payload.name,
    phone: payload.phone,
    zone: payload.zone,
    lat: payload.lat,
    lng: payload.lng,
  };
  const { data, error } = await supabase
    .from('farms')
    .insert(row)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function updateFarm(farmId, payload) {
  const patch = {};
  const map = { name: 'name', phone: 'phone', zone: 'zone', lat: 'lat', lng: 'lng' };
  for (const [k, col] of Object.entries(map)) {
    if (k in payload) patch[col] = payload[k];
  }
  const { data, error } = await supabase
    .from('farms')
    .update(patch)
    .eq('id', farmId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFarm(farmId) {
  const { error } = await supabase.from('farms').delete().eq('id', farmId);
  if (error) throw error;
}
