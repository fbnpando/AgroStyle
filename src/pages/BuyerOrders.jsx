import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Package, QrCode, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listBuyerOrders, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../services/orders';
import QRPaymentModal from '../components/QRPaymentModal';
import './BuyerOrders.css';

const TABS = [
  { id: 'all',                  label: 'Todos' },
  { id: 'pending_confirmation', label: 'Pendientes' },
  { id: 'confirmed',            label: 'Por pagar' },
  { id: 'paid',                 label: 'Pagados' },
  { id: 'rejected',             label: 'Rechazados' },
];

export default function BuyerOrders() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');
  const [payingOrder, setPayingOrder] = useState(null);

  useEffect(() => { if (currentUser) load(); }, [currentUser]);

  async function load() {
    setLoading(true);
    try {
      const list = await listBuyerOrders(currentUser.id);
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePaid(updated) {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setPayingOrder(null);
  }

  const visible = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  function tabCount(id) {
    return id === 'all' ? orders.length : orders.filter((o) => o.status === id).length;
  }

  return (
    <div className="bo-layout">
      <nav className="bo-navbar">
        <button className="bo-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Panel
        </button>
        <div className="bo-logo">
          <Leaf size={20} color="#1e5a36" /> AgroStyle
        </div>
        <button className="bo-back" onClick={logout}>Salir</button>
      </nav>

      <main className="bo-main">
        <div className="bo-title">Mis pedidos</div>
        <div className="bo-subtitle">Seguí el estado de tus compras.</div>

        <div className="bo-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`bo-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="bo-tab-badge">{tabCount(t.id)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bo-empty"><Loader2 size={22} className="mk-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="bo-empty">
            <Package size={42} color="#d1d5db" />
            <h4>Sin pedidos</h4>
            <p style={{ fontSize:'0.85rem' }}>
              {tab === 'all'
                ? 'Todavía no realizaste ningún pedido. ¡Explorá el marketplace!'
                : `Sin pedidos en estado "${ORDER_STATUS_LABEL[tab] ?? tab}".`}
            </p>
            {tab === 'all' && (
              <button
                onClick={() => navigate('/marketplace')}
                style={{ marginTop:'0.75rem', padding:'0.55rem 1.2rem', background:'#1e5a36',
                  color:'#fff', border:'none', borderRadius:'8px', fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', fontSize:'0.88rem' }}
              >
                Ir al marketplace
              </button>
            )}
          </div>
        ) : (
          visible.map((order) => (
            <div key={order.id} className="bo-order-card">
              <div className="bo-order-head">
                <div>
                  <div className="bo-order-id">#{order.id.slice(0,8).toUpperCase()}</div>
                  <div className="bo-order-producer">{order.producerName}</div>
                  <div className="bo-order-date">
                    {new Date(order.createdAt).toLocaleDateString('es-BO', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <span className={`bo-badge ${ORDER_STATUS_COLOR[order.status] ?? 'info'}`}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="bo-order-items">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="bo-item-row">
                    <span>
                      {item.productName} × {item.quantity} {item.unit}
                      {item.isPreorder && <em style={{ color:'#ea580c', fontSize:'0.75rem' }}> (preventa)</em>}
                    </span>
                    <span>Bs {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.status === 'pending_confirmation' && (
                <div className="bo-status-note">
                  Esperando confirmación del productor…
                </div>
              )}
              {order.rejectionReason && (
                <div className="bo-rejection-reason">
                  Rechazado: {order.rejectionReason}
                </div>
              )}

              <div className="bo-order-foot">
                <div className="bo-total">
                  <small>Total</small>Bs {Number(order.total).toFixed(2)}
                </div>
                {order.status === 'confirmed' && (
                  <button className="bo-btn-pay" onClick={() => setPayingOrder(order)}>
                    <QrCode size={15} /> Pagar con QR
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {payingOrder && (
        <QRPaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}
