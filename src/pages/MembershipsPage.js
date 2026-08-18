import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  MembershipIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  ActionIcons,
} from '../components/Icons';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MembershipsPage({ gym }) {
  const isMobile = useIsMobile();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price_ghs: '',
    duration_days: 30,
    features: [''],
  });

  const loadPlans = useCallback(async () => {
    if (!gym?.id) return;
    const { data } = await supabase
      .from('gym_membership_plans')
      .select('*')
      .eq('gym_id', gym.id)
      .order('price_ghs', { ascending: true });
    setPlans(data || []);
    setLoading(false);
  }, [gym?.id]);

  useEffect(() => {
    if (gym?.id) {
      setLoading(true);
      loadPlans();
    }
  }, [gym?.id, loadPlans]);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price_ghs: '',
      duration_days: 30,
      features: [''],
    });
    setEditingPlan(null);
    setError('');
  };

  const handleEdit = (plan) => {
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      price_ghs: plan.price_ghs || '',
      duration_days: plan.duration_days || 30,
      features: plan.features?.length ? plan.features : [''],
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const planData = {
        gym_id: gym.id,
        name: form.name.trim(),
        description: form.description.trim(),
        price_ghs: parseFloat(form.price_ghs),
        duration_days: parseInt(form.duration_days, 10),
        features: form.features.filter((f) => f.trim()),
        is_active: true,
      };

      if (editingPlan) {
        const { error: updateError } = await supabase
          .from('gym_membership_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('gym_membership_plans')
          .insert(planData);
        if (insertError) throw insertError;
      }

      await loadPlans();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this membership plan?')) return;
    await supabase.from('gym_membership_plans').update({ is_active: false }).eq('id', id);
    await loadPlans();
  };

  if (!gym) {
    return <p style={{ color: '#6B7B99' }}>Complete your gym profile first.</p>;
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
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>
            Membership Plans
          </h1>
          <p style={{ color: '#6B7B99', marginTop: 4, fontSize: 14 }}>
            Create plans that users can subscribe to
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
          Add Plan
        </button>
      </div>

      {showForm && (
        <div
          style={{
            backgroundColor: 'rgba(27,47,107,0.4)',
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
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>
              {editingPlan ? 'Edit Plan' : 'New Membership Plan'}
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
                color: '#6B7B99',
                cursor: 'pointer',
                display: 'flex',
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
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Plan Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Monthly"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Price (GHS) *</label>
                <input
                  type="number"
                  value={form.price_ghs}
                  onChange={(e) => setForm((p) => ({ ...p, price_ghs: e.target.value }))}
                  placeholder="e.g. 150"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Duration (days)</label>
                <input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => setForm((p) => ({ ...p, duration_days: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What's included in this plan..."
                rows={2}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <label style={labelStyle}>FEATURES</label>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, features: [...p.features, ''] }))}
                  style={{
                    backgroundColor: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.3)',
                    borderRadius: 8,
                    padding: '5px 10px',
                    color: '#F5C842',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add Feature
                </button>
              </div>
              {form.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={feature}
                    onChange={(e) => {
                      const updated = [...form.features];
                      updated[i] = e.target.value;
                      setForm((p) => ({ ...p, features: updated }));
                    }}
                    placeholder="e.g. Unlimited access"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        features: p.features.filter((_, fi) => fi !== i),
                      }))
                    }
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
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
                  color: '#6B7B99',
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
                {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6B7B99' }}>Loading plans...</p>
      ) : plans.length === 0 && !showForm ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: 'rgba(27,47,107,0.3)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
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
            <MembershipIcon size={32} color="#F5C842" />
          </div>
          <h3 style={{ color: 'white', marginBottom: 8 }}>No membership plans yet</h3>
          <p style={{ color: '#6B7B99', marginBottom: 24 }}>Create membership plans for your gym</p>
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
            }}
          >
            + Create First Plan
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                backgroundColor: 'rgba(27,47,107,0.4)',
                borderRadius: 16,
                border: '1px solid rgba(245,200,66,0.2)',
                overflow: 'hidden',
                opacity: plan.is_active === false ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {plan.name}
                    </div>
                    <div style={{ color: '#6B7B99', fontSize: 12 }}>{plan.duration_days} days</div>
                  </div>
                  <div style={{ color: '#F5C842', fontSize: 24, fontWeight: 900 }}>
                    GHS {plan.price_ghs}
                  </div>
                </div>
                {plan.description && (
                  <p
                    style={{
                      color: '#6B7B99',
                      fontSize: 12,
                      marginTop: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </p>
                )}
              </div>

              {plan.features && plan.features.length > 0 && (
                <div style={{ padding: '14px 20px' }}>
                  {plan.features.filter(Boolean).map((f, i) => (
                    <div
                      key={i}
                      style={{
                        color: '#6B7B99',
                        fontSize: 12,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ color: '#30D158' }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}

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
                  onClick={() => handleEdit(plan)}
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
                  onClick={() => handleDelete(plan.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    padding: '8px',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <DeleteIcon size={14} />
                  Delete
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
