import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiStoreLine,
  RiCalendarEventLine,
  RiMoneyDollarCircleLine,
  RiSettings3Line,
  RiBankCardLine,
  RiCloseLine,
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';

const NAV_ITEMS = [
  { path: '/', Icon: RiDashboardLine, label: 'Dashboard' },
  { path: '/classes', Icon: MdFitnessCenter, label: 'Classes' },
  { path: '/memberships', Icon: RiBankCardLine, label: 'Memberships' },
  { path: '/bookings', Icon: RiCalendarEventLine, label: 'Bookings' },
  { path: '/earnings', Icon: RiMoneyDollarCircleLine, label: 'Earnings' },
  { path: '/profile', Icon: RiStoreLine, label: 'Gym Profile' },
  { path: '/settings', Icon: RiSettings3Line, label: 'Settings' },
];

export default function Sidebar({ gym, isOpen, isMobile, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        backgroundColor: '#0D1B45',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
        boxShadow: isMobile ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <img
          src="/logo.png"
          alt="Sankofa Fit"
          style={{
            height: 48,
            width: 'auto',
            maxWidth: 160,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7B99',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <RiCloseLine size={20} />
          </button>
        )}
      </div>

      {gym && (
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {gym.cover_image_url ? (
                <img
                  src={gym.cover_image_url}
                  alt={gym.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <MdFitnessCenter size={22} color="#F5C842" />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {gym.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: gym.is_approved === true ? '#30D158' : '#F5C842',
                }}
              >
                {gym.is_approved === true ? '● Live on App' : '● Pending Review'}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={() => isMobile && onClose()}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              color: isActive ? '#F5C842' : '#6B7B99',
              backgroundColor: isActive ? 'rgba(245,200,66,0.08)' : 'transparent',
              borderRight: isActive ? '3px solid #F5C842' : '3px solid transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 700 : 400,
              transition: 'all 0.15s',
            })}
          >
            <item.Icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Sankofa Fit Gym Portal v1.0
      </div>
    </div>
  );
}
