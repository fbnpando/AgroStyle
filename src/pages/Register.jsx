import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, User, Mail, Lock, Eye, Sprout, ShoppingCart, Truck, Check, ArrowLeft } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(''); // 'producer', 'buyer', 'transporter'
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleNextStep = () => {
    if (role) {
      setStep(2);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await register(fullName, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Verifica tus datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getRoleData = () => {
    switch (role) {
      case 'producer': return { name: 'Productor', icon: <Sprout size={14} /> };
      case 'buyer': return { name: 'Comprador', icon: <ShoppingCart size={14} /> };
      case 'transporter': return { name: 'Transportista', icon: <Truck size={14} /> };
      default: return { name: '', icon: null };
    }
  };

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
          
          <h1>Únete al mercado del campo</h1>
          <p className="subtitle">
            Crea tu cuenta en segundos y empieza a conectar con productores, compradores y transportistas de Santa Cruz.
          </p>

          <div className="auth-steps">
            <div className="auth-step" style={{ opacity: step >= 1 ? 1 : 0.5 }}>
              <div className="step-number" style={{ background: step >= 1 ? 'white' : 'rgba(255,255,255,0.2)', color: step >= 1 ? '#1e5a36' : 'white' }}>1</div> 
              Elige tu rol
            </div>
            <div className="auth-step" style={{ opacity: step >= 2 ? 1 : 0.5 }}>
              <div className="step-number" style={{ background: step >= 2 ? 'white' : 'rgba(255,255,255,0.2)', color: step >= 2 ? '#1e5a36' : 'white' }}>2</div> 
              Completa tus datos
            </div>
            <div className="auth-step" style={{ opacity: 0.5 }}>
              <div className="step-number">3</div> 
              ¡Listo para operar!
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="auth-main">
        <div className="auth-form-container">
          
          {step === 1 && (
            <div className="fade-in">
              <div className="auth-main-header" style={{textAlign: 'center'}}>
                <h2>¿Cuál es tu rol?</h2>
                <p>Selecciona cómo usarás AgroStyle</p>
              </div>

              <div className="role-options">
                <div 
                  className={`role-option ${role === 'producer' ? 'selected' : ''}`}
                  onClick={() => setRole('producer')}
                >
                  <div className="role-option-icon" style={{color: '#16a34a', background: '#f0fdf4', padding: '0.4rem', borderRadius: '8px', width: 'auto', height: 'auto'}}>
                    <Sprout size={24} />
                  </div>
                  <div className="role-option-content">
                    <div className="role-option-title">Productor</div>
                    <div className="role-option-desc">Publica y vende tus cosechas</div>
                  </div>
                  <Check className="role-option-check" />
                </div>

                <div 
                  className={`role-option ${role === 'buyer' ? 'selected' : ''}`}
                  onClick={() => setRole('buyer')}
                >
                  <div className="role-option-icon" style={{color: '#9ca3af', background: '#f3f4f6', padding: '0.4rem', borderRadius: '8px', width: 'auto', height: 'auto'}}>
                    <ShoppingCart size={24} />
                  </div>
                  <div className="role-option-content">
                    <div className="role-option-title">Comprador</div>
                    <div className="role-option-desc">Compra directo del campo</div>
                  </div>
                  <Check className="role-option-check" />
                </div>

                <div 
                  className={`role-option ${role === 'transporter' ? 'selected' : ''}`}
                  onClick={() => setRole('transporter')}
                >
                  <div className="role-option-icon" style={{color: '#3b82f6', background: '#eff6ff', padding: '0.4rem', borderRadius: '8px', width: 'auto', height: 'auto'}}>
                    <Truck size={24} />
                  </div>
                  <div className="role-option-content">
                    <div className="role-option-title">Transportista</div>
                    <div className="role-option-desc">Transporta carga agrícola</div>
                  </div>
                  <Check className="role-option-check" />
                </div>
              </div>

              <button 
                className={role ? "btn-secondary-auth" : "btn-secondary-auth"}
                style={{ opacity: role ? 1 : 0.6, cursor: role ? 'pointer' : 'not-allowed' }}
                onClick={handleNextStep}
                disabled={!role}
              >
                Continuar
              </button>

              <div className="auth-redirect">
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <button className="back-button" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Cambiar rol
              </button>

              <div className="role-badge">
                {getRoleData().icon} {getRoleData().name}
              </div>

              <div className="auth-main-header">
                <h2>Crea tu cuenta</h2>
                <p>Solo toma un minuto</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Juan Pérez" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

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
                      placeholder="Mínimo 6 caracteres" 
                      required 
                      minLength={6}
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
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <div className="auth-redirect">
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
