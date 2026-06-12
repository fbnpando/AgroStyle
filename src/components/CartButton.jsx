import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartButton() {
  const { count, openCart } = useCart();
  if (count === 0) return null;
  return (
    <button
      onClick={openCart}
      style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 900,
        background: '#1e5a36', color: '#fff', border: 'none', borderRadius: '50px',
        padding: '0.75rem 1.25rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700,
        fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
        gap: '0.5rem', boxShadow: '0 4px 20px rgba(30,90,54,0.4)',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <ShoppingCart size={18} />
      Carrito ({count})
    </button>
  );
}
