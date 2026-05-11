import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, Eye, Sprout, ShoppingCart, Truck, Shield } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      {/* Left Sidebar */}
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Leaf size={20} color="white" fill="white" />
            </div>
            AgroStyle SC
          </div>
          
          <h1>El campo cruceño,<br/>en tu pantalla</h1>
          <p className="subtitle">
            Conectamos productores, compradores y transportistas de Santa Cruz, Bolivia.
          </p>

          <ul className="auth-features">
            <li><div className="feature-dot"></div> Vende tus cosechas directamente</li>
            <li><div className="feature-dot"></div> Encuentra productos frescos cerca de ti</li>
            <li><div className="feature-dot"></div> Acepta rutas de transporte agrícola</li>
          </ul>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="auth-main">
        <div className="auth-form-container">
          <div className="auth-main-header">
            <h2>Bienvenido de vuelta</h2>
            <p>Ingresa con el correo con el que te registraste</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="tu@correo.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>
            
            <button disabled={loading} type="submit" className="btn-primary-auth">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth-redirect">
            ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
          </div>

          {/* Demo Accounts */}
          <div className="demo-accounts">
            <h4>Cuentas de demo</h4>
            <ul>
              <li><Shield className="demo-icon" color="#6366f1" /> <span style={{opacity: 0.6}}>admin@agro.com</span> &rarr; Administrador</li>
              <li><Sprout className="demo-icon" color="#16a34a" /> <span style={{opacity: 0.6}}>productor@agro.com</span> &rarr; Productor</li>
              <li><ShoppingCart className="demo-icon" color="#9ca3af" /> <span style={{opacity: 0.6}}>comprador@agro.com</span> &rarr; Comprador</li>
              <li><Truck className="demo-icon" color="#3b82f6" /> <span style={{opacity: 0.6}}>transportista@agro.com</span> &rarr; Transportista</li>
            </ul>
            <p style={{opacity: 0.7, marginTop: '0.5rem'}}>Contrasena: cualquier 6+ caracteres</p>
          </div>
        </div>
      </div>
    </div>
  );
}
