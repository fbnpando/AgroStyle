import { supabase } from './supabase';

const ORDER_SELECT = `
  id,
  buyerId:buyer_id,
  buyerName:buyer_name,
  producerId:producer_id,
  producerName:producer_name,
  status,
  total,
  notes,
  rejectionReason:rejection_reason,
  qrCode:qr_code,
  createdAt:created_at,
  updatedAt:updated_at,
  items:order_items (
    id,
    productId:product_id,
    productName:product_name,
    unit,
    price,
    quantity,
    subtotal,
    isPreorder:is_preorder,
    availableDate:available_date
  )
`;

export async function createOrder({ buyerId, buyerName, producerId, producerName, total, notes, items }) {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ buyer_id: buyerId, buyer_name: buyerName, producer_id: producerId, producer_name: producerName, total, notes })
    .select('id')
    .single();
  if (error) throw error;

  const rows = items.map((it) => ({
    order_id:       order.id,
    product_id:     it.productId,
    product_name:   it.productName,
    unit:           it.unit,
    price:          it.price,
    quantity:       it.quantity,
    subtotal:       it.subtotal,
    is_preorder:    it.isPreorder,
    available_date: it.availableDate || null,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(rows);
  if (itemsError) throw itemsError;

  return getOrder(order.id);
}

export async function getOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listBuyerOrders(buyerId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listProducerOrders(producerId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function confirmOrder(orderId) {
  const qrCode = `AGROSTYLE-PAY-${orderId}`;
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'confirmed', qr_code: qrCode })
    .eq('id', orderId)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function rejectOrder(orderId, reason) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', orderId)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function payOrder(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .select(ORDER_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export const ORDER_STATUS_LABEL = {
  pending_confirmation: 'Pendiente confirmación',
  confirmed:  'Confirmado',
  rejected:   'Rechazado',
  paid:       'Pagado',
  delivered:  'Entregado',
};

export const ORDER_STATUS_COLOR = {
  pending_confirmation: 'warning',
  confirmed:  'info',
  rejected:   'danger',
  paid:       'success',
  delivered:  'success',
};
