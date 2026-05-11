import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProducerDashboard from './ProducerDashboard';
import BuyerDashboard from './BuyerDashboard';
import TransporterDashboard from './TransporterDashboard';
import AdminDashboard from './AdminDashboard';
import PendingApproval from './PendingApproval';

export default function Dashboard() {
  const { userRole, userStatus } = useAuth();

  if (userRole === 'admin') return <AdminDashboard />;

  if ((userRole === 'producer' || userRole === 'transporter') && userStatus !== 'approved') {
    return <PendingApproval />;
  }

  if (userRole === 'producer') return <ProducerDashboard />;
  if (userRole === 'buyer') return <BuyerDashboard />;
  if (userRole === 'transporter') return <TransporterDashboard />;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9' }}>
      <p style={{ color: '#6b7280', fontFamily: 'Outfit, sans-serif' }}>Cargando...</p>
    </div>
  );
}
