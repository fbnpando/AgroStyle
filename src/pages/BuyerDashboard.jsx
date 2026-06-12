import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Search, MapPin, ArrowRight, Sparkles, ShoppingCart, Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listActiveProducts, PRODUCT_CATEGORIES, isPreorder } from '../services/products';
import { haversineKm, getBrowserLocation, DEFAULT_CENTER } from '../utils/geo';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import CartButton from '../components/CartButton';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import './Dashboard.css';

export default function BuyerDashboard() {
  const { currentUser, logout, userData } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [locKnown, setLocKnown] = useState(false);
  const [selected, setSelected] = useState(null);

  const { isOpen, closeCart } = useCart();

  const firstName =
    userData?.fullName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Comprador';
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    load();
    getBrowserLocation().then((l) => {
      setUserLoc({ lat: l.lat, lng: l.lng });
      setLocKnown(!l.fallback);
    });
  }, []);

  async function load() {
    setLoading(true);
    try {
      const list = await listActiveProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const enriched = useMemo(() => {
    const origin = userLoc || DEFAULT_CENTER;
    return products.map((p) => ({
      ...p,
      distanceKm:
        p.lat != null && p.lng != null
          ? haversineKm(origin, { lat: p.lat, lng: p.lng })
          : null,
    }));
  }, [products, userLoc]);

  const filteredByCategory = useMemo(() => {
    let arr = enriched;
    if (category !== 'all') arr = arr.filter((p) => p.category === category);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description || '').toLowerCase().includes(s) ||
          (p.farmZone || '').toLowerCase().includes(s)
      );
    }
    return arr;
  }, [enriched, category, search]);

  const nearby = useMemo(() => {
    return [...filteredByCategory]
      .filter((p) => !isPreorder(p))
      .sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 8);
  }, [filteredByCategory]);

  const preorderList = useMemo(() => {
    return [...filteredByCategory]
      .filter((p) => isPreorder(p))
      .sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 8);
  }, [filteredByCategory]);

  function goMarketplace() {
    navigate('/marketplace');
  }

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
          <h1>Hola {firstName}, ¿qué cosechas buscas hoy?</h1>
          <p>Compra directo del productor cruceño y reduce costos.</p>

          <div className="header-pills">
            <span className="header-pill">
              <span className="header-pill-dot" />
              <strong>{products.length}</strong>
              {products.length === 1 ? ' producto disponible' : ' productos disponibles'}
            </span>
            <span className="header-pill">
              <Sparkles size={14} />
              <strong>{products.filter((p) => isPreorder(p)).length}</strong> en preventa
            </span>
            <span className="header-pill">
              <MapPin size={14} />
              {locKnown ? 'Ubicación detectada' : 'Santa Cruz'}
            </span>
          </div>
        </div>
      </div>

      <main className="dash-main">
        {/* Hero search */}
        <div className="hero-search">
          <div className="hero-search-input-wrap">
            <Search size={16} className="hero-search-icon" />
            <input
              className="hero-search-input"
              placeholder="Buscar tomate, papa, soya, zona…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goMarketplace()}
            />
          </div>
        </div>

        {/* Promo banner: preventas */}
        {products.filter((p) => isPreorder(p)).length > 0 && (
          <div className="promo-banner">
            <div className="promo-body">
              <div className="promo-eyebrow">
                <Sparkles size={14} /> Preventa
              </div>
              <div className="promo-title">
                Reserva tu cosecha con solo el 40%
              </div>
              <div className="promo-desc">
                Asegura precio y disponibilidad pagando una seña. Hay{' '}
                <strong>{products.filter((p) => isPreorder(p)).length}</strong>{' '}
                {products.filter((p) => isPreorder(p)).length === 1 ? 'cosecha próxima' : 'cosechas próximas'}.
              </div>
            </div>
            <button className="promo-cta" onClick={goMarketplace}>
              Ver preventas <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Category visual grid */}
        <div className="section-head" style={{ marginTop: '0.5rem' }}>
          <h3>Explora por categoría</h3>
        </div>
        <div className="cat-grid">
          <button
            className={`cat-card cat-c-all ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            <div className="cat-card-icon">★</div>
            <div>
              <div className="cat-card-label">Todos</div>
              <div className="cat-card-count">{products.length} productos</div>
            </div>
          </button>
          {PRODUCT_CATEGORIES.map((c) => {
            const count = products.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                className={`cat-card cat-c-${c.id} ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                <div className="cat-card-icon">{c.emoji}</div>
                <div>
                  <div className="cat-card-label">{c.label}</div>
                  <div className="cat-card-count">{count} {count === 1 ? 'producto' : 'productos'}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cerca de ti */}
        <section className="product-section">
          <div className="section-head">
            <h3>Cerca de ti</h3>
            <button className="section-head-link" onClick={goMarketplace}>
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="empty-state"><span>Cargando productos…</span></div>
          ) : nearby.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <h4>Sin cosechas inmediatas en esta categoría</h4>
              <p>Prueba otra categoría o revisa las preventas más abajo.</p>
            </div>
          ) : (
            <div className="product-scroller">
              {nearby.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  distanceKm={p.distanceKm}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* En preventa próxima */}
        <section className="product-section">
          <div className="section-head">
            <h3>
              <Sparkles size={16} style={{ verticalAlign: 'middle', color: '#ea580c' }} />{' '}
              En preventa próxima
            </h3>
            <button className="section-head-link" onClick={goMarketplace}>
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="empty-state"><span>Cargando…</span></div>
          ) : preorderList.length === 0 ? (
            <div className="empty-state">
              <p>No hay preventas activas en esta categoría.</p>
            </div>
          ) : (
            <div className="product-scroller">
              {preorderList.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  distanceKm={p.distanceKm}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pedidos */}
        <section className="product-section">
          <div className="content-card">
            <div className="card-header">
              <h3>Tus pedidos</h3>
              <button className="section-head-link" onClick={() => navigate('/my-orders')}>
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
            <div className="empty-state" style={{ padding: '1.5rem 0' }}>
              <div className="empty-state-icon">
                <Package size={36} color="#d1d5db" />
              </div>
              <h4>Gestiona tus compras</h4>
              <p>Ver estado de pedidos, pagar con QR y más.</p>
              <button
                onClick={() => navigate('/my-orders')}
                style={{ marginTop:'0.75rem', padding:'0.55rem 1.2rem', background:'#1e5a36',
                  color:'#fff', border:'none', borderRadius:'8px', fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', fontSize:'0.85rem' }}
              >
                Ir a mis pedidos
              </button>
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <ProductDetailModal
          product={selected}
          distanceKm={selected.distanceKm}
          onClose={() => setSelected(null)}
        />
      )}

      <CartButton />

      {isOpen && (
        <CartDrawer onOrderPlaced={() => navigate('/my-orders')} />
      )}
    </div>
  );
}
