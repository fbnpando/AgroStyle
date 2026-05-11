import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Map, DollarSign, PenTool, CheckSquare, ClipboardList, Star, User, Truck } from 'lucide-react';
import './Dashboard.css';

export default function TransporterDashboard() {
  const { currentUser, logout } = useAuth();
  
  const firstName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Transportista';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-logo">
          <Leaf size={24} color="#1e5a36" />
          AgroStyle
        </div>
        <div className="dash-nav-right">
          <div className="role-tag">Transportista</div>
          <div className="user-avatar">{initial}</div>
          <button className="logout-btn" onClick={logout}>Salir</button>
        </div>
      </nav>

      {/* Header */}
      <div className="dash-header dash-header-bg-transporter">
        <div className="header-content">
          <div className="panel-label">🚚 Panel del transportista</div>
          <h1>Buenas tardes, {firstName} 👋</h1>
          <p>Acepta rutas, conecta el campo con el mercado y genera ingresos</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="dash-main">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#ecfdf5', color: '#10b981'}}>✅</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Rutas completadas</div>
            <div className="stat-desc">Sin entregas aún</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fff7ed', color: '#ea580c'}}>📋</div>
            <div className="stat-value" style={{color: '#ea580c'}}>3</div>
            <div className="stat-title">Rutas disponibles</div>
            <div className="stat-desc">En Santa Cruz ahora</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fef3c7', color: '#d97706'}}>💰</div>
            <div className="stat-value">Bs 0</div>
            <div className="stat-title">Ingresos del mes</div>
            <div className="stat-desc">Mayo 2026</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fefce8', color: '#eab308'}}>⭐</div>
            <div className="stat-value">—</div>
            <div className="stat-title">Calificación</div>
            <div className="stat-desc">Sin valoraciones</div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button className="action-btn primary-transporter">
            <ClipboardList size={18} /> Bolsa de carga
          </button>
          <button className="action-btn">
            <Map size={18} color="#3b82f6" /> Mi ruta activa
          </button>
          <button className="action-btn">
            <PenTool size={18} color="#ea580c" /> Firmar entrega
          </button>
          <button className="action-btn">
            <DollarSign size={18} color="#d97706" /> Mis ingresos
          </button>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Area */}
          <div className="content-card">
            <div className="card-header">
              <h3>Bolsa de carga</h3>
              <div className="badge-green">3 rutas disponibles</div>
            </div>
            
            <div className="route-list">
              <div className="route-item">
                <div className="route-info">
                  <div className="route-path">Montero &rarr; Mercado Abasto SC</div>
                  <div className="route-meta">
                    <span>📦 1.2 ton</span>
                    <span style={{color: '#ef4444'}}>📍 45 km</span>
                  </div>
                </div>
                <div className="route-action">
                  <div className="route-price">Bs 180</div>
                  <button className="btn-accept-route">Aceptar</button>
                </div>
              </div>

              <div className="route-item">
                <div className="route-info">
                  <div className="route-path">Warnes &rarr; Plan 3000</div>
                  <div className="route-meta">
                    <span>📦 800 kg</span>
                    <span style={{color: '#ef4444'}}>📍 30 km</span>
                  </div>
                </div>
                <div className="route-action">
                  <div className="route-price">Bs 120</div>
                  <button className="btn-accept-route">Aceptar</button>
                </div>
              </div>

              <div className="route-item">
                <div className="route-info">
                  <div className="route-path">La Guardia &rarr; Mercado Los Pozos</div>
                  <div className="route-meta">
                    <span>📦 500 kg</span>
                    <span style={{color: '#ef4444'}}>📍 15 km</span>
                  </div>
                </div>
                <div className="route-action">
                  <div className="route-price">Bs 75</div>
                  <button className="btn-accept-route">Aceptar</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="content-card">
            <div className="card-header">
              <h3>Actividad reciente</h3>
            </div>
            
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon"><User size={16} color="#4b5563" /></div>
                <div className="activity-content">
                  <h4>Creaste tu cuenta como Transportista</h4>
                  <p>Hace un momento</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon" style={{background: '#ecfdf5'}}><ClipboardList size={16} color="#10b981" /></div>
                <div className="activity-content">
                  <h4>Hay 3 rutas disponibles en Santa Cruz</h4>
                  <p>Ahora</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon" style={{background: '#fff7ed'}}><Truck size={16} color="#ea580c" /></div>
                <div className="activity-content">
                  <h4>Acepta tu primera ruta para empezar a ganar</h4>
                  <p style={{color: '#ea580c'}}>Recomendado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
