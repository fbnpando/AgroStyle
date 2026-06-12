import React from 'react';
import { MapPin, Calendar, Package } from 'lucide-react';
import { PRODUCT_CATEGORIES, isPreorder, daysUntilAvailable } from '../services/products';
import { formatDistance } from '../utils/geo';
import './ProductCard.css';

function categoryLabel(id) {
  return PRODUCT_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export default function ProductCard({ product, distanceKm, onClick, actions }) {
  const preorder = isPreorder(product);
  const days = preorder ? daysUntilAvailable(product) : 0;

  return (
    <article className="pc-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="pc-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="pc-image-fallback"><Package size={32} /></div>
        )}
        {preorder && (
          <span className="pc-badge pc-badge-preorder">
            <Calendar size={12} /> Preventa · {days}d
          </span>
        )}
        {!preorder && (
          <span className="pc-badge pc-badge-now">Disponible</span>
        )}
      </div>

      <div className="pc-body">
        <div className="pc-meta-row">
          <span className="pc-category">{categoryLabel(product.category)}</span>
          {distanceKm != null && (
            <span className="pc-distance">
              <MapPin size={11} /> {formatDistance(distanceKm)}
            </span>
          )}
        </div>

        <h3 className="pc-name">{product.name}</h3>

        <div className="pc-location">
          <MapPin size={12} /> {product.farmZone || product.farmName || 'Santa Cruz'}
        </div>

        <div className="pc-price-row">
          <div className="pc-price">
            <strong>Bs {Number(product.price).toFixed(2)}</strong>
            <span>/ {product.unit}</span>
          </div>
          <div className="pc-stock">{product.quantity} {product.unit} disp.</div>
        </div>

        {actions && <div className="pc-actions">{actions}</div>}
      </div>
    </article>
  );
}
