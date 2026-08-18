import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { logActivity, LOG_ACTIONS } from './utils/activityLogger';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import MembershipsPage from './pages/MembershipsPage';
import BookingsPage from './pages/BookingsPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gym, setGym] = useState(null);

  const loadGym = async (userId) => {
    try {
      console.log('Loading gym for user:', userId);

      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', userId)
        .single();

      console.log('Gym data:', data);
      console.log('Gym error:', error);
      console.log('Is approved:', data?.is_approved);
      console.log('Gym for user:', data?.name);

      if (error || !data) {
        console.log('No gym found for this user');
        setGym(null);
        return null;
      }

      const normalized = {
        ...data,
        is_approved: data.is_approved === true || data.is_approved === 'true',
      };
      setGym(normalized);
      return normalized;
    } catch (e) {
      console.log('loadGym error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user?.id) {
        loadGym(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        setLoading(true);
        const gymData = await loadGym(nextSession.user.id);
        if (_event === 'SIGNED_IN' && gymData) {
          await logActivity({
            actorId: nextSession.user.id,
            actorEmail: nextSession.user.email,
            actorName: gymData.name,
            actorType: 'gym',
            action: LOG_ACTIONS.AUTH_LOGIN,
            category: 'auth',
            description: 'Gym owner logged in',
            metadata: { gym_id: gymData.id },
          });
        }
      } else {
        setGym(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#F5C842',
            letterSpacing: 3,
          }}
        >
          SANKOFA FIT
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading gym dashboard...</div>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(245,200,66,0.2)',
            borderTop: '3px solid #F5C842',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout gym={gym} session={session} loadGym={loadGym}>
        <Routes>
          <Route path="/" element={<DashboardPage gym={gym} loadGym={loadGym} userId={session.user.id} />} />
          <Route path="/classes" element={<ClassesPage gym={gym} userId={session.user.id} />} />
          <Route path="/memberships" element={<MembershipsPage gym={gym} />} />
          <Route path="/bookings" element={<BookingsPage gym={gym} />} />
          <Route path="/earnings" element={<EarningsPage gym={gym} />} />
          <Route
            path="/profile"
            element={<ProfilePage gym={gym} setGym={setGym} userId={session.user.id} />}
          />
          <Route path="/settings" element={<SettingsPage session={session} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
