import { supabase } from './supabase';
import { uploadImage } from './uploads';

export const PRODUCT_CATEGORIES = [
  { id: 'frutas',      label: 'Frutas',      emoji: 'F' },
  { id: 'verduras',    label: 'Verduras',    emoji: 'V' },
  { id: 'granos',      label: 'Granos',      emoji: 'G' },
  { id: 'tuberculos',  label: 'Tubérculos',  emoji: 'T' },
  { id: 'legumbres',   label: 'Legumbres',   emoji: 'L' },
  { id: 'lacteos',     label: 'Lácteos',     emoji: 'D' },
];

export const PRODUCT_UNITS = [
  { id: 'kg',      label: 'Kilogramo (kg)' },
  { id: 'arroba',  label: 'Arroba (≈ 11.5 kg)' },
  { id: 'quintal', label: 'Quintal (≈ 46 kg)' },
  { id: 'unidad',  label: 'Unidad' },
  { id: 'litro',   label: 'Litro' },
  { id: 'bolsa',   label: 'Bolsa' },
  { id: 'caja',    label: 'Caja' },
];

const SUGGESTED_PRICE_TABLE = {
  frutas:     { kg: 8,  arroba: 90,  quintal: 360, unidad: 2,  litro: 10, bolsa: 35, caja: 60 },
  verduras:   { kg: 6,  arroba: 65,  quintal: 270, unidad: 2,  litro: 8,  bolsa: 25, caja: 45 },
  granos:     { kg: 7,  arroba: 80,  quintal: 320, unidad: 1,  litro: 9,  bolsa: 30, caja: 50 },
  tuberculos: { kg: 5,  arroba: 55,  quintal: 225, unidad: 1,  litro: 6,  bolsa: 22, caja: 40 },
  legumbres:  { kg: 10, arroba: 110, quintal: 450, unidad: 2,  litro: 12, bolsa: 40, caja: 70 },
  lacteos:    { kg: 14, arroba: 160, quintal: 640, unidad: 5,  litro: 12, bolsa: 35, caja: 85 },
};

export function getSuggestedPrice(category, unit) {
  return SUGGESTED_PRICE_TABLE?.[category]?.[unit] ?? null;
}

export function isPreorder(product) {
  if (!product?.availableDate) return false;
  const target = new Date(product.availableDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target.getTime() > today.getTime();
}

export function daysUntilAvailable(product) {
  if (!product?.availableDate) return 0;
  const target = new Date(product.availableDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export async function uploadProductImage(uid, file) {
  return uploadImage(file, `products/${uid}`);
}

const SELECT = `
  id,
  producerId:producer_id,
  producerName:producer_name,
  farmId:farm_id,
  farmName:farm_name,
  farmZone:farm_zone,
  lat,
  lng,
  name,
  category,
  description,
  price,
  suggestedPrice:suggested_price,
  quantity,
  unit,
  imageUrl:image_url,
  availabilityType:availability_type,
  availableDate:available_date,
  status,
  createdAt:created_at,
  updatedAt:updated_at
`;

function toRow(p) {
  return {
    producer_id:       p.producerId,
    producer_name:     p.producerName,
    farm_id:           p.farmId || null,
    farm_name:         p.farmName,
    farm_zone:         p.farmZone,
    lat:               p.lat,
    lng:               p.lng,
    name:              p.name,
    category:          p.category,
    description:       p.description,
    price:             p.price,
    suggested_price:   p.suggestedPrice,
    quantity:          p.quantity,
    unit:              p.unit,
    image_url:         p.imageUrl,
    availability_type: p.availabilityType,
    available_date:    p.availableDate,
    status:            p.status || 'active',
  };
}

export async function createProduct(data) {
  const { data: row, error } = await supabase
    .from('products')
    .insert(toRow(data))
    .select(SELECT)
    .single();
  if (error) throw error;
  return row;
}

export async function updateProduct(productId, data) {
  const patch = {};
  const map = {
    producerName: 'producer_name', farmId: 'farm_id', farmName: 'farm_name',
    farmZone: 'farm_zone', name: 'name', category: 'category',
    description: 'description', price: 'price', suggestedPrice: 'suggested_price',
    quantity: 'quantity', unit: 'unit', imageUrl: 'image_url',
    availabilityType: 'availability_type', availableDate: 'available_date',
    status: 'status', lat: 'lat', lng: 'lng',
  };
  for (const [k, col] of Object.entries(map)) {
    if (k in data) patch[col] = data[k];
  }
  const { data: row, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId)
    .select(SELECT)
    .single();
  if (error) throw error;
  return row;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export async function getProduct(productId) {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listProducerProducts(producerId) {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
