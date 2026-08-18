import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import ClassImageUploader from '../components/ClassImageUploader';
import {
  AddIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  GymIcon,
  UsersIcon,
  BookingIcon,
  ActionIcons,
} from '../components/Icons';
import { useIsMobile } from '../hooks/useIsMobile';

const CATEGORIES = [
  'HIIT',
  'Cardio',
  'Aerobics',
  'Cycling / Spin',
  'Jump Rope',
  'Treadmill Class',
  'Strength Training',
  'Weight Lifting',
  'CrossFit',
  'Bodybuilding',
  'Functional Training',
  'Abs & Core',
  'Core Conditioning',
  'Pilates',
  'Planks & Crunches',
  'Yoga',
  'Stretching',
  'Meditation & Yoga',
  'Boxing',
  'Kickboxing',
  'Martial Arts',
  'MMA',
  'Taekwondo',
  'Karate',
  'Zumba',
  'Dance Fitness',
  'Afrobeats Fitness',
  'Swimming',
  'Aqua Aerobics',
  'Football Fitness',
  'Basketball Drills',
  'Athletics',
  'Other',
];

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function normalizeTimeForInput(time) {
  if (!time) return '07:00';
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '07:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function ClassesPage({ gym, userId }) {
  const isMobile = useIsMobile();
  const ownerId = userId || gym?.owner_id;
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    trainer_name: '',
    category: 'HIIT',
    customCategory: '',
    duration_mins: 60,
    max_capacity: 20,
    price_ghs: '',
    schedule: [],
  });

  const loadClasses = useCallback(async () => {
    if (!gym?.id) return;
    const { data } = await supabase
      .from('gym_classes')
      .select('*')
      .eq('gym_id', gym.id)
      .order('created_at', { ascending: false });
    setClasses(data || []);
    setLoading(false);
  }, [gym?.id]);

  useEffect(() => {
    if (gym?.id) {
      setLoading(true);
      loadClasses();
    }
  }, [gym?.id, loadClasses]);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      trainer_name: '',
      category: 'HIIT',
      customCategory: '',
      duration_mins: 60,
      max_capacity: 20,
      price_ghs: '',
      schedule: [],
    });
    setEditingClass(null);
    setError('');
  };

  const handleEdit = (cls) => {
    const isCustomCategory = !CATEGORIES.filter((c) => c !== 'Other').includes(cls.category);

    setForm({
      name: cls.name || '',
      description: cls.description || '',
      trainer_name: cls.trainer_name || '',
      category: isCustomCategory ? 'Other' : cls.category || 'HIIT',
      customCategory: isCustomCategory ? cls.category : '',
      duration_mins: cls.duration_mins || 60,
      max_capacity: cls.max_capacity || 20,
      price_ghs: cls.price_ghs || '',
      schedule: (cls.schedule || []).map((slot) => ({
        day: slot.day,
        time: normalizeTimeForInput(slot.time),
      })),
    });
    setEditingClass(cls);
    setShowForm(true);
  };

  const addScheduleSlot = () => {
    setForm((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { day: 'Monday', time: '07:00' }],
    }));
  };

  const updateScheduleSlot = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.schedule];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedule: updated };
    });
  };

  const removeScheduleSlot = (index) => {
    setForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const finalCategory =
      form.category === 'Other' ? form.customCategory.trim() : form.category;

    if (!finalCategory) {
      setError('Please enter a category name');
      return;
    }
    if (!form.name.trim()) {
      setError('Class name is required');
      return;
    }
    if (!form.price_ghs) {
      setError('Price is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const classData = {
        gym_id: gym.id,
        name: form.name.trim(),
        description: form.description.trim(),
        trainer_name: form.trainer_name.trim(),
        category: finalCategory,
        duration_mins: parseInt(form.duration_mins, 10),
        max_capacity: parseInt(form.max_capacity, 10),
        price_ghs: parseFloat(form.price_ghs),
        schedule: form.schedule,
        is_active: true,
      };

      if (editingClass) {
        const { error: updateError } = await supabase
          .from('gym_classes')
          .update(classData)
          .eq('id', editingClass.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('gym_classes').insert(classData);
        if (insertError) throw insertError;
      }

      await loadClasses();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cls) => {
    await supabase.from('gym_classes').update({ is_active: !cls.is_active }).eq('id', cls.id);
    await loadClasses();
  };

  if (!gym) {
    return <p style={{ color: 'var(--text-secondary)' }}>Complete your gym profile first.</p>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 900, margin: 0 }}>
            Classes & Timetable
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            {classes.length} class{classes.length !== 1 ? 'es' : ''} listed
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            backgroundColor: '#F5C842',
            color: '#1B2F6B',
            border: 'none',
            borderRadius: 12,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AddIcon size={18} />
          Add Class
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 20,
            padding: 28,
            marginBottom: 24,
            border: '1px solid rgba(245,200,66,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, margin: 0 }}>
              {editingClass ? 'Edit Class' : 'New Class'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <ActionIcons.Close size={22} />
            </button>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
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

          <form onSubmit={handleSave}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Class Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Morning HIIT"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Trainer Name</label>
                <input
                  value={form.trainer_name}
                  onChange={(e) => setForm((p) => ({ ...p, trainer_name: e.target.value }))}
                  placeholder="e.g. Kofi Mensah"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe this class..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      category: e.target.value,
                      customCategory: '',
                    }))
                  }
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  <optgroup
                    label="── Cardio & Conditioning"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['HIIT', 'Cardio', 'Aerobics', 'Cycling / Spin', 'Jump Rope', 'Treadmill Class'].map(
                      (c) => (
                        <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                          {c}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup
                    label="── Strength & Muscle"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {[
                      'Strength Training',
                      'Weight Lifting',
                      'CrossFit',
                      'Bodybuilding',
                      'Functional Training',
                    ].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="── Core & Abs"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['Abs & Core', 'Core Conditioning', 'Pilates', 'Planks & Crunches'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="── Flexibility & Mind"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['Yoga', 'Stretching', 'Meditation & Yoga'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="── Combat & Martial Arts"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['Boxing', 'Kickboxing', 'Martial Arts', 'MMA', 'Taekwondo', 'Karate'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="── Dance & Fun"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['Zumba', 'Dance Fitness', 'Afrobeats Fitness'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Aqua" style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}>
                    {['Swimming', 'Aqua Aerobics'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="── Sport Specific"
                    style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}
                  >
                    {['Football Fitness', 'Basketball Drills', 'Athletics'].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: '#0D1B45' }}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── Other" style={{ backgroundColor: '#0D1B45', color: '#F5C842' }}>
                    <option value="Other" style={{ backgroundColor: '#0D1B45' }}>
                      Other (type your own)
                    </option>
                  </optgroup>
                </select>
                {form.category === 'Other' ? (
                  <div style={{ marginTop: 10 }}>
                    <input
                      value={form.customCategory}
                      onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                      placeholder="Enter your class category name..."
                      style={{
                        ...inputStyle,
                        borderColor: 'rgba(245,200,66,0.4)',
                      }}
                      required
                    />
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        marginTop: 6,
                      }}
                    >
                      Type a custom category name for your class
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <label style={labelStyle}>Duration (mins)</label>
                <input
                  type="number"
                  value={form.duration_mins}
                  onChange={(e) => setForm((p) => ({ ...p, duration_mins: e.target.value }))}
                  min={15}
                  max={180}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Max Capacity</label>
                <input
                  type="number"
                  value={form.max_capacity}
                  onChange={(e) => setForm((p) => ({ ...p, max_capacity: e.target.value }))}
                  min={1}
                  max={200}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Price (GHS) *</label>
                <input
                  type="number"
                  value={form.price_ghs}
                  onChange={(e) => setForm((p) => ({ ...p, price_ghs: e.target.value }))}
                  placeholder="e.g. 30"
                  min={1}
                  step="0.01"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <label style={labelStyle}>CLASS SCHEDULE</label>
                <button
                  type="button"
                  onClick={addScheduleSlot}
                  style={{
                    backgroundColor: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.3)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#F5C842',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add Time Slot
                </button>
              </div>

              {form.schedule.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 16,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  No schedule set. Click &quot;+ Add Time Slot&quot; to add class times.
                </div>
              )}

              {form.schedule.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <select
                    value={slot.day}
                    onChange={(e) => updateScheduleSlot(index, 'day', e.target.value)}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      appearance: 'none',
                    }}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d} style={{ backgroundColor: '#0D1B45' }}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => updateScheduleSlot(index, 'time', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeScheduleSlot(index)}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <ActionIcons.Close size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: '11px 20px',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: '#F5C842',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  color: '#1B2F6B',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingClass ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading classes...</p>
      ) : classes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: 'rgba(245,200,66,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <GymIcon size={32} color="#F5C842" />
          </div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No classes yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Add your first class to start receiving bookings
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#F5C842',
              color: '#1B2F6B',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AddIcon size={18} />
            Add Your First Class
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {classes.map((cls) => (
            <div
              key={cls.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 16,
                border: `1px solid ${
                  cls.is_active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)'
                }`,
                overflow: 'hidden',
                opacity: cls.is_active ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 16,
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    {cls.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={tagStyle('#8B5CF6')}>{cls.category}</span>
                    <span style={tagStyle('#06B6D4')}>{cls.duration_mins} mins</span>
                    <span style={tagStyle(cls.is_active ? '#30D158' : '#EF4444')}>
                      {cls.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    color: '#F5C842',
                    fontSize: 18,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  GHS {cls.price_ghs}
                </div>
              </div>

              <div style={{ padding: '14px 20px' }}>
                {cls.trainer_name && (
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <UsersIcon size={14} />
                    {cls.trainer_name}
                  </div>
                )}
                {cls.description && (
                  <div
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {cls.description}
                  </div>
                )}
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UsersIcon size={14} />
                  Max {cls.max_capacity} people
                </div>

                {cls.schedule && cls.schedule.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        color: '#F5C842',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        marginBottom: 6,
                      }}
                    >
                      SCHEDULE
                    </div>
                    {cls.schedule.map((slot, i) => (
                      <div
                        key={i}
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          marginBottom: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <BookingIcon size={13} color="#6B7B99" />
                        {slot.day} · {slot.time}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  CLASS PHOTOS (up to 3)
                </div>
                <ClassImageUploader
                  classId={cls.id}
                  gymId={gym.id}
                  userId={ownerId}
                  existingImages={cls.images || []}
                  onImagesUpdate={(newImages) => {
                    setClasses((prev) =>
                      prev.map((c) =>
                        c.id === cls.id
                          ? { ...c, images: newImages, image_url: newImages[0] }
                          : c
                      )
                    );
                  }}
                />
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleEdit(cls)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.3)',
                    borderRadius: 8,
                    padding: '8px',
                    color: '#F5C842',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <EditIcon size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(cls)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: cls.is_active
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(48,209,88,0.1)',
                    border: `1px solid ${
                      cls.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(48,209,88,0.3)'
                    }`,
                    borderRadius: 8,
                    padding: '8px',
                    color: cls.is_active ? '#EF4444' : '#30D158',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {cls.is_active ? (
                    <>
                      <CloseIcon size={14} /> Deactivate
                    </>
                  ) : (
                    <>
                      <CheckIcon size={14} /> Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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

const tagStyle = (color) => ({
  backgroundColor: `${color}18`,
  color: color,
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
  border: `1px solid ${color}30`,
});
