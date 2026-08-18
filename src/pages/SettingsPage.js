import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckIcon, ContactIcons } from '../components/Icons';

export default function SettingsPage({ session }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Sign out of Gym Dashboard?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Settings</h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>Manage your account</p>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            color: '#F5C842',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Account Information
        </h3>
        <div style={{ color: '#6B7B99', fontSize: 13 }}>
          <strong style={{ color: 'white' }}>Email: </strong>
          {session?.user?.email}
        </div>
        <div style={{ color: '#6B7B99', fontSize: 13, marginTop: 8 }}>
          <strong style={{ color: 'white' }}>Account ID: </strong>
          {session?.user?.id?.slice(0, 8)}...
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            color: '#F5C842',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Change Password
        </h3>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: 12,
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              backgroundColor: 'rgba(48,209,88,0.08)',
              border: '1px solid rgba(48,209,88,0.3)',
              borderRadius: 10,
              padding: 12,
              color: '#30D158',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckIcon size={18} />
            {message}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              style={inputStyle}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#F5C842',
              color: '#1B2F6B',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            color: '#F5C842',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Support
        </h3>
        <p style={{ color: '#6B7B99', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Need help? Contact Sankofa Fit support.
        </p>
        <a
          href="mailto:support@sankofafit.com"
          style={{
            backgroundColor: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.3)',
            borderRadius: 10,
            padding: '10px 20px',
            color: '#F5C842',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ContactIcons.Email size={16} />
          support@sankofafit.com
        </a>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '14px 24px',
          color: '#EF4444',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Sign Out of Dashboard
      </button>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: '#6B7B99',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
