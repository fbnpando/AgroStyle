import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { createFarm, updateFarm } from '../services/farms';
import { useAuth } from '../context/AuthContext';
import { X, MapPin } from 'lucide-react';
import L from 'leaflet';

// Fix leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function AddFarmModal({ onClose, onFarmAdded, onFarmUpdated, farm = null }) {
  const { currentUser } = useAuth();
  const isEdit = Boolean(farm);

  const [name, setName] = useState(farm?.name || '');
  const [phone, setPhone] = useState(farm?.phone || '');
  const [zone, setZone] = useState(farm?.zone || '');
  const [position, setPosition] = useState(
    farm?.lat != null && farm?.lng != null
      ? { lat: farm.lat, lng: farm.lng }
      : { lat: -17.7833, lng: -63.1821 } // Santa Cruz default
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!position) {
      setError('Por favor, selecciona una ubicación en el mapa.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        const updated = await updateFarm(farm.id, {
          name, phone, zone, lat: position.lat, lng: position.lng,
        });
        onFarmUpdated?.(updated);
      } else {
        const newFarm = await createFarm({
          producerId: currentUser.id,
          name,
          phone,
          zone,
          lat: position.lat,
          lng: position.lng,
        });
        onFarmAdded?.(newFarm);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al guardar la finca: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.5rem', right: '1.5rem',
          background: 'none', border: 'none', cursor: 'pointer'
        }}>
          <X size={24} color="#6b7280" />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
          {isEdit ? 'Editar finca' : 'Añadir nueva finca'}
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          {isEdit ? 'Actualiza los datos o reubica el marcador en el mapa.' : 'Completa los datos y ubica tu finca en el mapa.'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre de la finca</label>
              <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Finca Los Mangales" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teléfono de contacto</label>
              <input type="tel" className="form-input" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej. 77123456" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Zona / Región</label>
              <input type="text" className="form-input" required value={zone} onChange={e => setZone(e.target.value)} placeholder="Ej. Montero" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary-auth" style={{ marginTop: 'auto' }}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar Finca'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} /> Ubicación en el mapa
            </label>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Haz clic en el mapa para marcar la ubicación exacta.</p>
            <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <MapContainer center={[position.lat, position.lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
          </div>
        </form>
      </div>
      <style>{`
        @media (max-width: 768px) {
          form { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
