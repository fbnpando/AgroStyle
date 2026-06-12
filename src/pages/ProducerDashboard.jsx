import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf, Package, Plus, MapPin, Phone, FileText, Upload,
  CheckCircle, Clock, XCircle, ArrowRight, DollarSign, Sprout,
  Edit3, Trash2, Calendar,
} from 'lucide-react';
import AddFarmModal from '../components/AddFarmModal';
import ProductFormModal from '../components/ProductFormModal';
import { listProducerProducts, isPreorder } from '../services/products';
import { listProducerFarms, deleteFarm } from '../services/farms';
import { listProducerDocuments, createDocument } from '../services/documents';
import { uploadFile } from '../services/uploads';
import ProductCard from '../components/ProductCard';
import './Dashboard.css';

export default function ProducerDashboard() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [showFarmModal, setShowFarmModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Documents upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const firstName =
    userData?.fullName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Productor';
  const initial = firstName.charAt(0).toUpperCase();

  const activeProducts = products.filter((p) => p.status === 'active');
  const preorderProducts = activeProducts.filter((p) => isPreorder(p));

  useEffect(() => {
    if (!currentUser) return;
    fetchFarms();
    fetchDocuments();
    fetchProducts();
  }, [currentUser]);

  async function fetchFarms() {
    try {
      const list = await listProducerFarms(currentUser.id);
      setFarms(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFarms(false);
    }
  }

  async function fetchProducts() {
    try {
      const list = await listProducerProducts(currentUser.id);
      setProducts(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchDocuments() {
    try {
      const list = await listProducerDocuments(currentUser.id);
      setDocuments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) {
      setUploadError('El título y el archivo son obligatorios.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fileUrl = await uploadFile(docFile, `documents/${currentUser.id}`);
      const saved = await createDocument({
        producerId:   currentUser.id,
        producerName: userData?.fullName || currentUser.email,
        title:        docTitle.trim(),
        description:  docDesc.trim(),
        fileName:     docFile.name,
        fileUrl,
        status:       'pending',
      });
      setDocuments((prev) => [saved, ...prev]);
      setDocTitle('');
      setDocDesc('');
      setDocFile(null);
      setShowUploadForm(false);
    } catch (err) {
      console.error(err);
      setUploadError('Error al subir el archivo: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  }

  function handleCTAPublicar() {
    if (!farms.length) {
      setEditingFarm(null);
      setShowFarmModal(true);
      return;
    }
    setShowProductModal(true);
  }

  function openNewFarm() {
    setEditingFarm(null);
    setShowFarmModal(true);
  }

  function openEditFarm(farm) {
    setEditingFarm(farm);
    setShowFarmModal(true);
  }

  async function handleDeleteFarm(farm) {
    const linked = products.filter((p) => p.farmId === farm.id).length;
    const msg = linked > 0
      ? `Esta finca tiene ${linked} producto(s) vinculado(s). Si la eliminas, esos productos quedarán sin finca asignada. ¿Continuar?`
      : `¿Eliminar la finca "${farm.name}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(msg)) return;
    try {
      await deleteFarm(farm.id);
      setFarms((prev) => prev.filter((f) => f.id !== farm.id));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la finca: ' + (err.message || ''));
    }
  }

  // ============ Onboarding ============
  const steps = [
    {
      key: 'approved',
      done: true, // si llega al dashboard, fue aprobado
      title: 'Cuenta aprobada por el administrador',
      action: null,
    },
    {
      key: 'farm',
      done: farms.length > 0,
      title: farms.length
        ? `${farms.length} ${farms.length === 1 ? 'finca registrada' : 'fincas registradas'}`
        : 'Registra tu primera finca',
      action: farms.length ? null : { label: 'Añadir', onClick: () => setShowFarmModal(true) },
    },
    {
      key: 'product',
      done: activeProducts.length > 0,
      title: activeProducts.length
        ? `${activeProducts.length} cosecha${activeProducts.length === 1 ? '' : 's'} publicada${activeProducts.length === 1 ? '' : 's'}`
        : 'Publica tu primera cosecha',
      action: activeProducts.length
        ? null
        : { label: 'Publicar', onClick: handleCTAPublicar, disabled: !farms.length },
    },
  ];

  const stepsDone = steps.filter((s) => s.done).length;
  const showOnboarding = stepsDone < steps.length;

  // ============ Document status helpers ============
  const docStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle size={14} />;
    if (status === 'rejected') return <XCircle size={14} />;
    return <Clock size={14} />;
  };
  const docStatusLabel = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-logo">
          <Leaf size={24} color="#1e5a36" />
          AgroStyle
        </div>
        <div className="dash-nav-right">
          <div className="role-tag">Productor</div>
          <div className="user-avatar">{initial}</div>
          <button className="logout-btn" onClick={logout}>Salir</button>
        </div>
      </nav>

      {/* Header */}
      <div className="dash-header dash-header-bg-producer">
        <div className="header-content">
          <div className="panel-label">🌱 Panel del productor</div>
          <h1>Hola {firstName} 👋</h1>
          <p>Tu plataforma para vender directo del campo al mercado cruceño.</p>

          <div className="header-pills">
            <span className="header-pill">
              <span className="header-pill-dot" />
              <strong>{activeProducts.length}</strong>
              {activeProducts.length === 1 ? ' cosecha activa' : ' cosechas activas'}
            </span>
            <span className="header-pill">
              📅 <strong>{preorderProducts.length}</strong> en preventa
            </span>
            <span className="header-pill">
              📍 <strong>{farms.length}</strong>
              {farms.length === 1 ? ' finca' : ' fincas'}
            </span>
          </div>
        </div>
      </div>

      <main className="dash-main">
        {/* Onboarding adaptativo */}
        {showOnboarding && (
          <div className="onboarding-card">
            <div className="onboarding-head">
              <div className="onboarding-title">Configura tu cuenta</div>
              <div className="onboarding-progress">
                <span>{stepsDone}/{steps.length}</span>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(stepsDone / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {steps.map((s) => (
              <div key={s.key} className={`onboarding-step ${s.done ? 'done' : 'pending'}`}>
                <div className="onboarding-step-icon">
                  {s.done ? <CheckCircle size={16} /> : <Clock size={16} />}
                </div>
                <div className="onboarding-step-text">{s.title}</div>
                {s.action && (
                  <button
                    className="onboarding-step-action"
                    onClick={s.action.onClick}
                    disabled={s.action.disabled}
                    title={s.action.disabled ? 'Registra una finca primero' : undefined}
                    style={s.action.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    {s.action.label} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA grande */}
        <button className="cta-big producer" onClick={handleCTAPublicar}>
          <Plus size={20} />
          {farms.length ? 'Publicar cosecha' : 'Registra tu finca para empezar'}
        </button>

        {/* Stat cards (visibles cuando ya configuró todo) */}
        {!showOnboarding && (
          <div className="modern-stats">
            <div className="modern-stat ms-green">
              <div className="modern-stat-icon"><Sprout size={20} /></div>
              <div className="modern-stat-value">{activeProducts.length}</div>
              <div className="modern-stat-label">Cosechas activas</div>
            </div>
            <div className="modern-stat ms-orange">
              <div className="modern-stat-icon"><Calendar size={20} /></div>
              <div className="modern-stat-value">{preorderProducts.length}</div>
              <div className="modern-stat-label">En preventa</div>
            </div>
            <div className="modern-stat ms-blue">
              <div className="modern-stat-icon"><MapPin size={20} /></div>
              <div className="modern-stat-value">{farms.length}</div>
              <div className="modern-stat-label">
                {farms.length === 1 ? 'Finca registrada' : 'Fincas registradas'}
              </div>
            </div>
            <div className="modern-stat ms-purple">
              <div className="modern-stat-icon"><DollarSign size={20} /></div>
              <div className="modern-stat-value">Bs 0</div>
              <div className="modern-stat-label">Ingresos del mes</div>
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="quick-actions">
          <button className="quick-action" onClick={() => navigate('/my-products')}>
            <div className="quick-action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Package size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-title">Mis productos</span>
              <span className="quick-action-desc">Gestionar inventario</span>
            </div>
          </button>
          <button className="quick-action" onClick={openNewFarm}>
            <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-title">Añadir finca</span>
              <span className="quick-action-desc">Nueva ubicación</span>
            </div>
          </button>
          <button className="quick-action" onClick={() => { setShowUploadForm(true); setUploadError(''); }}>
            <div className="quick-action-icon" style={{ background: '#fef3c7', color: '#ca8a04' }}>
              <FileText size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-title">Subir documento</span>
              <span className="quick-action-desc">Validar con admin</span>
            </div>
          </button>
          <button className="quick-action" onClick={() => navigate('/producer-orders')}>
            <div className="quick-action-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <DollarSign size={20} />
            </div>
            <div className="quick-action-text">
              <span className="quick-action-title">Mis pedidos</span>
              <span className="quick-action-desc">Confirmar ventas</span>
            </div>
          </button>
        </div>

        {/* Tus cosechas activas */}
        <section className="product-section">
          <div className="section-head">
            <h3>Tus cosechas activas</h3>
            {activeProducts.length > 0 && (
              <button
                className="section-head-link"
                onClick={() => navigate('/my-products')}
              >
                Ver todas <ArrowRight size={14} />
              </button>
            )}
          </div>

          {activeProducts.length === 0 ? (
            <div className="content-card">
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">🌾</div>
                <h4>Aún no tienes cosechas publicadas</h4>
                <p>
                  {farms.length
                    ? 'Publica tu primera cosecha para aparecer en el marketplace.'
                    : 'Registra una finca primero, luego podrás publicar.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="product-scroller">
              {activeProducts.slice(0, 8).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => navigate('/my-products')}
                />
              ))}
            </div>
          )}

          {preorderProducts.length > 0 && (
            <div style={{ marginTop: '0.85rem', fontSize: '0.85rem', color: '#6b7280' }}>
              <strong>{preorderProducts.length}</strong> en preventa para fechas futuras
            </div>
          )}
        </section>

        {/* Fincas + Documentos en dos columnas */}
        <div className="dual-grid" style={{ paddingBottom: '3rem' }}>
          {/* Fincas */}
          <div className="content-card">
            <div className="card-header">
              <h3>Mis fincas {farms.length > 0 && `(${farms.length})`}</h3>
              <button className="card-inline-btn producer" onClick={openNewFarm}>
                <Plus size={14} /> Añadir
              </button>
            </div>

            {loadingFarms ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando…</p>
            ) : farms.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                <div className="empty-state-icon">🌱</div>
                <p>Sin fincas registradas</p>
              </div>
            ) : (
              farms.map((farm) => {
                const productCount = products.filter((p) => p.farmId === farm.id).length;
                return (
                  <div key={farm.id} className="farm-card">
                    <div className="farm-card-head">
                      <div className="farm-card-map-pin">
                        <MapPin size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div className="farm-card-title">{farm.name}</div>
                          <span className="status-badge approved">Activa</span>
                        </div>
                        <div className="farm-card-meta">
                          {farm.zone && <span><MapPin size={12} /> {farm.zone}</span>}
                          {farm.phone && <span><Phone size={12} /> {farm.phone}</span>}
                          <span><Package size={12} /> {productCount} {productCount === 1 ? 'producto' : 'productos'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="farm-card-actions">
                      <button className="farm-action-btn edit" onClick={() => openEditFarm(farm)}>
                        <Edit3 size={13} /> Editar
                      </button>
                      <button className="farm-action-btn delete" onClick={() => handleDeleteFarm(farm)}>
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Documentos */}
          <div className="content-card">
            <div className="card-header">
              <h3>Mis documentos {documents.length > 0 && `(${documents.length})`}</h3>
              <button
                className="card-inline-btn buyer"
                onClick={() => { setShowUploadForm((v) => !v); setUploadError(''); }}
              >
                <Upload size={14} /> Subir
              </button>
            </div>

            {showUploadForm && (
              <form
                onSubmit={handleUpload}
                style={{
                  padding: '1rem', marginBottom: '0.85rem', background: '#f9fafb',
                  borderRadius: '10px', border: '1px solid #e5e7eb',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
              >
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Título (ej. Certificado sanitario)"
                  required
                  style={{
                    padding: '0.55rem 0.8rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif',
                  }}
                />
                <input
                  type="text"
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="Descripción (opcional)"
                  style={{
                    padding: '0.55rem 0.8rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif',
                  }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setDocFile(e.target.files[0] || null)}
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}
                />
                {uploadError && (
                  <p style={{ color: '#dc3545', fontSize: '0.8rem', margin: 0 }}>{uploadError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      background: '#1e5a36', color: 'white', border: 'none',
                      padding: '0.5rem 1.1rem', borderRadius: '6px', fontWeight: 600,
                      fontSize: '0.85rem', cursor: uploading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Outfit, sans-serif', opacity: uploading ? 0.7 : 1,
                    }}
                  >
                    {uploading ? 'Subiendo…' : 'Enviar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowUploadForm(false); setUploadError(''); }}
                    style={{
                      background: 'none', border: '1px solid #d1d5db', color: '#6b7280',
                      padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600,
                      fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {loadingDocs ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando…</p>
            ) : documents.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                <div className="empty-state-icon">
                  <FileText size={32} color="#d1d5db" />
                </div>
                <p>Sin documentos enviados</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="compact-row">
                  <div className="compact-row-main">
                    <div className="compact-row-icon">
                      <FileText size={16} />
                    </div>
                    <div className="compact-row-info">
                      <div className="compact-row-title">{doc.title}</div>
                      <div className="compact-row-sub">
                        {doc.uploadedAt && (
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString('es-BO')}
                          </span>
                        )}
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <span style={{ color: '#dc2626' }}>— {doc.rejectionReason}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge ${doc.status}`}>
                    {docStatusIcon(doc.status)}
                    {docStatusLabel[doc.status] ?? doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showFarmModal && (
        <AddFarmModal
          farm={editingFarm}
          onClose={() => { setShowFarmModal(false); setEditingFarm(null); }}
          onFarmAdded={(newFarm) => setFarms((prev) => [newFarm, ...prev])}
          onFarmUpdated={(updated) =>
            setFarms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
          }
        />
      )}
      {showProductModal && (
        <ProductFormModal
          farms={farms}
          onClose={() => setShowProductModal(false)}
          onSaved={(saved) => setProducts((p) => [saved, ...p])}
        />
      )}
    </div>
  );
}
