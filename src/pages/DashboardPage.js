import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  BookingIcon,
  MoneyIcon,
  UsersIcon,
  GymIcon,
  TrendingIcon,
  StatusIcons,
} from '../components/Icons';

export default function DashboardPage({ gym }) {
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    activeMembers: 0,
    totalClasses: 0,
    platformEarnings: 0,
    gymEarnings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!gym?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [bookingsRes, membershipsRes, classesRes] = await Promise.all([
        supabase
          .from('gym_bookings')
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('gym_memberships')
          .select('*')
          .eq('gym_id', gym.id)
          .eq('status', 'active'),
        supabase
          .from('gym_classes')
          .select('*')
          .eq('gym_id', gym.id)
          .eq('is_active', true),
      ]);

      const bookings = bookingsRes.data || [];
      const memberships = membershipsRes.data || [];
      const classes = classesRes.data || [];

      const todayBookings = bookings.filter((b) => b.booking_date?.startsWith(today)).length;

      const weekBookings = bookings.filter((b) => new Date(b.booking_date) >= weekAgo).length;

      const monthRevenue = bookings
        .filter((b) => new Date(b.booking_date) >= monthStart)
        .reduce((sum, b) => sum + (b.amount_ghs || 0), 0);

      const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount_ghs || 0), 0);

      const platformEarnings = totalRevenue * 0.15;
      const gymEarnings = totalRevenue * 0.85;

      setStats({
        todayBookings,
        weekBookings,
        monthRevenue,
        totalRevenue,
        activeMembers: memberships.length,
        totalClasses: classes.length,
        platformEarnings,
        gymEarnings,
      });

      setRecentBookings(bookings.slice(0, 8));
    } catch (e) {
      console.log('Dashboard stats error:', e);
    } finally {
      setLoading(false);
    }
  }, [gym?.id]);

  useEffect(() => {
    if (gym?.id) {
      setLoading(true);
      loadStats();
    } else {
      setLoading(false);
    }
  }, [gym, loadStats]);

  if (!gym) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 60,
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <GymIcon size={32} color="#F5C842" />
        </div>
        <h2 style={{ color: 'white', marginBottom: 8 }}>Complete Your Gym Profile</h2>
        <p style={{ color: '#6B7B99', marginBottom: 24 }}>
          Set up your gym profile to start receiving bookings on Sankofa Fit
        </p>
        <Link
          to="/profile"
          style={{
            backgroundColor: '#F5C842',
            color: '#1B2F6B',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Set Up Profile →
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Bookings",
      value: stats.todayBookings,
      Icon: BookingIcon,
      color: '#F5C842',
      sub: 'class drop-ins today',
    },
    {
      label: 'This Week',
      value: stats.weekBookings,
      Icon: TrendingIcon,
      color: '#8B5CF6',
      sub: 'bookings this week',
    },
    {
      label: 'Month Revenue',
      value: formatCurrency(stats.monthRevenue),
      Icon: MoneyIcon,
      color: '#30D158',
      sub: 'gross this month',
    },
    {
      label: 'Your Earnings',
      value: formatCurrency(stats.gymEarnings),
      Icon: MoneyIcon,
      color: '#06B6D4',
      sub: '85% after commission',
    },
    {
      label: 'Active Members',
      value: stats.activeMembers,
      Icon: UsersIcon,
      color: '#F97316',
      sub: 'current memberships',
    },
    {
      label: 'Active Classes',
      value: stats.totalClasses,
      Icon: GymIcon,
      color: '#EF4444',
      sub: 'classes on platform',
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 900,
              margin: 0,
            }}
          >
            Welcome back!
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            {gym.name} · {gym.city}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: gym.is_approved
              ? 'rgba(48,209,88,0.1)'
              : 'rgba(245,200,66,0.1)',
            border: `1px solid ${
              gym.is_approved ? 'rgba(48,209,88,0.3)' : 'rgba(245,200,66,0.3)'
            }`,
            borderRadius: 10,
            padding: '8px 16px',
            color: gym.is_approved ? '#30D158' : '#F5C842',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {gym.is_approved ? (
            <StatusIcons.Success size={16} />
          ) : (
            <StatusIcons.Warning size={16} />
          )}
          {gym.is_approved ? 'Live on App' : 'Pending Review'}
        </div>
      </div>

      {!gym.is_approved && (
        <div
          style={{
            backgroundColor: 'rgba(245,200,66,0.06)',
            border: '1px solid rgba(245,200,66,0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: 'rgba(245,200,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StatusIcons.Warning size={28} color="#F5C842" />
          </div>
          <div>
            <div
              style={{
                color: '#F5C842',
                fontWeight: 800,
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              Your gym is under review
            </div>
            <div
              style={{
                color: '#6B7B99',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Sankofa Fit admin will review and approve your gym within 24-48 hours. In the
              meantime, you can set up your classes, membership plans and complete your profile.
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'rgba(27,47,107,0.4)',
              borderRadius: 16,
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${card.color}40`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: `${card.color}15`,
                border: `1px solid ${card.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <card.Icon size={22} color={card.color} />
            </div>

            <div
              style={{
                color: card.color,
                fontSize: 24,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: 80,
                    height: 28,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ) : (
                card.value
              )}
            </div>
            <div
              style={{
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              {card.label}
            </div>
            <div style={{ color: '#6B7B99', fontSize: 11 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 800,
              margin: 0,
            }}
          >
            Recent Bookings
          </h2>
          <Link
            to="/bookings"
            style={{
              color: '#F5C842',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: 'rgba(245,200,66,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <BookingIcon size={28} color="#6B7B99" />
            </div>
            <p style={{ color: '#6B7B99' }}>
              No bookings yet. Once your gym is live on Sankofa Fit, bookings will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 600,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {['Class / Session', 'Date & Time', 'Amount', 'Your Cut', 'Ref', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          color: '#6B7B99',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          padding: '10px 16px',
                          textAlign: 'left',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={tdStyle}>{booking.class_name || 'Drop-in'}</td>
                    <td style={{ ...tdStyle, color: '#6B7B99' }}>
                      {formatDate(booking.booking_date)}
                      {booking.class_time && ` · ${booking.class_time}`}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>GHS {booking.amount_ghs}</td>
                    <td style={{ ...tdStyle, color: '#30D158', fontWeight: 700 }}>
                      GHS {((booking.amount_ghs || 0) * 0.85).toFixed(2)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7B99', fontSize: 11 }}>
                      {booking.booking_reference || '—'}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor: 'rgba(48,209,88,0.1)',
                          color: '#30D158',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {booking.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const tdStyle = {
  color: 'white',
  fontSize: 13,
  padding: '13px 16px',
};
