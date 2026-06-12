import React, { useState } from 'react';
import { X, ShoppingCart, Trash2, Minus, Plus, Package, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orders';
import { isPreorder } from '../services/products';
import './CartDrawer.css';

export default function CartDrawer({ onOrderPlaced }) {
  const { items, total, producerName, removeItem, updateQty, clearCart, closeCart } = useCart();
  const { currentUser, userData } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState('');

  async function handleConfirm() {
    if (!items.length) return;
    setPlacing(true);
    setError('');
    try {
      const orderItems = items.map(({ product, qty }) => ({
        productId:     product.id,
        productName:   product.name,
        unit:          product.unit,
        price:         Number(product.price),
        quantity:      qty,
        subtotal:      Number(product.price) * qty,
        isPreorder:    isPreorder(product),
        availableDate: product.availableDate || null,
      }));

      const order = await createOrder({
        buyerId:      currentUser.id,
        buyerName:    userData?.fullName || currentUser.email,
        producerId:   items[0].product.producerId,
        producerName: items[0].product.producerName,
        total,
        notes:        '',
        items:        orderItems,
      });

      clearCart();
      closeCart();
      onOrderPlaced?.(order);
    } catch (err) {
      setError(err.message || 'Error al crear el pedido.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="cart-overlay" onClick={closeCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-head">
          <div>
            <h2><ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Mi carrito</h2>
            {items.length > 0 && (
              <div className="cart-head-meta">{items.length} {items.length === 1 ? 'producto' : 'productos'}</div>
            )}
          </div>
          <button className="cart-close" onClick={closeCart}><X size={18} /></button>
        </div>

        {producerName && (
          <div className="cart-producer-banner">
            <Package size={13} /> Productor: {producerName}
          </div>
        )}

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={40} />
              <span>Tu carrito está vacío</span>
            </div>
          ) : (
            items.map(({ product, qty }) => {
              const subtotal = Number(product.price) * qty;
              const pre = isPreorder(product);
              return (
                <div key={product.id} className="cart-item">
                  <div className="cart-item-img">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} />
                      : <Package size={22} />}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{product.name}</div>
                    <div className="cart-item-price">Bs {Number(product.price).toFixed(2)} / {product.unit}</div>
                    {pre && <div className="cart-item-preorder">Preventa</div>}
                    <div className="cart-item-ctrl">
                      <button
                        className="cart-step-btn"
                        onClick={() => updateQty(product.id, qty - 1)}
                        disabled={qty <= 1}
                      ><Minus size={12} /></button>
                      <span className="cart-qty-val">{qty}</span>
                      <button
                        className="cart-step-btn"
                        onClick={() => updateQty(product.id, qty + 1)}
                        disabled={qty >= Number(product.quantity)}
                      ><Plus size={12} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <button className="cart-item-remove" onClick={() => removeItem(product.id)}>
                      <Trash2 size={14} />
                    </button>
                    <div className="cart-item-subtotal">Bs {subtotal.toFixed(2)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Total</span>
              <span>Bs {total.toFixed(2)}</span>
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '0.6rem' }}>{error}</p>}
            <button className="cart-btn-confirm" onClick={handleConfirm} disabled={placing}>
              <CheckCircle size={16} />
              {placing ? 'Enviando pedido…' : 'Confirmar pedido'}
            </button>
            <button className="cart-btn-clear" onClick={clearCart}>
              <Trash2 size={13} /> Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
