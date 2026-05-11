import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Search, Map, ShoppingCart, Package, User, MapPin } from 'lucide-react';
import './Dashboard.css';

export default function BuyerDashboard() {
  const { currentUser, logout } = useAuth();
  
  const firstName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Comprador';
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
          <div className="role-tag">Comprador</div>
          <div className="user-avatar">{initial}</div>
          <button className="logout-btn" onClick={logout}>Salir</button>
        </div>
      </nav>

      {/* Header */}
      <div className="dash-header dash-header-bg-buyer">
        <div className="header-content">
          <div className="panel-label">🛒 Panel del comprador</div>
          <h1>Buenas tardes, {firstName} 👋</h1>
          <p>Encuentra los mejores productos del campo cruceño, directo del productor</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="dash-main">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#eff6ff', color: '#2563eb'}}>🛒</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Pedidos activos</div>
            <div className="stat-desc">Sin pedidos en curso</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#ecfdf5', color: '#10b981'}}>🔍</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Productos vistos</div>
            <div className="stat-desc">Empieza a explorar</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fef3c7', color: '#d97706'}}>💰</div>
            <div className="stat-value">Bs 0</div>
            <div className="stat-title">Compras del mes</div>
            <div className="stat-desc">Mayo 2026</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#fef2f2', color: '#ef4444'}}>❤️</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Favoritos</div>
            <div className="stat-desc">Sin favoritos aún</div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button className="action-btn primary-buyer">
            <Search size={18} /> Buscar cosechas
          </button>
          <button className="action-btn">
            <Map size={18} color="#3b82f6" /> Mapa de productores
          </button>
          <button className="action-btn">
            <ShoppingCart size={18} color="#6b7280" /> Mi carrito
          </button>
          <button className="action-btn">
            <Package size={18} color="#ea580c" /> Rastrear pedido
          </button>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Area */}
          <div className="content-card">
            <div className="card-header">
              <h3>Cosechas disponibles</h3>
              <a href="#" className="card-link">Ver todas &rarr;</a>
            </div>
            
            <div className="tags-list">
              <button className="tag active">Todos</button>
              <button className="tag">Frutas</button>
              <button className="tag">Verduras</button>
              <button className="tag">Granos</button>
              <button className="tag">Lácteos</button>
            </div>

            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h4>Aún no hay cosechas disponibles</h4>
              <p>Cuando los productores publiquen, aparecerán aquí</p>
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
                  <h4>Creaste tu cuenta como Comprador</h4>
                  <p>Hace un momento</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon" style={{background: '#eff6ff'}}><MapPin size={16} color="#2563eb" /></div>
                <div className="activity-content">
                  <h4>Explora el mapa para encontrar productores cercanos</h4>
                  <p style={{color: '#2563eb'}}>Recomendado</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon" style={{background: '#f3f4f6'}}><ShoppingCart size={16} color="#9ca3af" /></div>
                <div className="activity-content">
                  <h4>Tu primer pedido aparecerá aquí</h4>
                  <p>Pendiente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
