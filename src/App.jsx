import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import MyProducts from './pages/MyProducts';
import BuyerOrders from './pages/BuyerOrders';
import ProducerOrders from './pages/ProducerOrders';
import './App.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ allow, children }) {
  const { currentUser, userRole, userStatus } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allow.includes(userRole)) return <Navigate to="/dashboard" replace />;
  if ((userRole === 'producer' || userRole === 'transporter') && userStatus !== 'approved') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/marketplace"
              element={<RoleRoute allow={['buyer', 'admin']}><Marketplace /></RoleRoute>}
            />
            <Route
              path="/my-products"
              element={<RoleRoute allow={['producer']}><MyProducts /></RoleRoute>}
            />
            <Route
              path="/my-orders"
              element={<RoleRoute allow={['buyer', 'admin']}><BuyerOrders /></RoleRoute>}
            />
            <Route
              path="/producer-orders"
              element={<RoleRoute allow={['producer']}><ProducerOrders /></RoleRoute>}
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
