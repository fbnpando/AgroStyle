import React, { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { payOrder } from '../services/orders';
import './QRPaymentModal.css';

// Deterministic pseudo-QR grid based on order id
function QRGrid({ seed }) {
  const cells = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 100; i++) {
    const v = (h ^ (i * 2654435761)) >>> 0;
    // Force corners dark for QR-like look
    const row = Math.floor(i / 10), col = i % 10;
    const isCorner =
      (row < 3 && col < 3) || (row < 3 && col > 6) || (row > 6 && col < 3);
    cells.push(
      <div key={i} className={`qr-cell ${isCorner || (v % 2 === 0) ? 'dark' : 'light'}`} />
    );
  }
  return <div className="qr-grid">{cells}</div>;
}

export default function QRPaymentModal({ order, onClose, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [paid,   setPaid]   = useState(false);
  const [error,  setError]  = useState('');

  async function handlePay() {
    setPaying(true);
    setError('');
    try {
      const updated = await payOrder(order.id);
      setPaid(true);
      onPaid?.(updated);
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        {!paid ? (
          <>
            <button
              style={{ position:'absolute', top:12, right:12, background:'none', border:'none',
                cursor:'pointer', color:'#9ca3af' }}
              onClick={onClose}
            ><X size={18} /></button>

            <h2>Pago con QR</h2>
            <p>Escaneá el código con tu app bancaria para pagar</p>

            <div className="qr-box">
              <QRGrid seed={order.qrCode || order.id} />
            </div>

            <div className="qr-amount">
              <span className="qr-amount-label">Total a pagar</span>
              <span className="qr-amount-value">Bs {Number(order.total).toFixed(2)}</span>
            </div>

            <div className="qr-code-text">{order.qrCode}</div>

            {error && <p style={{ color:'#dc2626', fontSize:'0.82rem', marginBottom:'0.75rem' }}>{error}</p>}

            <button className="qr-btn-pay" onClick={handlePay} disabled={paying}>
              <CreditCard size={16} />
              {paying ? 'Procesando…' : 'Simular pago exitoso'}
            </button>
            <button className="qr-btn-cancel" onClick={onClose}>Cancelar</button>
          </>
        ) : (
          <>
            <CheckCircle size={52} className="qr-paid-icon" />
            <div className="qr-paid-title">¡Pago exitoso!</div>
            <p className="qr-paid-sub">
              Tu pedido #{order.id.slice(0,8).toUpperCase()} fue pagado.<br />
              El productor coordinará la entrega.
            </p>
            <button className="qr-btn-pay" onClick={onClose} style={{ marginTop:'1rem' }}>
              <CheckCircle size={16} /> Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
