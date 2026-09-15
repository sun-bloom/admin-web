// admin-web/src/pages/settings/DeliverySettings.tsx
// State → City → Pincode Range → Delivery Charge → Enabled
// Pincode is the PRIMARY key for delivery matching.

import React, { useEffect, useState, useCallback } from 'react';
import { deliveryApi } from '../../lib/api';
import type { DeliveryRegion } from '../../types';
import {
  MapPin, Plus, Pencil, Trash2, CheckCircle2, XCircle,
  AlertTriangle, ToggleLeft, ToggleRight, Loader2, RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface RegionForm {
  state: string;
  city: string;
  pincodeStart: string;
  pincodeEnd: string;
  deliveryCharge: string;
  isEnabled: boolean;
}

const emptyForm = (): RegionForm => ({
  state: '',
  city: '',
  pincodeStart: '',
  pincodeEnd: '',
  deliveryCharge: '',
  isEnabled: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const DeliverySettings: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [regions, setRegions]         = useState<DeliveryRegion[]>([]);
  const [states, setStates]           = useState<string[]>([]);
  const [cities, setCities]           = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);

  // Edit mode
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState<RegionForm>(emptyForm());

  // Delete confirmation
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  // Cities are loaded on state selection
  const [citiesLoading, setCitiesLoading] = useState(false);

  // ── Load regions & geo data ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, geoStates] = await Promise.all([
        deliveryApi.getAdminRegions().catch(() => deliveryApi.getAll()),
        deliveryApi.getGeoStates().catch(() => []),
      ]);
      setRegions(settingsData.regions || []);
      setStates(geoStates);
    } catch (e: any) {
      setError(e.message || 'Failed to load delivery settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Load cities when state changes ────────────────────────────────────────
  useEffect(() => {
    if (!form.state) { setCities([]); return; }
    setCitiesLoading(true);
    deliveryApi.getGeoCities(form.state)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [form.state]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const validateForm = (): string | null => {
    if (!form.state.trim()) return 'State is required.';
    if (!form.city.trim())  return 'City is required.';
    const start = parseInt(form.pincodeStart, 10);
    const end   = parseInt(form.pincodeEnd,   10);
    if (!/^\d{6}$/.test(form.pincodeStart)) return 'Pincode Start must be a 6-digit number.';
    if (!/^\d{6}$/.test(form.pincodeEnd))   return 'Pincode End must be a 6-digit number.';
    if (end < start)                         return 'Pincode End must be ≥ Pincode Start.';
    const charge = parseFloat(form.deliveryCharge);
    if (isNaN(charge) || charge < 0)         return 'Delivery Charge must be a non-negative number.';
    return null;
  };

  // ── Form change handlers ──────────────────────────────────────────────────
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, state: e.target.value, city: '' }));
    setCities([]);
  };

  const handlePincodeStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setForm(f => ({ ...f, pincodeStart: val, pincodeEnd: f.pincodeEnd || val }));
  };

  // ── Start edit ────────────────────────────────────────────────────────────
  const startEdit = async (region: DeliveryRegion) => {
    setEditId(region.id);
    setError(null);
    setForm({
      state:          region.state  || '',
      city:           region.city   || '',
      pincodeStart:   region.pincodeStart,
      pincodeEnd:     region.pincodeEnd,
      deliveryCharge: String(region.deliveryCharge),
      isEnabled:      region.isEnabled,
    });
    // Pre-load cities for the selected state
    if (region.state) {
      setCitiesLoading(true);
      deliveryApi.getGeoCities(region.state).then(setCities).catch(() => setCities([])).finally(() => setCitiesLoading(false));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(emptyForm());
    setCities([]);
    setError(null);
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError(null);

    const payload = {
      state:          form.state.trim(),
      city:           form.city.trim(),
      pincodeStart:   form.pincodeStart.trim(),
      pincodeEnd:     form.pincodeEnd.trim(),
      deliveryCharge: parseFloat(form.deliveryCharge),
      isEnabled:      form.isEnabled,
    };

    try {
      if (editId) {
        await deliveryApi.updateManagedRegion(editId, payload);
        showSuccess(`Region updated: ${payload.city}, ${payload.state} [${payload.pincodeStart}–${payload.pincodeEnd}]`);
      } else {
        await deliveryApi.createManagedRegion(payload);
        showSuccess(`Region added: ${payload.city}, ${payload.state} [${payload.pincodeStart}–${payload.pincodeEnd}]`);
      }
      cancelEdit();
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to save region.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle enable/disable ──────────────────────────────────────────────────
  const handleToggle = async (region: DeliveryRegion) => {
    try {
      await deliveryApi.updateManagedRegion(region.id, { isEnabled: !region.isEnabled });
      showSuccess(`Region ${!region.isEnabled ? 'enabled' : 'disabled'}.`);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to toggle region.');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deliveryApi.deleteManagedRegion(deleteId);
      showSuccess('Region deleted.');
      setDeleteId(null);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to delete region.');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-600" />
            Delivery Regions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure delivery areas by <strong>State → City → Pincode Range</strong>. Pincode is the primary matching key.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          {editId ? <><Pencil className="w-4 h-4 text-amber-600" /> Edit Region</> : <><Plus className="w-4 h-4 text-amber-600" /> Add New Region</>}
        </h2>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Row 1: State + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.state}
                onChange={handleStateChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">— Select State —</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              {cities.length > 0 ? (
                <select
                  required
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  disabled={!form.state || citiesLoading}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                >
                  <option value="">{citiesLoading ? 'Loading…' : '— Select City —'}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder={!form.state ? 'Select state first' : 'Type city name'}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              )}
            </div>
          </div>

          {/* Row 2: Pincode Start + Pincode End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Pincode Start <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
                value={form.pincodeStart}
                onChange={handlePincodeStartChange}
                placeholder="e.g. 641601"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <p className="text-[11px] text-gray-400 mt-1">For exact pincode, set Start = End</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Pincode End <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
                value={form.pincodeEnd}
                onChange={e => setForm(f => ({ ...f, pincodeEnd: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="e.g. 641699"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Row 3: Delivery Charge + Enabled toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Delivery Charge (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={form.deliveryCharge}
                  onChange={e => setForm(f => ({ ...f, deliveryCharge: e.target.value }))}
                  placeholder="0"
                  className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Enter 0 for free shipping</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Enabled
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  form.isEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                {form.isEnabled
                  ? <><ToggleRight className="w-5 h-5" /> Region Active</>
                  : <><ToggleLeft  className="w-5 h-5" /> Region Disabled</>
                }
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors shadow-sm"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? <><Pencil className="w-4 h-4" /> Update Region</> : <><Plus className="w-4 h-4" /> Add Region</>}
            </button>
            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Regions Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Configured Regions
            <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {regions.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : regions.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No delivery regions configured yet.</p>
            <p className="text-xs mt-1">Use the form above to add your first region.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">State</th>
                  <th className="px-5 py-3 text-left">City</th>
                  <th className="px-5 py-3 text-left">Pincode Range</th>
                  <th className="px-5 py-3 text-right">Charge (₹)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regions.map(region => (
                  <tr key={region.id} className={`hover:bg-gray-50/60 transition-colors ${editId === region.id ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-5 py-4 text-gray-700 font-medium">{region.state || '—'}</td>
                    <td className="px-5 py-4 text-gray-700">{region.city || '—'}</td>
                    <td className="px-5 py-4">
                      {region.pincodeStart === region.pincodeEnd ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">{region.pincodeStart}</span>
                      ) : (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">
                          {region.pincodeStart} – {region.pincodeEnd}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {region.deliveryCharge === 0 ? (
                        <span className="text-emerald-600 text-xs font-bold">FREE</span>
                      ) : (
                        `₹${region.deliveryCharge}`
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggle(region)}
                        title={region.isEnabled ? 'Click to disable' : 'Click to enable'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                          region.isEnabled
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {region.isEnabled ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Disabled</>}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(region)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit region"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(region.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete region"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-semibold text-lg">Delete Region</h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete this delivery region?
              <br />
              <span className="font-medium text-red-600">Customers in this pincode range will no longer be able to order.</span>
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliverySettings;
