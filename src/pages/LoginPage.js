import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingIcon,
  GymIcon,
  MoneyIcon,
  UsersIcon,
  StatusIcons,
  AddIcon,
  ActionIcons,
} from '../components/Icons';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        if (!gymName.trim()) {
          throw new Error('Please enter your gym name');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: gymError } = await supabase.from('gyms').insert({
            owner_id: data.user.id,
            name: gymName.trim(),
            email,
            phone,
            city,
            is_approved: false,
            is_active: true,
          });

          if (gymError) console.log('Gym create error:', gymError);
        }

        setSuccess(
          'Account created successfully! Check your email to verify your account. Your gym will be reviewed by Sankofa Fit admin within 24-48 hours before going live.'
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CITIES = [
    'Accra',
    'Kumasi',
    'Tamale',
    'Takoradi',
    'Cape Coast',
    'Sunyani',
    'Ho',
    'Koforidua',
    'Bolgatanga',
    'Wa',
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080C1C',
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(27,47,107,0.5) 0%, transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        <img
          src="/logo.png"
          alt="Sankofa Fit"
          style={{
            height: 80,
            width: 'auto',
            maxWidth: 220,
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto 24px',
          }}
        />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 24,
          padding: '36px 32px',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 900,
            margin: '0 0 6px 0',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {isSignUp ? (
            <>
              <GymIcon size={24} color="#F5C842" />
              Register Your Gym
            </>
          ) : (
            'Welcome Back'
          )}
        </h2>
        <p
          style={{
            color: '#6B7B99',
            fontSize: 13,
            lineHeight: 1.5,
            textAlign: 'center',
            margin: '0 0 24px 0',
          }}
        >
          {isSignUp
            ? 'Join Sankofa Fit and reach thousands of users across Ghana'
            : 'Sign in to manage your gym, classes and earnings'}
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <StatusIcons.Error size={18} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: 'rgba(48,209,88,0.08)',
              border: '1px solid rgba(48,209,88,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#30D158',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.6,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <StatusIcons.Success size={18} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Gym Name *</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="e.g. FitZone Accra"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0551234567"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gym@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? 'rgba(245,200,66,0.5)' : '#F5C842',
              color: '#1B2F6B',
              border: 'none',
              borderRadius: 14,
              padding: '15px',
              fontSize: 15,
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                  <ActionIcons.Refresh size={18} />
                </span>
                Please wait...
              </>
            ) : isSignUp ? (
              <>
                <AddIcon size={18} />
                Register My Gym
              </>
            ) : (
              <>
                <ActionIcons.ArrowRight size={18} />
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            color: '#6B7B99',
            fontSize: 13,
          }}
        >
          {isSignUp ? 'Already registered? ' : "Don't have an account? "}
          <span
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }
            }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            style={{
              color: '#F5C842',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {isSignUp ? 'Sign In' : 'Register your gym'}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 32,
          maxWidth: 800,
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          {
            Icon: TrendingIcon,
            title: 'Live Dashboard',
            desc: 'Track bookings & revenue',
            color: '#F5C842',
          },
          {
            Icon: GymIcon,
            title: 'Manage Classes',
            desc: 'Set timetables & pricing',
            color: '#8B5CF6',
          },
          {
            Icon: MoneyIcon,
            title: 'Keep 85-90%',
            desc: 'Of every booking made',
            color: '#30D158',
          },
          {
            Icon: UsersIcon,
            title: 'Mobile Reach',
            desc: 'Thousands of users in Ghana',
            color: '#06B6D4',
          },
        ].map((benefit, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              backgroundColor: 'rgba(27,47,107,0.3)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)',
              flex: '1 1 160px',
              maxWidth: 200,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                backgroundColor: `${benefit.color}15`,
                border: `1px solid ${benefit.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <benefit.Icon size={20} color={benefit.color} />
            </div>
            <div>
              <div
                style={{
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                {benefit.title}
              </div>
              <div style={{ color: '#6B7B99', fontSize: 11 }}>{benefit.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        © 2026 Sankofa Fit · Partner Portal · Commission: 15% drop-ins · 10% memberships
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: '#6B7B99',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '13px 16px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
