import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, ArrowLeft, Search, MapPin, SlidersHorizontal, X,
  ShoppingBag, Locate, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listActiveProducts, PRODUCT_CATEGORIES, isPreorder } from '../services/products';
import { haversineKm, getBrowserLocation, formatDistance, DEFAULT_CENTER } from '../utils/geo';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import CartButton from '../components/CartButton';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import './Marketplace.css';

const DISTANCE_OPTIONS = [
  { id: 'all', label: 'Todos',  km: null },
  { id: '10',  label: '10 km',  km: 10 },
  { id: '25',  label: '25 km',  km: 25 },
  { id: '50',  label: '50 km',  km: 50 },
  { id: '100', label: '100 km', km: 100 },
];

const SORT_OPTIONS = [
  { id: 'distance', label: 'Más cercanos' },
  { id: 'price_asc',  label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'recent',     label: 'Más recientes' },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const { currentUser, logout, userData } = useAuth();
  const { isOpen, closeCart } = useCart();
  const [lastOrder, setLastOrder] = useState(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [distance, setDistance] = useState('all');
  const [sort, setSort]         = useState('distance');
  const [showPreorder, setShowPreorder] = useState('all'); // all | now | preorder

  const [userLoc, setUserLoc]   = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle | loading | ok | fallback
  const [selected, setSelected] = useState(null);

  const firstName = userData?.fullName || currentUser?.email?.split('@')[0] || 'Comprador';
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    load();
    requestLocation();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listActiveProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function requestLocation() {
    setLocStatus('loading');
    const loc = await getBrowserLocation();
    setUserLoc({ lat: loc.lat, lng: loc.lng });
    setLocStatus(loc.fallback ? 'fallback' : 'ok');
  }

  const enriched = useMemo(() => {
    const origin = userLoc || DEFAULT_CENTER;
    return products.map((p) => {
      const dist = p.lat != null && p.lng != null
        ? haversineKm(origin, { lat: p.lat, lng: p.lng })
        : null;
      return { ...p, distanceKm: dist };
    });
  }, [products, userLoc]);

  const filtered = useMemo(() => {
    let arr = enriched;

    if (category !== 'all') arr = arr.filter((p) => p.category === category);

    if (showPreorder === 'now')      arr = arr.filter((p) => !isPreorder(p));
    if (showPreorder === 'preorder') arr = arr.filter((p) => isPreorder(p));

    if (distance !== 'all') {
      const limit = DISTANCE_OPTIONS.find((d) => d.id === distance)?.km;
      arr = arr.filter((p) => p.distanceKm != null && p.distanceKm <= limit);
    }

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.description || '').toLowerCase().includes(s) ||
          (p.farmZone || '').toLowerCase().includes(s)
      );
    }

    if (sort === 'distance') {
      arr = [...arr].sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sort === 'price_asc') {
      arr = [...arr].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_desc') {
      arr = [...arr].sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      arr = [...arr].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return arr;
  }, [enriched, category, distance, sort, showPreorder, search]);

  const hasFilters =
    category !== 'all' || distance !== 'all' || showPreorder !== 'all' || search.trim();

  function clearFilters() {
    setCategory('all');
    setDistance('all');
    setShowPreorder('all');
    setSearch('');
  }

  return (
    <div className="mk-layout">
      {/* Navbar */}
      <nav className="mk-navbar">
        <button className="mk-back" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Panel
        </button>
        <div className="mk-logo">
          <Leaf size={20} color="#1e5a36" /> AgroStyle
        </div>
        <div className="mk-nav-right">
          <div className="mk-avatar">{initial}</div>
          <button className="mk-logout" onClick={logout}>Salir</button>
        </div>
      </nav>

      {/* Hero / search */}
      <header className="mk-header">
        <div className="mk-header-inner">
          <div className="mk-eyebrow">Marketplace agrícola</div>
          <h1>Encuentra cosechas <span>cerca de ti</span></h1>
          <p>Compra directo del productor cruceño y reduce costos logísticos.</p>

          <div className="mk-search-wrap">
            <Search size={16} className="mk-search-icon" />
            <input
              className="mk-search"
              placeholder="Buscar tomate, plátano, soya, zona…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mk-loc-pill" onClick={requestLocation} title="Actualizar ubicación">
              {locStatus === 'loading' ? (
                <Loader2 size={14} className="mk-spin" />
              ) : (
                <Locate size={14} />
              )}
              <span>
                {locStatus === 'ok' && 'Tu ubicación'}
                {locStatus === 'fallback' && 'Santa Cruz centro'}
                {locStatus === 'loading' && 'Detectando…'}
                {locStatus === 'idle' && 'Activar ubicación'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mk-main">
        {/* Filters bar */}
        <div className="mk-filters">
          <div className="mk-filter-group">
            <div className="mk-filter-title">
              <SlidersHorizontal size={13} /> Categoría
            </div>
            <div className="mk-chips">
              <button
                className={`mk-chip ${category === 'all' ? 'active' : ''}`}
                onClick={() => setCategory('all')}
              >Todos</button>
              {PRODUCT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`mk-chip ${category === c.id ? 'active' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mk-filter-group">
            <div className="mk-filter-title">
              <MapPin size={13} /> Distancia
            </div>
            <div className="mk-chips">
              {DISTANCE_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  className={`mk-chip ${distance === d.id ? 'active' : ''}`}
                  onClick={() => setDistance(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mk-filter-group">
            <div className="mk-filter-title">Disponibilidad</div>
            <div className="mk-chips">
              {[
                { id: 'all',      label: 'Todas' },
                { id: 'now',      label: 'Inmediata' },
                { id: 'preorder', label: 'Preventa' },
              ].map((o) => (
                <button
                  key={o.id}
                  className={`mk-chip ${showPreorder === o.id ? 'active' : ''}`}
                  onClick={() => setShowPreorder(o.id)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mk-filter-group mk-sort">
            <div className="mk-filter-title">Ordenar</div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results header */}
        <div className="mk-results-head">
          <div>
            <strong>{filtered.length}</strong> productos encontrados
            {distance !== 'all' && userLoc && (
              <span> · dentro de {DISTANCE_OPTIONS.find((d) => d.id === distance)?.label}</span>
            )}
          </div>
          {hasFilters && (
            <button className="mk-clear" onClick={clearFilters}>
              <X size={13} /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mk-empty"><Loader2 size={20} className="mk-spin" /> Cargando productos…</div>
        ) : filtered.length === 0 ? (
          <div className="mk-empty">
            <ShoppingBag size={42} color="#d1d5db" />
            <h3>Sin resultados</h3>
            <p>
              {products.length === 0
                ? 'Aún no hay productos publicados. Vuelve pronto, los productores están registrando sus cosechas.'
                : 'No encontramos productos con esos filtros. Prueba ampliar la distancia o cambiar la categoría.'}
            </p>
            {hasFilters && (
              <button className="mk-clear primary" onClick={clearFilters}>Limpiar filtros</button>
            )}
          </div>
        ) : (
          <div className="mk-grid">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                distanceKm={p.distanceKm}
                onClick={() => setSelected(p)}
              />
            ))}
          </div>
        )}
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
        <CartDrawer
          onOrderPlaced={(order) => {
            setLastOrder(order);
          }}
        />
      )}

      {lastOrder && (
        <div style={{
          position:'fixed', bottom:'5rem', left:'50%', transform:'translateX(-50%)',
          background:'#1e5a36', color:'#fff', padding:'0.75rem 1.5rem', borderRadius:'12px',
          fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'0.9rem', zIndex:1050,
          boxShadow:'0 4px 20px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'0.75rem',
        }}>
          Pedido enviado al productor
          <button
            onClick={() => navigate('/my-orders')}
            style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff',
              padding:'0.3rem 0.85rem', borderRadius:'8px', cursor:'pointer',
              fontFamily:'inherit', fontWeight:700, fontSize:'0.82rem' }}
          >
            Ver pedidos
          </button>
          <button
            onClick={() => setLastOrder(null)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)',
              cursor:'pointer', fontSize:'1rem', lineHeight:1 }}
          >×</button>
        </div>
      )}
    </div>
  );
}
