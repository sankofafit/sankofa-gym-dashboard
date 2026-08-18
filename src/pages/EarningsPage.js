import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import {
  MoneyIcon,
  TrendingIcon,
  FireIcon,
  BookingIcon,
  StatusIcons,
  MembershipIcon,
} from '../components/Icons';

export default function EarningsPage({ gym }) {
  const [earnings, setEarnings] = useState({
    totalGross: 0,
    totalPlatform: 0,
    totalGym: 0,
    thisMonthGross: 0,
    thisMonthGym: 0,
    lastMonthGym: 0,
    byMonth: [],
  });
  const [loading, setLoading] = useState(true);

  const loadEarnings = useCallback(async () => {
    if (!gym?.id) return;
    try {
      console.log('Loading earnings for gym:', gym.id);

      const { data: bookings, error: bookingsError } = await supabase
        .from('gym_bookings')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false });

      console.log('Bookings:', bookings?.length);
      console.log('Error:', bookingsError);

      const classBookings = (bookings || []).filter((b) => b.status !== 'cancelled');

      const { data: memberships, error: membershipsError } = await supabase
        .from('gym_memberships')
        .select('amount_ghs, start_date, created_at, status')
        .eq('gym_id', gym.id);

      if (membershipsError) {
        console.log('Memberships error:', membershipsError);
      }

      const activeMemberships = (memberships || []).filter((m) => m.status !== 'cancelled');

      const allTransactions = [
        ...classBookings.map((b) => ({
          amount: b.amount_ghs || 0,
          date: b.booking_date || b.created_at,
          type: 'Class Booking',
          commission: 0.15,
        })),
        ...activeMemberships.map((m) => ({
          amount: m.amount_ghs || 0,
          date: m.start_date || m.created_at,
          type: 'Membership',
          commission: 0.1,
        })),
      ];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const totalGross = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalPlatform = allTransactions.reduce(
        (sum, t) => sum + t.amount * t.commission,
        0
      );
      const totalGym = totalGross - totalPlatform;

      const thisMonthTx = allTransactions.filter((t) => new Date(t.date) >= monthStart);
      const thisMonthGross = thisMonthTx.reduce((sum, t) => sum + t.amount, 0);
      const thisMonthGym = thisMonthTx.reduce(
        (sum, t) => sum + t.amount * (1 - t.commission),
        0
      );

      const lastMonthTx = allTransactions.filter((t) => {
        const d = new Date(t.date);
        return d >= lastMonthStart && d <= lastMonthEnd;
      });
      const lastMonthGym = lastMonthTx.reduce(
        (sum, t) => sum + t.amount * (1 - t.commission),
        0
      );

      const byMonth = {};
      allTransactions.forEach((t) => {
        const key = new Date(t.date).toLocaleDateString('en-GB', {
          month: 'short',
          year: 'numeric',
        });
        if (!byMonth[key]) {
          byMonth[key] = { gross: 0, gym: 0, platform: 0 };
        }
        const gymCut = t.amount * (1 - t.commission);
        const platCut = t.amount * t.commission;
        byMonth[key].gross += t.amount;
        byMonth[key].gym += gymCut;
        byMonth[key].platform += platCut;
      });

      setEarnings({
        totalGross,
        totalPlatform,
        totalGym,
        thisMonthGross,
        thisMonthGym,
        lastMonthGym,
        byMonth: Object.entries(byMonth).map(([month, data]) => ({
          month,
          ...data,
        })),
      });
    } catch (e) {
      console.log('loadEarnings error:', e);
    } finally {
      setLoading(false);
    }
  }, [gym?.id]);

  useEffect(() => {
    if (gym?.id) {
      setLoading(true);
      loadEarnings();
    } else {
      setLoading(false);
    }
  }, [gym, loadEarnings]);

  const statCards = [
    {
      label: 'Your Earnings This Month',
      value: formatCurrency(earnings.thisMonthGym),
      Icon: MoneyIcon,
      color: '#30D158',
      sub: `From GHS ${earnings.thisMonthGross.toFixed(2)} gross`,
    },
    {
      label: 'Last Month Earnings',
      value: formatCurrency(earnings.lastMonthGym),
      Icon: BookingIcon,
      color: '#06B6D4',
      sub: 'Previous month total',
    },
    {
      label: 'All Time Earnings',
      value: formatCurrency(earnings.totalGym),
      Icon: TrendingIcon,
      color: '#F5C842',
      sub: `${formatCurrency(earnings.totalGross)} gross total`,
    },
    {
      label: 'Platform Commission',
      value: formatCurrency(earnings.totalPlatform),
      Icon: FireIcon,
      color: '#8B5CF6',
      sub: 'Sankofa Fit total cut',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Earnings</h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          Your revenue breakdown from Sankofa Fit
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(245,200,66,0.06)',
          border: '1px solid rgba(245,200,66,0.2)',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13,
          color: '#6B7B99',
        }}
      >
        <StatusIcons.Info size={20} color="#F5C842" />
        <span>
          <strong style={{ color: '#F5C842' }}>Commission structure: </strong>
          Drop-in / Class bookings: you keep <strong style={{ color: 'white' }}>85%</strong> ·
          Memberships: you keep <strong style={{ color: 'white' }}>90%</strong>
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'rgba(27,47,107,0.4)',
              borderRadius: 16,
              padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
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
                fontSize: 22,
                fontWeight: 900,
                marginBottom: 4,
              }}
            >
              {loading ? '...' : card.value}
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
          padding: 24,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          Monthly Breakdown
        </h2>

        {earnings.byMonth.length === 0 ? (
          <p style={{ color: '#6B7B99', textAlign: 'center', padding: 20 }}>
            No earnings data yet. Earnings will appear here once bookings are made.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 500,
              }}
            >
            <thead>
              <tr>
                {['Month', 'Gross Revenue', 'Platform Cut', 'Your Earnings'].map((h) => (
                  <th
                    key={h}
                    style={{
                      color: '#6B7B99',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1,
                      padding: '8px 12px',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earnings.byMonth.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <td style={tdStyle}>{row.month}</td>
                  <td style={tdStyle}>{formatCurrency(row.gross)}</td>
                  <td style={{ ...tdStyle, color: '#8B5CF6' }}>
                    {formatCurrency(row.platform)}
                  </td>
                  <td style={{ ...tdStyle, color: '#30D158', fontWeight: 700 }}>
                    {formatCurrency(row.gym)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 14,
          padding: '16px 20px',
          marginTop: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#6B7B99',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'white', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <MembershipIcon size={16} color="#F5C842" />
          Payout Information:
        </strong>{' '}
        Earnings are paid out to your registered mobile money number at the end of each month. Make
        sure your MoMo number is up to date in your{' '}
        <Link to="/profile" style={{ color: '#F5C842', fontWeight: 700 }}>
          Gym Profile
        </Link>
        .
      </div>
    </div>
  );
}

const tdStyle = {
  color: 'white',
  fontSize: 13,
  padding: '12px',
};
