// admin-web/src/pages/settings/HeroBanners.tsx
// Admin management page for the customer homepage hero/banner slider
// Features: Upload, view, reorder (sortOrder), remove banners

import { useState, useEffect, useRef } from 'react';
import { bannersApi, type HeroBanner } from '@/lib/api';
import {
  Image as ImageIcon,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  X,
  Plus,
} from 'lucide-react';

export default function HeroBanners() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-banner action loading states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await bannersApi.getAll();
      setBanners(all);
    } catch (err: any) {
      setError(err.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Clean up preview URL on unmount/change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const clearUploadForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setUploadAlt('');
    setUploadLink('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!previewFile) {
      setError('Please select a banner image first.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const banner = await bannersApi.upload(
        previewFile,
        uploadAlt.trim() || undefined,
        uploadLink.trim() || undefined
      );
      setBanners((prev) => [...prev, banner]);
      clearUploadForm();
      setSuccessMsg('Banner uploaded and added to the slider successfully.');
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (banner: HeroBanner) => {
    if (!window.confirm(`Remove banner "${banner.altText || banner.id.slice(-6)}" from the slider? This action cannot be undone.`)) return;
    setDeletingId(banner.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await bannersApi.remove(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      setSuccessMsg('Banner removed from the slider.');
    } catch (err: any) {
      setError(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    setTogglingId(banner.id);
    setError(null);
    try {
      const updated = await bannersApi.patch(banner.id, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
    } catch (err: any) {
      setError(err.message || 'Failed to update banner visibility.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleMoveOrder = async (banner: HeroBanner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapBanner = sorted[swapIdx];
    const newOrder = banner.sortOrder;
    const swapOrder = swapBanner.sortOrder;

    try {
      await Promise.all([
        bannersApi.patch(banner.id, { sortOrder: swapOrder }),
        bannersApi.patch(swapBanner.id, { sortOrder: newOrder }),
      ]);
      setBanners((prev) =>
        prev.map((b) => {
          if (b.id === banner.id) return { ...b, sortOrder: swapOrder };
          if (b.id === swapBanner.id) return { ...b, sortOrder: newOrder };
          return b;
        })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to reorder banners.');
    }
  };

  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Homepage Hero Banners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the hero image slider displayed on the customer storefront homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBanners}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm dark:bg-green-900/20 dark:border-green-700/40 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Upload New Banner Panel ──────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 flex items-center justify-center">
            <Plus className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Upload New Banner</h2>
            <p className="text-xs text-muted-foreground">JPG, PNG or WEBP — max 8MB. Recommended: 1920×600 or 2:1 ratio.</p>
          </div>
        </div>

        {/* Drag & Drop + Preview Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !previewFile && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer
            ${previewFile
              ? 'border-[#C5A059]/50 bg-[#C5A059]/5'
              : 'border-border hover:border-[#C5A059]/60 hover:bg-muted/50 bg-muted/20'
            }`}
          style={{ minHeight: 180 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {previewUrl ? (
            <div className="relative w-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-56 object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearUploadForm(); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-center text-xs text-muted-foreground py-2">{previewFile?.name}</p>
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-2">
              <Upload className="w-8 h-8 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-medium text-foreground/80">Drag & drop or click to select</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 8MB</p>
            </div>
          )}
        </div>

        {/* Optional metadata fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Alt Text <span className="text-muted-foreground/60 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              placeholder="e.g. New Collection — Spring 2026"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 focus:border-[#C5A059]/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Link URL <span className="text-muted-foreground/60 normal-case">(optional)</span>
            </label>
            <input
              type="url"
              value={uploadLink}
              onChange={(e) => setUploadLink(e.target.value)}
              placeholder="e.g. /products or /categories"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[#C5A059]/50 focus:border-[#C5A059]/60 transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !previewFile}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B08A3E] text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload Banner</span>
            </>
          )}
        </button>
      </div>

      {/* ── Banner List ────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Current Banners
              <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground font-normal">
                {banners.length}
              </span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Active banners appear in the slider in the order shown below.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading banners…</span>
          </div>
        ) : sortedBanners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No banners yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload your first banner above to populate the homepage hero slider.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sortedBanners.map((banner, idx) => (
              <li key={banner.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                {/* Thumbnail */}
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.altText || `Banner ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {banner.altText || <span className="text-muted-foreground italic">No alt text</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {banner.linkUrl || <span className="italic">No link</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      banner.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {banner.isActive ? 'Visible' : 'Hidden'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Order: {banner.sortOrder}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(banner, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(banner, 'down')}
                    disabled={idx === sortedBanners.length - 1}
                    title="Move down"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    disabled={togglingId === banner.id}
                    title={banner.isActive ? 'Hide banner' : 'Show banner'}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {togglingId === banner.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : banner.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(banner)}
                    disabled={deletingId === banner.id}
                    title="Remove banner"
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === banner.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Note about production deployment */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs dark:bg-blue-900/20 dark:border-blue-700/40 dark:text-blue-400">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Note:</strong> Uploaded banners are stored in Cloudinary and the database. The customer homepage slider
          loads banners dynamically — changes take effect immediately after page refresh on the storefront.
          No frontend rebuild or deployment is required.
        </div>
      </div>
    </div>
  );
}
