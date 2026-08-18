import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ImageUploader from '../components/ImageUploader';
import {
  ImageIcon,
  GymIcon,
  CheckIcon,
  TimeIcon,
  MoneyIcon,
  StatusIcons,
  ActionIcons,
  FitnessIcons,
} from '../components/Icons';
import { useIsMobile } from '../hooks/useIsMobile';

const AMENITIES_LIST = [
  'Parking',
  'Locker Rooms',
  'Showers',
  'Pool',
  'Sauna',
  'Café',
  'WiFi',
  'AC',
  'Childcare',
  'Personal Training',
  'Group Classes',
  'Cardio Area',
  'Free Weights',
  'Weight Machines',
  'Boxing Ring',
  'Yoga Studio',
  'Cycling Room',
];

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

const defaultHours = {
  monday: '6:00 AM - 10:00 PM',
  tuesday: '6:00 AM - 10:00 PM',
  wednesday: '6:00 AM - 10:00 PM',
  thursday: '6:00 AM - 10:00 PM',
  friday: '6:00 AM - 10:00 PM',
  saturday: '7:00 AM - 8:00 PM',
  sunday: '8:00 AM - 6:00 PM',
};

export default function ProfilePage({ gym, setGym, userId }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Accra',
    phone: '',
    email: '',
    website: '',
    maps_link: '',
    amenities: [],
    opening_hours: { ...defaultHours },
    momo_provider: 'MTN',
    momo_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (gym) {
      setForm({
        name: gym.name || '',
        description: gym.description || '',
        address: gym.address || '',
        city: gym.city || 'Accra',
        phone: gym.phone || '',
        email: gym.email || '',
        website: gym.website || '',
        maps_link: gym.maps_link || '',
        amenities: gym.amenities || [],
        opening_hours: gym.opening_hours || { ...defaultHours },
        momo_provider: gym.momo_provider || 'MTN',
        momo_number: gym.momo_number || '',
      });
    }
  }, [gym]);

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city,
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        maps_link: form.maps_link.trim(),
        amenities: form.amenities,
        opening_hours: form.opening_hours,
        momo_provider: form.momo_provider,
        momo_number: form.momo_number.trim(),
        updated_at: new Date().toISOString(),
      };

      if (gym?.id) {
        const { error: updateError } = await supabase
          .from('gyms')
          .update(updateData)
          .eq('id', gym.id);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('gyms')
          .insert({ ...updateData, owner_id: userId, is_approved: false, is_active: true })
          .select()
          .single();
        if (insertError) throw insertError;
        setGym(data);
      }

      setSuccess('Profile saved successfully!');

      const { data: updated } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_id', userId)
        .single();
      if (updated) setGym(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, margin: 0 }}>Gym Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          This information appears on the Sankofa Fit app
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: 14,
            color: '#EF4444',
            fontSize: 13,
            marginBottom: 20,
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
            padding: 14,
            color: '#30D158',
            fontSize: 13,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <StatusIcons.Success size={18} style={{ flexShrink: 0 }} />
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>
        {gym?.id && (
          <Section title="Gym Photos" icon={ImageIcon}>
            <ImageUploader
              gymId={gym.id}
              userId={userId}
              existingImages={gym.images || []}
              coverImage={gym.cover_image_url || ''}
              onImagesUpdate={(newImages) => {
                setGym((prev) => ({ ...prev, images: newImages }));
              }}
              onCoverUpdate={(newCover) => {
                setGym((prev) => ({
                  ...prev,
                  cover_image_url: newCover,
                }));
              }}
            />
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              <StatusIcons.Warning size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              Upload a cover photo and gallery images. These appear on the Sankofa Fit app.
            </p>
          </Section>
        )}

        <Section title="Basic Information" icon={GymIcon}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Gym Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. FitZone Accra"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0551234567"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Tell potential members about your gym..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: 16,
              marginTop: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. 123 Liberation Road, Airport"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                }}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Website (optional)</label>
            <input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://www.yourgym.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Google Maps Link</label>
            <input
              value={form.maps_link || ''}
              onChange={(e) => setForm((p) => ({ ...p, maps_link: e.target.value }))}
              placeholder="https://maps.google.com/..."
              style={inputStyle}
            />
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Go to Google Maps → find your gym → tap Share → Copy link. Paste it here. Users can
              tap to get directions directly.
            </div>
          </div>
        </Section>

        <Section title="Amenities & Facilities" icon={CheckIcon}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Select all amenities available at your gym
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {AMENITIES_LIST.map((amenity) => {
              const selected = form.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  style={{
                    backgroundColor: selected
                      ? 'rgba(245,200,66,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${
                      selected ? 'rgba(245,200,66,0.5)' : 'rgba(255,255,255,0.1)'
                    }`,
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: selected ? '#F5C842' : '#6B7B99',
                    fontSize: 13,
                    fontWeight: selected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {selected ? '✓ ' : ''}
                  {amenity}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Opening Hours" icon={TimeIcon}>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Set your opening hours for each day. Toggle days as Closed or 24 Hours.
          </p>

          {Object.entries(form.opening_hours).map(([day, hours]) => {
            const isClosed = hours === 'Closed';
            const is24Hours = hours === '24 Hours';

            return (
              <div
                key={day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    width: 100,
                    textTransform: 'capitalize',
                    flexShrink: 0,
                  }}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>

                {isClosed ? (
                  <div
                    style={{
                      flex: 1,
                      color: '#EF4444',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Closed
                  </div>
                ) : is24Hours ? (
                  <div
                    style={{
                      flex: 1,
                      color: '#30D158',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Open 24 Hours
                  </div>
                ) : (
                  <input
                    value={hours}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        opening_hours: {
                          ...p.opening_hours,
                          [day]: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. 6:00 AM - 10:00 PM"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        opening_hours: {
                          ...p.opening_hours,
                          [day]: is24Hours ? '6:00 AM - 10:00 PM' : '24 Hours',
                        },
                      }))
                    }
                    style={{
                      backgroundColor: is24Hours
                        ? 'rgba(48,209,88,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${
                        is24Hours ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.1)'
                      }`,
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: is24Hours ? '#30D158' : '#6B7B99',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    24hrs
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        opening_hours: {
                          ...p.opening_hours,
                          [day]: isClosed ? '6:00 AM - 10:00 PM' : 'Closed',
                        },
                      }))
                    }
                    style={{
                      backgroundColor: isClosed
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${
                        isClosed ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'
                      }`,
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: isClosed ? '#EF4444' : '#6B7B99',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Closed
                  </button>
                </div>
              </div>
            );
          })}

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
                alignSelf: 'center',
                marginRight: 4,
              }}
            >
              Quick set:
            </span>

            <button
              type="button"
              onClick={() => {
                const allDay = {};
                Object.keys(form.opening_hours).forEach((d) => {
                  allDay[d] = '24 Hours';
                });
                setForm((p) => ({ ...p, opening_hours: allDay }));
              }}
              style={{
                backgroundColor: 'rgba(48,209,88,0.1)',
                border: '1px solid rgba(48,209,88,0.3)',
                borderRadius: 8,
                padding: '7px 14px',
                color: '#30D158',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FitnessIcons.Sun size={14} />
              All 24 Hours
            </button>

            <button
              type="button"
              onClick={() => {
                const weekdays = {
                  monday: '6:00 AM - 10:00 PM',
                  tuesday: '6:00 AM - 10:00 PM',
                  wednesday: '6:00 AM - 10:00 PM',
                  thursday: '6:00 AM - 10:00 PM',
                  friday: '6:00 AM - 10:00 PM',
                  saturday: '7:00 AM - 8:00 PM',
                  sunday: '8:00 AM - 6:00 PM',
                };
                setForm((p) => ({ ...p, opening_hours: weekdays }));
              }}
              style={{
                backgroundColor: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.3)',
                borderRadius: 8,
                padding: '7px 14px',
                color: '#F5C842',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TimeIcon size={14} />
              Standard Hours
            </button>

            <button
              type="button"
              onClick={() => {
                setForm((p) => ({
                  ...p,
                  opening_hours: {
                    ...p.opening_hours,
                    sunday: 'Closed',
                  },
                }));
              }}
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '7px 14px',
                color: '#EF4444',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <StatusIcons.Offline size={14} />
              Close Sundays
            </button>
          </div>
        </Section>

        <Section title="Payout Details" icon={MoneyIcon}>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Your earnings (85% of bookings) will be sent to this mobile money number after Sankofa
            Fit admin processes payouts.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>MoMo Provider</label>
              <select
                value={form.momo_provider}
                onChange={(e) => setForm((p) => ({ ...p, momo_provider: e.target.value }))}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                }}
              >
                {['MTN', 'Vodafone', 'AirtelTigo'].map((p) => (
                  <option key={p} value={p} style={{ backgroundColor: '#0D1B45' }}>
                    {p} MoMo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mobile Money Number</label>
              <input
                value={form.momo_number}
                onChange={(e) => setForm((p) => ({ ...p, momo_number: e.target.value }))}
                placeholder="e.g. 0551234567"
                style={inputStyle}
              />
            </div>
          </div>
        </Section>

        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: '#F5C842',
            color: '#1B2F6B',
            border: 'none',
            borderRadius: 14,
            padding: '16px 32px',
            fontSize: 15,
            fontWeight: 900,
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
            width: '100%',
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                <ActionIcons.Refresh size={18} />
              </span>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon size={18} />
              Save Profile
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {Icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: 'rgba(245,200,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} color="#F5C842" />
          </div>
        )}
        <h3
          style={{
            color: '#F5C842',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  marginBottom: 8,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
