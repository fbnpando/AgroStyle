import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ImagePlus, Calendar, Package, DollarSign, Hash, Tag,
  AlignLeft, Store, Clock, Sparkles, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  PRODUCT_CATEGORIES, PRODUCT_UNITS,
  createProduct, updateProduct, uploadProductImage,
  getSuggestedPrice,
} from '../services/products';
import './ProductFormModal.css';

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export default function ProductFormModal({ farms, product, onClose, onSaved }) {
  const { currentUser, userData } = useAuth();
  const editing = Boolean(product);

  const [farmId, setFarmId]                 = useState(product?.farmId || farms?.[0]?.id || '');
  const [name, setName]                     = useState(product?.name || '');
  const [category, setCategory]             = useState(product?.category || 'verduras');
  const [description, setDescription]       = useState(product?.description || '');
  const [price, setPrice]                   = useState(product?.price ?? '');
  const [quantity, setQuantity]             = useState(product?.quantity ?? '');
  const [unit, setUnit]                     = useState(product?.unit || 'kg');
  const [availabilityType, setAvailability] = useState(product?.availabilityType || 'immediate');
  const [availableDate, setAvailableDate]   = useState(
    product?.availableDate || today()
  );
  const [imageUrl, setImageUrl]             = useState(product?.imageUrl || '');
  const [imageFile, setImageFile]           = useState(null);
  const [previewUrl, setPreviewUrl]         = useState(product?.imageUrl || '');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef(null);

  const selectedFarm = useMemo(
    () => farms?.find((f) => f.id === farmId),
    [farms, farmId]
  );

  const suggested = useMemo(
    () => getSuggestedPrice(category, unit),
    [category, unit]
  );

  // When user picks preorder we force a date >= tomorrow as default
  useEffect(() => {
    if (availabilityType === 'preorder') {
      const t = today();
      if (!availableDate || availableDate <= t) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setAvailableDate(d.toISOString().slice(0, 10));
      }
    } else {
      setAvailableDate(today());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityType]);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setErrors((p) => ({ ...p, image: 'El archivo debe ser una imagen.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, image: 'La imagen no puede superar 5 MB.' }));
      return;
    }
    setErrors((p) => ({ ...p, image: undefined }));
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function validate() {
    const e = {};
    if (!farmId) e.farmId = 'Selecciona una finca.';
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    if (!category) e.category = 'Selecciona una categoría.';
    if (!description.trim() || description.trim().length < 10)
      e.description = 'Describe tu producto (mínimo 10 caracteres).';
    if (price === '' || Number(price) <= 0) e.price = 'Ingresa un precio mayor a 0.';
    if (quantity === '' || Number(quantity) <= 0) e.quantity = 'La cantidad debe ser mayor a 0.';
    if (!unit) e.unit = 'Selecciona una unidad.';
    if (!previewUrl && !imageFile) e.image = 'Sube al menos 1 imagen.';
    if (!availableDate) e.availableDate = 'Selecciona una fecha.';
    if (availableDate && availableDate < today())
      e.availableDate = 'La fecha no puede ser anterior a hoy.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadProductImage(currentUser.uid, imageFile);
      }

      const payload = {
        producerId: currentUser.uid,
        producerName: userData?.fullName || currentUser.email,
        farmId,
        farmName: selectedFarm?.name || '',
        farmZone: selectedFarm?.zone || '',
        lat: selectedFarm?.lat ?? null,
        lng: selectedFarm?.lng ?? null,
        name: name.trim(),
        category,
        description: description.trim(),
        price: Number(price),
        suggestedPrice: suggested ?? null,
        quantity: Number(quantity),
        unit,
        imageUrl: finalImageUrl,
        availabilityType,
        availableDate,
        status: product?.status || 'active',
      };

      let saved;
      if (editing) {
        await updateProduct(product.id, payload);
        saved = { ...product, ...payload };
      } else {
        saved = await createProduct(payload);
      }
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      console.error(err);
      setSubmitError('No se pudo guardar el producto. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const priceDiff =
    suggested && price !== '' && Number(price) > 0
      ? Number(price) - suggested
      : null;

  return (
    <div className="pf-overlay" onClick={onClose}>
      <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pf-header">
          <div>
            <div className="pf-eyebrow">
              <Sparkles size={14} /> {editing ? 'Editar producto' : 'Nueva publicación'}
            </div>
            <h2>{editing ? 'Actualiza tu cosecha' : 'Publica tu cosecha'}</h2>
            <p>Comparte tu producción con compradores cruceños en minutos.</p>
          </div>
          <button type="button" className="pf-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <form className="pf-body" onSubmit={handleSubmit}>
          {/* Imagen */}
          <section className="pf-image-block">
            <label className="pf-label">
              <ImagePlus size={14} /> Imagen del producto *
            </label>
            <div
              className={`pf-dropzone ${previewUrl ? 'has-image' : ''} ${errors.image ? 'has-error' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" />
              ) : (
                <div className="pf-dropzone-empty">
                  <ImagePlus size={28} />
                  <span>Haz clic para subir una imagen</span>
                  <small>PNG o JPG, hasta 5 MB</small>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </div>
            {errors.image && <div className="pf-error">{errors.image}</div>}
          </section>

          {/* Info básica */}
          <section className="pf-section">
            <div className="pf-grid-2">
              <div className="pf-field">
                <label className="pf-label"><Package size={14} /> Nombre *</label>
                <input
                  className={`pf-input ${errors.name ? 'has-error' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Tomate cherry orgánico"
                />
                {errors.name && <div className="pf-error">{errors.name}</div>}
              </div>

              <div className="pf-field">
                <label className="pf-label"><Tag size={14} /> Categoría *</label>
                <select
                  className={`pf-input ${errors.category ? 'has-error' : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label"><AlignLeft size={14} /> Descripción *</label>
              <textarea
                className={`pf-input pf-textarea ${errors.description ? 'has-error' : ''}`}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Características, métodos de cultivo, presentación…"
              />
              {errors.description && <div className="pf-error">{errors.description}</div>}
            </div>
          </section>

          {/* Stock + precio */}
          <section className="pf-section">
            <div className="pf-grid-3">
              <div className="pf-field">
                <label className="pf-label"><Hash size={14} /> Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={`pf-input ${errors.quantity ? 'has-error' : ''}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej. 100"
                />
                {errors.quantity && <div className="pf-error">{errors.quantity}</div>}
              </div>

              <div className="pf-field">
                <label className="pf-label">Unidad *</label>
                <select
                  className="pf-input"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className="pf-field">
                <label className="pf-label"><DollarSign size={14} /> Precio (Bs) *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className={`pf-input ${errors.price ? 'has-error' : ''}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Por unidad"
                />
                {errors.price && <div className="pf-error">{errors.price}</div>}
              </div>
            </div>

            {suggested != null && (
              <div className="pf-suggested">
                <Sparkles size={14} />
                <div>
                  <strong>Precio referencial:</strong> Bs {suggested} por {unit}
                  {priceDiff != null && (
                    <span className={`pf-pill ${priceDiff > 0 ? 'pill-warn' : priceDiff < 0 ? 'pill-good' : 'pill-neutral'}`}>
                      {priceDiff > 0
                        ? `+Bs ${priceDiff.toFixed(2)} vs mercado`
                        : priceDiff < 0
                        ? `Bs ${Math.abs(priceDiff).toFixed(2)} bajo mercado`
                        : 'Igual al mercado'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Finca + disponibilidad */}
          <section className="pf-section">
            <div className="pf-field">
              <label className="pf-label"><Store size={14} /> Finca de origen *</label>
              <select
                className={`pf-input ${errors.farmId ? 'has-error' : ''}`}
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
              >
                <option value="">Selecciona una finca</option>
                {farms?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.zone ? `· ${f.zone}` : ''}
                  </option>
                ))}
              </select>
              {errors.farmId && <div className="pf-error">{errors.farmId}</div>}
            </div>

            <div>
              <label className="pf-label"><Clock size={14} /> Disponibilidad *</label>
              <div className="pf-toggle">
                <button
                  type="button"
                  className={`pf-toggle-btn ${availabilityType === 'immediate' ? 'active' : ''}`}
                  onClick={() => setAvailability('immediate')}
                >
                  <strong>Disponible ahora</strong>
                  <span>Listo para entrega</span>
                </button>
                <button
                  type="button"
                  className={`pf-toggle-btn ${availabilityType === 'preorder' ? 'active' : ''}`}
                  onClick={() => setAvailability('preorder')}
                >
                  <strong>Preventa</strong>
                  <span>Cosecha futura · 40% anticipo</span>
                </button>
              </div>
            </div>

            {availabilityType === 'preorder' && (
              <div className="pf-field">
                <label className="pf-label"><Calendar size={14} /> Fecha de cosecha *</label>
                <input
                  type="date"
                  className={`pf-input ${errors.availableDate ? 'has-error' : ''}`}
                  min={today()}
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                />
                {errors.availableDate && <div className="pf-error">{errors.availableDate}</div>}
                <p className="pf-hint">
                  Los compradores pagarán 40% al reservar y el saldo cuando esté lista.
                </p>
              </div>
            )}
          </section>

          {submitError && (
            <div className="pf-banner-error"><AlertCircle size={16} /> {submitError}</div>
          )}

          <footer className="pf-footer">
            <button type="button" className="pf-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="pf-btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar cosecha'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
