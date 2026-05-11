import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Leaf, Package, ShoppingCart, DollarSign, User, BookOpen, Plus, MapPin, Phone, FileText, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import AddFarmModal from '../components/AddFarmModal';
import './Dashboard.css';

export default function ProducerDashboard() {
  const { currentUser, logout, userData } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const firstName = currentUser?.displayName || userData?.fullName || currentUser?.email?.split('@')[0] || 'Productor';
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!currentUser) return;
    fetchFarms();
    fetchDocuments();
  }, [currentUser]);

  async function fetchFarms() {
    try {
      const q = query(collection(db, 'farms'), where('producerId', '==', currentUser.uid));
      const snap = await getDocs(q);
      setFarms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFarms(false);
    }
  }

  async function fetchDocuments() {
    try {
      const q = query(collection(db, 'documents'), where('producerId', '==', currentUser.uid));
      const snap = await getDocs(q);
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) {
      setUploadError('El titulo y el archivo son obligatorios.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const storageRef = ref(storage, `documents/${currentUser.uid}/${Date.now()}_${docFile.name}`);
      await uploadBytes(storageRef, docFile);
      const fileUrl = await getDownloadURL(storageRef);

      const newDoc = {
        producerId: currentUser.uid,
        producerName: userData?.fullName || currentUser.email,
        title: docTitle.trim(),
        description: docDesc.trim(),
        fileName: docFile.name,
        fileUrl,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'documents'), newDoc);
      setDocuments(prev => [{ id: docRef.id, ...newDoc }, ...prev]);
      setDocTitle('');
      setDocDesc('');
      setDocFile(null);
      setShowUploadForm(false);
    } catch (err) {
      console.error(err);
      setUploadError('Error al subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  const handleFarmAdded = (newFarm) => {
    setFarms(prev => [...prev, newFarm]);
  };

  const docStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle size={15} color="#28a745" />;
    if (status === 'rejected') return <XCircle size={15} color="#dc3545" />;
    return <Clock size={15} color="#f39c12" />;
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
          <h1>Buenas tardes, {firstName} 👋</h1>
          <p>Tu plataforma para vender directo del campo al mercado cruceño</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="dash-main">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#f0fdf4', color: '#16a34a'}}>📦</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Cosechas publicadas</div>
            <div className="stat-desc">Sin publicaciones aún</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: '#eff6ff', color: '#2563eb'}}>🛒</div>
            <div className="stat-value">0</div>
            <div className="stat-title">Pedidos activos</div>
            <div className="stat-desc">Esperando compradores</div>
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
            <div className="stat-title">Valoración</div>
            <div className="stat-desc">Sin valoraciones aún</div>
          </div>
        </div>

        {/* Actions */}
        <div className="action-buttons">
          <button className="action-btn primary-producer">
            <Package size={18} /> Publicar cosecha
          </button>
          <button className="action-btn" onClick={() => setShowModal(true)}>
            <BookOpen size={18} color="#3b82f6" /> Mi finca
          </button>
          <button className="action-btn">
            <DollarSign size={18} color="#10b981" /> Ver mis ventas
          </button>
          <button className="action-btn">
            <div style={{width: 16, height: 16, border: '2px solid #06b6d4', borderRadius: 2}}></div> Cobrar con QR
          </button>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Area: Mis Fincas */}
          <div className="content-card">
            <div className="card-header">
              <h3>Mis Fincas</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', 
                  background: '#ecfdf5', color: '#059669', border: 'none', 
                  padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.9rem', 
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Añadir finca
              </button>
            </div>
            
            {loadingFarms ? (
              <div className="empty-state">
                <div style={{ animation: 'pulse 1.5s infinite', opacity: 0.5 }}>Cargando fincas...</div>
              </div>
            ) : farms.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {farms.map(farm => (
                  <div key={farm.id} style={{
                    padding: '1.2rem', border: '1px solid #e5e7eb', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '0.3rem' }}>{farm.name}</h4>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {farm.zone}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={14} /> {farm.phone}</span>
                      </div>
                    </div>
                    <div className="badge-green">Activa</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🌱</div>
                <h4>Aún no tienes fincas registradas</h4>
                <p>Añade tu primera finca para empezar a publicar cosechas.</p>
              </div>
            )}
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
                  <h4>Creaste tu cuenta en AgroStyle</h4>
                  <p>Hace un momento</p>
                </div>
              </div>
              
              {farms.length === 0 && (
                <div className="activity-item">
                  <div className="activity-icon" style={{background: '#fef9c3'}}><BookOpen size={16} color="#ca8a04" /></div>
                  <div className="activity-content">
                    <h4>Completa tu perfil de finca para aparecer en el mapa</h4>
                    <p>Pendiente</p>
                  </div>
                </div>
              )}
              
              <div className="activity-item">
                <div className="activity-icon" style={{background: '#ffedd5'}}><Package size={16} color="#ea580c" /></div>
                <div className="activity-content">
                  <h4>Publica tu primera cosecha para recibir pedidos</h4>
                  <p>Pendiente</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="content-card" style={{ marginBottom: '3rem' }}>
          <div className="card-header">
            <h3>Mis documentos</h3>
            <button
              onClick={() => { setShowUploadForm(v => !v); setUploadError(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#eff6ff', color: '#2563eb', border: 'none',
                padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.9rem',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Upload size={15} /> Subir documento
            </button>
          </div>

          {showUploadForm && (
            <form
              onSubmit={handleUpload}
              style={{
                padding: '1.2rem', marginBottom: '1rem', background: '#f9fafb',
                borderRadius: '10px', border: '1px solid #e5e7eb',
                display: 'flex', flexDirection: 'column', gap: '0.85rem'
              }}
            >
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Titulo del documento *
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Ej. Certificado sanitario"
                  required
                  style={{
                    width: '100%', padding: '0.55rem 0.8rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Descripcion (opcional)
                </label>
                <input
                  type="text"
                  value={docDesc}
                  onChange={e => setDocDesc(e.target.value)}
                  placeholder="Breve descripcion del documento"
                  style={{
                    width: '100%', padding: '0.55rem 0.8rem', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'Outfit, sans-serif'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Archivo *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => setDocFile(e.target.files[0] || null)}
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ fontSize: '0.855rem', fontFamily: 'Outfit, sans-serif' }}
                />
              </div>
              {uploadError && (
                <p style={{ color: '#dc3545', fontSize: '0.82rem' }}>{uploadError}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: '#1e5a36', color: 'white', border: 'none',
                    padding: '0.55rem 1.2rem', borderRadius: '6px', fontWeight: 600,
                    fontSize: '0.875rem', cursor: uploading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit, sans-serif', opacity: uploading ? 0.7 : 1
                  }}
                >
                  {uploading ? 'Subiendo...' : 'Enviar al administrador'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowUploadForm(false); setUploadError(''); }}
                  style={{
                    background: 'none', border: '1px solid #d1d5db', color: '#6b7280',
                    padding: '0.55rem 1rem', borderRadius: '6px', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {loadingDocs ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cargando documentos...</p>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={36} color="#d1d5db" /></div>
              <h4>Sin documentos enviados</h4>
              <p>Sube tus documentos para que el administrador los valide.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {documents.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px',
                    background: doc.status === 'approved' ? '#f0fdf4' : doc.status === 'rejected' ? '#fff5f5' : '#fefce8'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={20} color="#6b7280" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{doc.title}</div>
                      {doc.description && (
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{doc.description}</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('es-BO') : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {docStatusIcon(doc.status)}
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: doc.status === 'approved' ? '#28a745' : doc.status === 'rejected' ? '#dc3545' : '#856404'
                    }}>
                      {docStatusLabel[doc.status] ?? doc.status}
                    </span>
                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>— {doc.rejectionReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {showModal && <AddFarmModal onClose={() => setShowModal(false)} onFarmAdded={handleFarmAdded} />}
    </div>
  );
}
