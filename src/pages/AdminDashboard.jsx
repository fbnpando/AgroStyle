import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, LogOut,
  Check, X, Clock, ChevronRight, Shield, Menu
} from 'lucide-react';
import './AdminDashboard.css';

const ROLE_LABEL = { producer: 'Productor', transporter: 'Transportista', buyer: 'Comprador' };

function StatusBadge({ status }) {
  const map = {
    pending:  <span className="badge badge-warning">Pendiente</span>,
    approved: <span className="badge badge-success">Aprobado</span>,
    rejected: <span className="badge badge-danger">Rechazado</span>,
  };
  return map[status] ?? <span className="badge badge-secondary">—</span>;
}

function RejectInline({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="reject-inline">
      <input
        className="reject-input"
        type="text"
        placeholder="Motivo de rechazo (opcional)"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <button className="btn-sm btn-danger" onClick={() => onConfirm(reason)}>Confirmar</button>
      <button className="btn-sm btn-secondary" onClick={onCancel}>Cancelar</button>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [section, setSection]         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [pendingDocs, setPendingDocs]   = useState([]);
  const [allDocs, setAllDocs]           = useState([]);
  const [loading, setLoading]           = useState(true);

  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectingDocId, setRejectingDocId]   = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pendingSnap, allUsersSnap, pendingDocsSnap, allDocsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'users'), where('role', '!=', 'admin'))),
        getDocs(query(collection(db, 'documents'), where('status', '==', 'pending'))),
        getDocs(collection(db, 'documents')),
      ]);
      setPendingUsers(pendingSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAllUsers(allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPendingDocs(pendingDocsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAllDocs(allDocsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(userId) {
    await updateDoc(doc(db, 'users', userId), {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.uid,
    });
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
  }

  async function rejectUser(userId, reason) {
    await updateDoc(doc(db, 'users', userId), {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: currentUser.uid,
      rejectionReason: reason || 'Sin especificar',
    });
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    setRejectingUserId(null);
  }

  async function approveDoc(docId) {
    await updateDoc(doc(db, 'documents', docId), {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.uid,
    });
    setPendingDocs(prev => prev.filter(d => d.id !== docId));
    setAllDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'approved' } : d));
  }

  async function rejectDoc(docId, reason) {
    await updateDoc(doc(db, 'documents', docId), {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.uid,
      rejectionReason: reason || 'Sin especificar',
    });
    setPendingDocs(prev => prev.filter(d => d.id !== docId));
    setAllDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected' } : d));
    setRejectingDocId(null);
  }

  const approvedCount = allUsers.filter(u => u.status === 'approved').length;

  const sectionTitle = { dashboard: 'Dashboard', users: 'Usuarios', documents: 'Documentos' };

  return (
    <div className="aw">
      {/* Sidebar */}
      <aside className={`aw-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="aw-brand">
          <Shield size={18} />
          <span>AgroStyle Admin</span>
        </div>

        <nav className="aw-nav">
          {[
            { key: 'dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard', badge: 0 },
            { key: 'users',     icon: <Users size={17} />,           label: 'Usuarios',  badge: pendingUsers.length },
            { key: 'documents', icon: <FileText size={17} />,        label: 'Documentos',badge: pendingDocs.length },
          ].map(item => (
            <button
              key={item.key}
              className={`aw-nav-item ${section === item.key ? 'active' : ''}`}
              onClick={() => setSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && <span className="aw-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="aw-sidebar-footer">
          <button className="aw-nav-item" onClick={logout}>
            <LogOut size={17} /><span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* Right panel */}
      <div className="aw-right">
        {/* Topbar */}
        <header className="aw-topbar">
          <button className="aw-toggle" onClick={() => setSidebarOpen(o => !o)}>
            <Menu size={20} />
          </button>
          <div className="aw-breadcrumb">
            <span>Admin</span>
            <ChevronRight size={13} />
            <span className="bc-current">{sectionTitle[section]}</span>
          </div>
          <div className="aw-topbar-user">
            <div className="aw-avatar">A</div>
            <span>Administrador</span>
          </div>
        </header>

        {/* Content */}
        <main className="aw-content">

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <>
              <div className="aw-page-header">
                <h1>Dashboard</h1>
                <p>Resumen del sistema</p>
              </div>

              <div className="aw-info-row">
                <div className="info-box ib-yellow">
                  <Clock size={26} className="ib-icon" />
                  <div><div className="ib-num">{pendingUsers.length}</div><div className="ib-label">Usuarios pendientes</div></div>
                </div>
                <div className="info-box ib-green">
                  <Check size={26} className="ib-icon" />
                  <div><div className="ib-num">{approvedCount}</div><div className="ib-label">Usuarios aprobados</div></div>
                </div>
                <div className="info-box ib-blue">
                  <FileText size={26} className="ib-icon" />
                  <div><div className="ib-num">{pendingDocs.length}</div><div className="ib-label">Documentos pendientes</div></div>
                </div>
                <div className="info-box ib-teal">
                  <Users size={26} className="ib-icon" />
                  <div><div className="ib-num">{allUsers.length}</div><div className="ib-label">Total usuarios</div></div>
                </div>
              </div>

              {pendingUsers.length > 0 && (
                <Card title="Solicitudes de acceso pendientes" action={{ label: 'Ver todos', onClick: () => setSection('users') }}>
                  <UsersTable
                    users={pendingUsers.slice(0, 5)}
                    showActions
                    rejectingId={rejectingUserId}
                    onApprove={approveUser}
                    onRejectClick={setRejectingUserId}
                    onRejectConfirm={rejectUser}
                    onRejectCancel={() => setRejectingUserId(null)}
                  />
                </Card>
              )}

              {pendingDocs.length > 0 && (
                <Card title="Documentos pendientes de revision" action={{ label: 'Ver todos', onClick: () => setSection('documents') }}>
                  <DocsTable
                    docs={pendingDocs.slice(0, 5)}
                    showActions
                    rejectingId={rejectingDocId}
                    onApprove={approveDoc}
                    onRejectClick={setRejectingDocId}
                    onRejectConfirm={rejectDoc}
                    onRejectCancel={() => setRejectingDocId(null)}
                  />
                </Card>
              )}

              {pendingUsers.length === 0 && pendingDocs.length === 0 && !loading && (
                <Card title="">
                  <p className="empty-msg">No hay solicitudes pendientes.</p>
                </Card>
              )}
            </>
          )}

          {/* ── USUARIOS ── */}
          {section === 'users' && (
            <>
              <div className="aw-page-header">
                <h1>Gestion de usuarios</h1>
                <p>Aprueba o rechaza solicitudes de productores y transportistas</p>
              </div>

              {pendingUsers.length > 0 && (
                <Card title="Solicitudes pendientes" badge={pendingUsers.length} badgeClass="badge-warning">
                  <UsersTable
                    users={pendingUsers}
                    showStatus
                    showActions
                    rejectingId={rejectingUserId}
                    onApprove={approveUser}
                    onRejectClick={setRejectingUserId}
                    onRejectConfirm={rejectUser}
                    onRejectCancel={() => setRejectingUserId(null)}
                  />
                </Card>
              )}

              <Card title="Todos los usuarios">
                {loading ? (
                  <p className="loading-msg">Cargando...</p>
                ) : allUsers.length === 0 ? (
                  <p className="empty-msg">No hay usuarios registrados.</p>
                ) : (
                  <UsersTable users={allUsers} showStatus />
                )}
              </Card>
            </>
          )}

          {/* ── DOCUMENTOS ── */}
          {section === 'documents' && (
            <>
              <div className="aw-page-header">
                <h1>Validacion de documentos</h1>
                <p>Revisa y aprueba los archivos enviados por los productores</p>
              </div>

              {pendingDocs.length > 0 && (
                <Card title="Pendientes de revision" badge={pendingDocs.length} badgeClass="badge-warning">
                  <DocsTable
                    docs={pendingDocs}
                    showActions
                    rejectingId={rejectingDocId}
                    onApprove={approveDoc}
                    onRejectClick={setRejectingDocId}
                    onRejectConfirm={rejectDoc}
                    onRejectCancel={() => setRejectingDocId(null)}
                  />
                </Card>
              )}

              <Card title="Historial de documentos">
                {loading ? (
                  <p className="loading-msg">Cargando...</p>
                ) : allDocs.length === 0 ? (
                  <p className="empty-msg">Aun no se han enviado documentos.</p>
                ) : (
                  <DocsTable docs={allDocs} showStatus />
                )}
              </Card>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Card({ title, children, action, badge, badgeClass }) {
  return (
    <div className="aw-card">
      {title !== '' && (
        <div className="aw-card-head">
          <span className="aw-card-title">
            {title}
            {badge > 0 && <span className={`badge ${badgeClass}`} style={{ marginLeft: '0.5rem' }}>{badge}</span>}
          </span>
          {action && (
            <button className="aw-link-btn" onClick={action.onClick}>{action.label}</button>
          )}
        </div>
      )}
      <div className="aw-card-body">{children}</div>
    </div>
  );
}

function UsersTable({ users, showStatus, showActions, rejectingId, onApprove, onRejectClick, onRejectConfirm, onRejectCancel }) {
  return (
    <table className="aw-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Fecha</th>
          {showStatus && <th>Estado</th>}
          {showActions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id}>
            <td>
              <div className="user-cell">
                <div className="aw-avatar-sm">{u.fullName?.charAt(0)?.toUpperCase() ?? '?'}</div>
                <div>
                  <div className="cell-name">{u.fullName}</div>
                  <div className="cell-sub">{u.email}</div>
                </div>
              </div>
            </td>
            <td>{ROLE_LABEL[u.role] ?? u.role}</td>
            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-BO') : '—'}</td>
            {showStatus && <td><StatusBadge status={u.status} /></td>}
            {showActions && (
              <td>
                <div className="aw-actions">
                  <button className="btn-sm btn-success" onClick={() => onApprove(u.id)}>
                    <Check size={13} /> Aprobar
                  </button>
                  <button className="btn-sm btn-danger" onClick={() => onRejectClick(u.id)}>
                    <X size={13} /> Rechazar
                  </button>
                </div>
                {rejectingId === u.id && (
                  <RejectInline
                    onConfirm={reason => onRejectConfirm(u.id, reason)}
                    onCancel={onRejectCancel}
                  />
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocsTable({ docs, showStatus, showActions, rejectingId, onApprove, onRejectClick, onRejectConfirm, onRejectCancel }) {
  return (
    <table className="aw-table">
      <thead>
        <tr>
          <th>Documento</th>
          <th>Productor</th>
          <th>Fecha</th>
          {showStatus && <th>Estado</th>}
          {showActions && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {docs.map(d => (
          <tr key={d.id}>
            <td>
              <div className="cell-name">{d.title}</div>
              {d.description && <div className="cell-sub">{d.description}</div>}
            </td>
            <td>{d.producerName ?? '—'}</td>
            <td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('es-BO') : '—'}</td>
            {showStatus && <td><StatusBadge status={d.status} /></td>}
            {showActions && (
              <td>
                <div className="aw-actions">
                  {d.fileUrl && (
                    <a className="btn-sm btn-primary" href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                      Ver archivo
                    </a>
                  )}
                  <button className="btn-sm btn-success" onClick={() => onApprove(d.id)}>
                    <Check size={13} /> Aprobar
                  </button>
                  <button className="btn-sm btn-danger" onClick={() => onRejectClick(d.id)}>
                    <X size={13} /> Rechazar
                  </button>
                </div>
                {rejectingId === d.id && (
                  <RejectInline
                    onConfirm={reason => onRejectConfirm(d.id, reason)}
                    onCancel={onRejectCancel}
                  />
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
