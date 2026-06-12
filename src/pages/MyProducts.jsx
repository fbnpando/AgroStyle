import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, ArrowLeft, Plus, Package, Pencil, Archive, Trash2,
  Search, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  listProducerProducts, updateProduct, deleteProduct, isPreorder,
} from '../services/products';
import { listProducerFarms } from '../services/farms';
import ProductFormModal from '../components/ProductFormModal';
import ProductCard from '../components/ProductCard';
import './MyProducts.css';

const TABS = [
  { id: 'all',       label: 'Todos' },
  { id: 'active',    label: 'Activos' },
  { id: 'preorder',  label: 'En preventa' },
  { id: 'archived',  label: 'Archivados' },
];

export default function MyProducts() {
  const navigate = useNavigate();
  const { currentUser, logout, userData } = useAuth();

  const [products, setProducts] = useState([]);
  const [farms, setFarms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);

  const firstName = userData?.fullName || currentUser?.email?.split('@')[0] || 'Productor';
  const initial   = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!currentUser) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function load() {
    setLoading(true);
    try {
      const [prods, farmsList] = await Promise.all([
        listProducerProducts(currentUser.id),
        listProducerFarms(currentUser.id),
      ]);
      setProducts(prods);
      setFarms(farmsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let arr = products;
    if (tab === 'active')   arr = arr.filter((p) => p.status === 'active');
    if (tab === 'archived') arr = arr.filter((p) => p.status === 'archived');
    if (tab === 'preorder') arr = arr.filter((p) => p.status === 'active' && isPreorder(p));
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(s));
    }
    return arr;
  }, [products, tab, search]);

  const counts = useMemo(() => ({
    total:   products.length,
    active:  products.filter((p) => p.status === 'active').length,
    preorder: products.filter((p) => p.status === 'active' && isPreorder(p)).length,
    stock:   products.reduce((s, p) => s + (Number(p.quantity) || 0), 0),
  }), [products]);

  function openCreate() {
    if (!farms.length) return;
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setModalOpen(true);
  }

  async function handleArchive(product) {
    const next = product.status === 'archived' ? 'active' : 'archived';
    await updateProduct(product.id, { status: next });
    setProducts((p) => p.map((it) => (it.id === product.id ? { ...it, status: next } : it)));
  }

  async function handleDelete(product) {
    if (!confirm(`Eliminar "${product.name}" definitivamente?`)) return;
    await deleteProduct(product.id);
    setProducts((p) => p.filter((it) => it.id !== product.id));
  }

  function handleSaved(saved) {
    setProducts((p) => {
      const exists = p.find((it) => it.id === saved.id);
      return exists ? p.map((it) => (it.id === saved.id ? saved : it)) : [saved, ...p];
    });
  }

  return (
    <div className="mp-layout">
      {/* Navbar */}
      <nav className="mp-navbar">
        <button className="mp-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Panel
        </button>
        <div className="mp-logo">
          <Leaf size={20} color="#1e5a36" /> AgroStyle
        </div>
        <div className="mp-nav-right">
          <div className="mp-avatar">{initial}</div>
          <button className="mp-logout" onClick={logout}>Salir</button>
        </div>
      </nav>

      <header className="mp-header">
        <div className="mp-header-inner">
          <div>
            <div className="mp-eyebrow">Gestión de cosechas</div>
            <h1>Mis productos</h1>
            <p>Publica, edita y mantén actualizada tu oferta agrícola.</p>
          </div>
          <button
            className="mp-cta"
            onClick={openCreate}
            disabled={!farms.length}
            title={!farms.length ? 'Necesitas registrar una finca primero' : ''}
          >
            <Plus size={16} /> Publicar cosecha
          </button>
        </div>
      </header>

      <main className="mp-main">
        {/* Stats strip */}
        <div className="mp-stats">
          <div className="mp-stat">
            <div className="mp-stat-label">Publicaciones</div>
            <div className="mp-stat-value">{counts.total}</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-label">Activas</div>
            <div className="mp-stat-value">{counts.active}</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-label">En preventa</div>
            <div className="mp-stat-value">{counts.preorder}</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-label">Stock total</div>
            <div className="mp-stat-value">{counts.stock}</div>
          </div>
        </div>

        {/* Farm warning */}
        {!loading && !farms.length && (
          <div className="mp-warning">
            <AlertCircle size={18} />
            <div>
              <strong>Aún no tienes fincas registradas.</strong>
              <p>Registra al menos una finca con ubicación para poder publicar productos.</p>
            </div>
            <button onClick={() => navigate('/dashboard')}>Ir a mi panel</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="mp-toolbar">
          <div className="mp-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`mp-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mp-search">
            <Search size={14} />
            <input
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="mp-empty"><span>Cargando productos…</span></div>
        ) : filtered.length === 0 ? (
          <div className="mp-empty">
            <Package size={42} color="#d1d5db" />
            <h3>{products.length === 0 ? 'Sin cosechas publicadas' : 'No hay resultados'}</h3>
            <p>
              {products.length === 0
                ? 'Publica tu primera cosecha para empezar a recibir pedidos.'
                : 'Cambia los filtros o el término de búsqueda.'}
            </p>
            {products.length === 0 && farms.length > 0 && (
              <button className="mp-cta" onClick={openCreate}>
                <Plus size={16} /> Publicar cosecha
              </button>
            )}
          </div>
        ) : (
          <div className="mp-grid">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                actions={
                  <>
                    <button className="pc-action" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      className="pc-action"
                      onClick={(e) => { e.stopPropagation(); handleArchive(p); }}
                    >
                      <Archive size={13} /> {p.status === 'archived' ? 'Reactivar' : 'Archivar'}
                    </button>
                    <button
                      className="pc-action pc-danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                }
                onClick={() => openEdit(p)}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <ProductFormModal
          farms={farms}
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
