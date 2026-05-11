import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, LogOut, Mail, CheckCircle } from 'lucide-react';
import './PendingApproval.css';

const ROLE_LABEL = { producer: 'Productor', transporter: 'Transportista' };

export default function PendingApproval() {
  const { currentUser, userData, logout, userStatus } = useAuth();

  const isRejected = userStatus === 'rejected';

  return (
    <div className="pp-page">
      <div className="pp-card">
        <div className={`pp-icon-wrap ${isRejected ? 'rejected' : ''}`}>
          <Clock size={28} />
        </div>

        <h1 className="pp-title">
          {isRejected ? 'Solicitud rechazada' : 'Cuenta en revision'}
        </h1>

        {isRejected ? (
          <>
            <p className="pp-text">
              Tu solicitud de registro como{' '}
              <strong>{ROLE_LABEL[userData?.role] ?? userData?.role}</strong> no fue aprobada.
            </p>
            {userData?.rejectionReason && (
              <div className="pp-reason">
                <strong>Motivo:</strong> {userData.rejectionReason}
              </div>
            )}
            <p className="pp-sub">Contacta al administrador para mas informacion.</p>
          </>
        ) : (
          <p className="pp-text">
            Tu solicitud como{' '}
            <strong>{ROLE_LABEL[userData?.role] ?? userData?.role}</strong> esta siendo
            revisada. Te notificaremos cuando el administrador tome una decision.
          </p>
        )}

        <div className="pp-meta">
          <Mail size={14} />
          <span>{currentUser?.email}</span>
        </div>

        <div className="pp-steps">
          <Step label="Cuenta creada" done />
          <Step label="Revision del administrador" done={userStatus === 'approved'} rejected={isRejected} />
          <Step label="Acceso al panel" done={userStatus === 'approved'} />
        </div>

        <button className="pp-logout" onClick={logout}>
          <LogOut size={15} /> Cerrar sesion
        </button>
      </div>
    </div>
  );
}

function Step({ label, done, rejected }) {
  return (
    <div className={`pp-step ${done ? 'done' : ''} ${rejected ? 'rejected' : ''}`}>
      <div className="pp-step-dot" />
      <span>{label}</span>
      {done && <CheckCircle size={14} className="pp-step-check" />}
    </div>
  );
}
