import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listProducerOrders, confirmOrder, rejectOrder,
  ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
} from '../services/orders';
import './ProducerOrders.css';

const TABS = [
  { id: 'all',                   label: 'Todos' },
  { id: 'pending_confirmation',  label: 'Pendientes' },
  { id: 'confirmed',             label: 'Confirmados' },
  { id: 'paid',                  label: 'Pagados' },
  { id: 'rejected',              label: 'Rechazados' },
];

export default function ProducerOrders() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');

  const [rejectingId,     setRejectingId]     = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actioning,       setActioning]       = useState(null); // orderId

  useEffect(() => { if (currentUser) load(); }, [currentUser]);

  async function load() {
    setLoading(true);
    try {
      const list = await listProducerOrders(currentUser.id);
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(orderId) {
    setActioning(orderId);
    try {
      const updated = await confirmOrder(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
    } catch (err) {
      alert(err.message);
    } finally {
      setActioning(null);
    }
  }

  async function handleReject(orderId) {
    if (!rejectionReason.trim()) return;
    setActioning(orderId);
    try {
      const updated = await rejectOrder(orderId, rejectionReason.trim());
      setOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
      setRejectingId(null);
      setRejectionReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActioning(null);
    }
  }

  const visible = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  function tabCount(id) {
    return id === 'all' ? orders.length : orders.filter((o) => o.status === id).length;
  }

  return (
    <div className="po-layout">
      <nav className="po-navbar">
        <button className="po-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Panel
        </button>
        <div className="po-logo">
          <Leaf size={20} color="#1e5a36" /> AgroStyle
        </div>
        <button className="po-back" onClick={logout}>Salir</button>
      </nav>

      <main className="po-main">
        <div className="po-title">Pedidos recibidos</div>
        <div className="po-subtitle">Confirma o rechaza los pedidos de compradores.</div>

        <div className="po-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`po-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="po-tab-badge">{tabCount(t.id)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="po-empty"><Loader2 size={22} className="mk-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="po-empty">
            <Package size={42} color="#d1d5db" />
            <h4>Sin pedidos</h4>
            <p style={{ fontSize:'0.85rem' }}>
              {tab === 'all' ? 'Aún no has recibido pedidos.' : `Sin pedidos en estado "${ORDER_STATUS_LABEL[tab] ?? tab}".`}
            </p>
          </div>
        ) : (
          visible.map((order) => (
            <div key={order.id} className="po-order-card">
              <div className="po-order-head">
                <div>
                  <div className="po-order-id">#{order.id.slice(0,8).toUpperCase()}</div>
                  <div className="po-order-buyer">{order.buyerName}</div>
                  <div className="po-order-date">
                    {new Date(order.createdAt).toLocaleDateString('es-BO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
                <span className={`po-badge ${ORDER_STATUS_COLOR[order.status] ?? 'info'}`}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="po-order-items">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="po-item-row">
                    <span>
                      {item.productName} × {item.quantity} {item.unit}
                      {item.isPreorder && <em style={{ color:'#ea580c', fontSize:'0.75rem' }}> (preventa)</em>}
                    </span>
                    <span>Bs {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="po-notes-row">Nota: {order.notes}</div>
              )}
              {order.rejectionReason && (
                <div className="po-rejection-reason">
                  Motivo rechazo: {order.rejectionReason}
                </div>
              )}

              <div className="po-order-foot">
                <div className="po-total">
                  <small>Total</small>Bs {Number(order.total).toFixed(2)}
                </div>
                {order.status === 'pending_confirmation' && (
                  <div className="po-actions">
                    <button
                      className="po-btn-confirm"
                      onClick={() => handleConfirm(order.id)}
                      disabled={actioning === order.id}
                    >
                      <CheckCircle size={14} />
                      {actioning === order.id ? 'Procesando…' : 'Confirmar'}
                    </button>
                    <button
                      className="po-btn-reject"
                      onClick={() => {
                        setRejectingId(rejectingId === order.id ? null : order.id);
                        setRejectionReason('');
                      }}
                    >
                      <XCircle size={14} /> Rechazar
                    </button>
                  </div>
                )}
              </div>

              {rejectingId === order.id && (
                <div className="po-rejection-form">
                  <textarea
                    placeholder="Motivo del rechazo (requerido)…"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="po-rejection-form-btns">
                    <button
                      className="po-btn-sm-danger"
                      onClick={() => handleReject(order.id)}
                      disabled={!rejectionReason.trim() || actioning === order.id}
                    >
                      {actioning === order.id ? 'Rechazando…' : 'Confirmar rechazo'}
                    </button>
                    <button
                      className="po-btn-sm-cancel"
                      onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
