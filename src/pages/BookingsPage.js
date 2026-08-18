import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/formatters';
import { BookingIcon } from '../components/Icons';

export default function BookingsPage({ gym }) {
  const [bookings, setBookings] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes');
  const [search, setSearch] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      if (!gym?.id) return;

      console.log('Loading bookings for gym:', gym.id);

      const { data, error } = await supabase
        .from('gym_bookings')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false });

      console.log('Bookings:', data?.length);
      console.log('Error:', error);

      setBookings(data || []);

      const { data: memberData, error: memberError } = await supabase
        .from('gym_memberships')
        .select('*')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false });

      if (memberError) {
        console.log('Memberships error:', memberError);
      }

      setMemberships(memberData || []);
    } catch (e) {
      console.log('loadBookings error:', e);
    } finally {
      setLoading(false);
    }
  }, [gym?.id]);

  useEffect(() => {
    if (gym?.id) {
      setLoading(true);
      loadBookings();
    }
  }, [gym?.id, loadBookings]);

  const filtered = (activeTab === 'classes' ? bookings : memberships).filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.class_name?.toLowerCase().includes(s) ||
      b.membership_type?.toLowerCase().includes(s) ||
      b.booking_reference?.toLowerCase().includes(s) ||
      b.membership_reference?.toLowerCase().includes(s)
    );
  });

  const classHeaders = [
    'Class',
    'Date',
    'Time',
    'Amount',
    'Your Cut',
    'Reference',
    'Status',
  ];
  const memberHeaders = [
    'Type',
    'Start Date',
    'End Date',
    'Amount',
    'Your Cut',
    'Reference',
    'Status',
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Bookings</h1>
        <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
          {bookings.length} class bookings · {memberships.length} memberships
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          backgroundColor: 'rgba(27,47,107,0.4)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
          width: 'fit-content',
        }}
      >
        {[
          { id: 'classes', label: `Classes (${bookings.length})` },
          { id: 'memberships', label: `Memberships (${memberships.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              backgroundColor: activeTab === tab.id ? '#F5C842' : 'transparent',
              color: activeTab === tab.id ? '#1B2F6B' : '#6B7B99',
              border: 'none',
              borderRadius: 9,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by class name or reference..."
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '12px 16px',
          color: 'white',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 20,
        }}
      />

      <div
        style={{
          backgroundColor: 'rgba(27,47,107,0.3)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <p style={{ color: '#6B7B99', textAlign: 'center', padding: 40 }}>Loading bookings...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
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
              {search
                ? 'No bookings match your search'
                : `No ${activeTab} bookings yet`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 650,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  {(activeTab === 'classes' ? classHeaders : memberHeaders).map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr
                    key={item.id || i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td style={tdStyle}>{item.class_name || item.membership_type || '—'}</td>
                    <td style={{ ...tdStyle, color: '#6B7B99' }}>
                      {formatDate(item.booking_date || item.start_date)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7B99' }}>
                      {activeTab === 'classes'
                        ? item.class_time || '—'
                        : formatDate(item.end_date)}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>GHS {item.amount_ghs}</td>
                    <td style={{ ...tdStyle, color: '#30D158', fontWeight: 700 }}>
                      GHS {((item.amount_ghs || 0) * 0.85).toFixed(2)}
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7B99', fontSize: 11 }}>
                      {item.booking_reference || item.membership_reference || '—'}
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
                        {item.status || 'Confirmed'}
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
