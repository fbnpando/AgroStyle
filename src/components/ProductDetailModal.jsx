import React, { useState } from 'react';
import {
  X, MapPin, Calendar, Package, ShoppingCart, Sparkles, User, Minus, Plus, CheckCircle,
} from 'lucide-react';
import {
  PRODUCT_CATEGORIES, isPreorder, daysUntilAvailable,
} from '../services/products';
import { formatDistance } from '../utils/geo';
import { useCart } from '../context/CartContext';
import './ProductDetailModal.css';

function categoryLabel(id) {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function ProductDetailModal({ product, distanceKm, onClose }) {
  const preorder = isPreorder(product);
  const days = preorder ? daysUntilAvailable(product) : 0;
  const stock = Number(product.quantity);
  const { addItem, openCart } = useCart();

  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const [conflictMsg, setConflictMsg] = useState('');

  function clamp(n) {
    if (Number.isNaN(n) || n < 1) return 1;
    if (n > stock) return stock;
    return Math.floor(n);
  }

  const subtotal = Number(product.price) * qty;
  const advance  = preorder ? subtotal * 0.4 : 0;
  const balance  = preorder ? subtotal - advance : 0;

  return (
    <div className="pd-overlay" onClick={onClose}>
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pd-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>

        <div className="pd-grid">
          <div className="pd-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="pd-image-fallback"><Package size={42} /></div>
            )}
            {preorder ? (
              <span className="pd-badge pd-badge-preorder">
                <Calendar size={12} /> Preventa · disponible en {days} días
              </span>
            ) : (
              <span className="pd-badge pd-badge-now">Disponible ahora</span>
            )}
          </div>

          <div className="pd-info">
            <span className="pd-category">{categoryLabel(product.category)}</span>
            <h2>{product.name}</h2>

            <div className="pd-meta">
              <div className="pd-meta-item">
                <MapPin size={14} />
                <span>{product.farmZone || product.farmName || 'Santa Cruz'}</span>
              </div>
              {distanceKm != null && (
                <div className="pd-meta-item">
                  <span className="pd-dot" /> {formatDistance(distanceKm)} desde ti
                </div>
              )}
              <div className="pd-meta-item">
                <User size={14} />
                <span>{product.producerName}</span>
              </div>
            </div>

            <p className="pd-desc">{product.description}</p>

            <div className="pd-price-box">
              <div>
                <span>Precio</span>
                <strong>Bs {Number(product.price).toFixed(2)} <small>/ {product.unit}</small></strong>
              </div>
              <div>
                <span>Stock disponible</span>
                <strong>{stock} <small>{product.unit}</small></strong>
              </div>
              {product.suggestedPrice != null && (
                <div className="pd-suggested">
                  <Sparkles size={12} /> Referencia mercado: Bs {product.suggestedPrice} / {product.unit}
                </div>
              )}
            </div>

            {/* Selector de cantidad */}
            <div className="pd-qty-box">
              <div className="pd-qty-head">
                <span>¿Cuánto deseas comprar?</span>
                <small>{product.unit}</small>
              </div>
              <div className="pd-qty-row">
                <div className="pd-stepper">
                  <button
                    type="button"
                    className="pd-step-btn"
                    onClick={() => setQty(q => clamp(q - 1))}
                    disabled={qty <= 1}
                    aria-label="Disminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="pd-step-input"
                    min={1}
                    max={stock}
                    step={1}
                    value={qty}
                    onChange={(e) => setQty(clamp(Number(e.target.value)))}
                  />
                  <button
                    type="button"
                    className="pd-step-btn"
                    onClick={() => setQty(q => clamp(q + 1))}
                    disabled={qty >= stock}
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="pd-qty-quick">
                  <button type="button" onClick={() => setQty(clamp(Math.floor(stock / 4)))}>25%</button>
                  <button type="button" onClick={() => setQty(clamp(Math.floor(stock / 2)))}>50%</button>
                  <button type="button" onClick={() => setQty(stock)}>Todo</button>
                </div>
              </div>

              <div className="pd-summary">
                <div className="pd-summary-row">
                  <span>Subtotal</span>
                  <strong>Bs {subtotal.toFixed(2)}</strong>
                </div>
                {preorder ? (
                  <>
                    <div className="pd-summary-row pd-summary-accent">
                      <span>Anticipo hoy (40%)</span>
                      <strong>Bs {advance.toFixed(2)}</strong>
                    </div>
                    <div className="pd-summary-row pd-summary-sub">
                      <span>Saldo al recibir</span>
                      <strong>Bs {balance.toFixed(2)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="pd-summary-row pd-summary-sub">
                    <span>Pagas al entregar</span>
                    <strong>Bs {subtotal.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              {preorder && (
                <p className="pd-preorder-note">
                  Reservas con el 40% y pagas el saldo cuando el productor coseche.
                </p>
              )}
            </div>

            {conflictMsg && (
              <p style={{ color:'#dc2626', fontSize:'0.8rem', marginBottom:'0.5rem',
                background:'#fef2f2', padding:'0.5rem 0.75rem', borderRadius:'8px' }}>
                {conflictMsg}
              </p>
            )}
            {addedMsg && (
              <p style={{ color:'#15803d', fontSize:'0.8rem', marginBottom:'0.5rem',
                background:'#f0fdf4', padding:'0.5rem 0.75rem', borderRadius:'8px',
                display:'flex', alignItems:'center', gap:'0.35rem' }}>
                <CheckCircle size={13} /> {addedMsg}
              </p>
            )}
            <div className="pd-actions">
              <button
                className="pd-btn-primary"
                onClick={() => {
                  setConflictMsg('');
                  setAddedMsg('');
                  const result = addItem(product, qty);
                  if (result?.error) {
                    setConflictMsg(result.error);
                  } else {
                    setAddedMsg(`${qty} ${product.unit} agregado${qty > 1 ? 's' : ''} al carrito`);
                    setTimeout(() => setAddedMsg(''), 2500);
                  }
                }}
              >
                <ShoppingCart size={15} />
                {preorder
                  ? `Reservar ${qty} ${product.unit} · Bs ${advance.toFixed(2)}`
                  : `Agregar ${qty} ${product.unit} · Bs ${subtotal.toFixed(2)}`}
              </button>
              <button className="pd-btn-ghost" onClick={() => { openCart(); onClose(); }}>
                Ver carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
