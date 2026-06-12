import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listProfiles, approveProfile, rejectProfile,
} from '../services/profiles';
import {
  listAllDocuments, listPendingDocuments,
  approveDocument, rejectDocument,
} from '../services/documents';
import { Check, X } from 'lucide-react';
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
  const [section, setSection] = useState('dashboard');

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
      const [pending, all, pendingD, allD] = await Promise.all([
        listProfiles({ status: 'pending' }),
        listProfiles({ excludeRole: 'admin' }),
        listPendingDocuments(),
        listAllDocuments(),
      ]);
      setPendingUsers(pending);
      setAllUsers(all);
      setPendingDocs(pendingD);
      setAllDocs(allD);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(userId) {
    await approveProfile(userId, currentUser.id);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
  }

  async function rejectUser(userId, reason) {
    await rejectProfile(userId, currentUser.id, reason);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
    setRejectingUserId(null);
  }

  async function approveDoc(docId) {
    await approveDocument(docId, currentUser.id);
    setPendingDocs(prev => prev.filter(d => d.id !== docId));
    setAllDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'approved' } : d));
  }

  async function rejectDoc(docId, reason) {
    await rejectDocument(docId, currentUser.id, reason);
    setPendingDocs(prev => prev.filter(d => d.id !== docId));
    setAllDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'rejected' } : d));
    setRejectingDocId(null);
  }

  const approvedCount = allUsers.filter(u => u.status === 'approved').length;

  return (
    <div className="aw">
      <nav className="aw-navbar">
        <span className="aw-brand">AgroStyle Admin</span>
        <div className="aw-nav-links">
          <button className={`aw-nav-btn ${section === 'dashboard' ? 'active' : ''}`} onClick={() => setSection('dashboard')}>
            Dashboard
          </button>
          <button className={`aw-nav-btn ${section === 'users' ? 'active' : ''}`} onClick={() => setSection('users')}>
            Usuarios {pendingUsers.length > 0 && <span className="aw-nav-badge">{pendingUsers.length}</span>}
          </button>
          <button className={`aw-nav-btn ${section === 'documents' ? 'active' : ''}`} onClick={() => setSection('documents')}>
            Documentos {pendingDocs.length > 0 && <span className="aw-nav-badge">{pendingDocs.length}</span>}
          </button>
        </div>
        <button className="aw-logout-btn" onClick={logout}>Cerrar sesion</button>
      </nav>

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
                <div><div className="ib-num">{pendingUsers.length}</div><div className="ib-label">Usuarios pendientes</div></div>
              </div>
              <div className="info-box ib-green">
                <div><div className="ib-num">{approvedCount}</div><div className="ib-label">Usuarios aprobados</div></div>
              </div>
              <div className="info-box ib-blue">
                <div><div className="ib-num">{pendingDocs.length}</div><div className="ib-label">Documentos pendientes</div></div>
              </div>
              <div className="info-box ib-teal">
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
  );
}

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
