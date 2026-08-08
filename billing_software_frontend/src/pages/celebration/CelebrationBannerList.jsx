import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Search, Plus, X } from "lucide-react";

const ITEMS_PER_PAGE = 8;

// Banner images are remote URLs stored directly in the database.
const resolveBannerImage = (banner) => banner?.image_url || "";

export default function CelebrationBannerList() {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: null, name: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/celebration-banners/get_all");
        setBanners(res.data.status ? res.data.data : []);
      } catch (err) {
        console.error("Error loading celebration banners", err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleStatus = async (banner) => {
    const newValue = banner.is_active ? 0 : 1;
    try {
      const res = await api.post("/celebration-banners/toggle_status", {
        id: banner.id,
        is_active: newValue,
      });
      if (res.data.status) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: newValue } : b))
        );
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete banner "${banner.banner_name}"?`)) return;
    try {
      const res = await api.post("/celebration-banners/delete", { id: banner.id });
      if (res.data.status) {
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const filteredBanners = banners.filter((b) =>
    (b.banner_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredBanners.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedBanners = filteredBanners.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const openPreview = (banner) => {
    const url = resolveBannerImage(banner);
    if (url) setPreviewModal({ isOpen: true, url, name: banner.banner_name });
  };

  const closePreview = () => setPreviewModal({ isOpen: false, url: null, name: null });

  const bannerLimitReached = banners.length >= 1;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "30px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .hb-search-input {
          width: 100%; padding: 10px 14px 10px 36px;
          border-radius: 10px; border: 1.5px solid #e2e8f0;
          outline: none; font-size: 13.5px; font-weight: 500;
          background: #fff; box-sizing: border-box; transition: border-color 0.2s;
        }
        .hb-search-input:focus { border-color: #3b82f6; }
        .hb-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.01); overflow: hidden; }
        .hb-table { width: 100%; border-collapse: collapse; text-align: left; }
        .hb-table th {
          padding: 14px 16px; font-size: 11px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.08em;
          border-bottom: 2px solid #e2e8f0; background: #f8fafc;
        }
        .hb-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; }
        .hb-status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .hb-status-badge.active { background: #dcfce7; color: #15803d; }
        .hb-status-badge.inactive { background: #f1f5f9; color: #64748b; }
        .hb-switch-lbl { position: relative; display: inline-block; width: 44px; height: 20px; }
        .hb-switch-lbl input { opacity: 0; width: 0; height: 0; }
        .hb-slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e1; transition: 0.3s; border-radius: 20px; }
        .hb-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; top: 3px; background: white; transition: 0.3s; border-radius: 50%; }
        .hb-switch-lbl input:checked + .hb-slider { background: #2563eb; }
        .hb-switch-lbl input:checked + .hb-slider:before { transform: translateX(24px); }
        .hb-action-btn { width: 32px; height: 32px; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .hb-action-btn.edit { background: #eff6ff; color: #2563eb; }
        .hb-action-btn.edit:hover { background: #dbeafe; }
        .hb-action-btn.del { background: #fef2f2; color: #dc2626; margin-left: 6px; }
        .hb-action-btn.del:hover { background: #fee2e2; }
        .hb-page-btn { padding: 6px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .hb-page-btn:hover:not(:disabled) { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .hb-page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .hb-thumb { width: 64px; height: 76px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; cursor: pointer; transition: transform 0.2s; background: #f1f5f9; }
        .hb-thumb:hover { transform: scale(1.05); }
        .hb-order-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 4px 10px; border-radius: 8px; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 12.5px; }
        .hb-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: hbFadeIn 0.3s ease; }
        @keyframes hbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .hb-modal-content { max-width: 92%; max-height: 92%; position: relative; animation: hbScaleIn 0.3s ease; }
        @keyframes hbScaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .hb-modal-image { max-width: 90vw; max-height: 85vh; border-radius: 12px; object-fit: contain; }
        .hb-modal-close { position: absolute; top: -40px; right: -40px; background: rgba(255,255,255,0.2); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .hb-modal-close:hover { background: rgba(255,255,255,0.3); }
        @media (max-width: 640px) { .hb-modal-close { top: 10px; right: 10px; background: rgba(0,0,0,0.6); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Celebration Banner</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
            Manage the CRAFTED FOR CELEBRATION banner shown on the storefront homepage
          </p>
        </div>
        <button
          onClick={() => navigate("/celebration-banner/add")}
          disabled={bannerLimitReached}
          title={bannerLimitReached ? "Only 1 celebration banner can be added" : undefined}
          style={{
            padding: "10px 18px", borderRadius: "10px",
            background: bannerLimitReached ? "#94a3b8" : "#2563eb", color: "#fff",
            border: "none", fontSize: "13.5px", fontWeight: "600",
            cursor: bannerLimitReached ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: bannerLimitReached ? "none" : "0 4px 12px rgba(37,99,235,0.2)",
          }}
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "420px" }}>
        <Search size={15} style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          type="text"
          className="hb-search-input"
          placeholder="Search banners by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading banners...</div>
      ) : (
        <div className="hb-card">
          <div style={{ overflowX: "auto" }}>
            <table className="hb-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Banner Name</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBanners.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                      No banners found.
                    </td>
                  </tr>
                ) : (
                  paginatedBanners.map((banner) => (
                    <tr key={banner.id}>
                      <td>
                        {resolveBannerImage(banner) ? (
                          <img
                            src={resolveBannerImage(banner)}
                            alt={banner.banner_name}
                            className="hb-thumb"
                            onClick={() => openPreview(banner)}
                          />
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "11px" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: "700", color: "#0f172a" }}>{banner.banner_name || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`hb-status-badge ${banner.is_active ? "active" : "inactive"}`}>
                            {banner.is_active ? "Active" : "Inactive"}
                          </span>
                          <label className="hb-switch-lbl">
                            <input
                              type="checkbox"
                              checked={!!banner.is_active}
                              onChange={() => toggleStatus(banner)}
                            />
                            <span className="hb-slider"></span>
                          </label>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <button
                            onClick={() => navigate(`/celebration-banner/edit/${banner.id}`)}
                            className="hb-action-btn edit"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(banner)}
                            className="hb-action-btn del"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredBanners.length > ITEMS_PER_PAGE && (
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                Page {safePage} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="hb-page-btn">
                  <ChevronLeft size={16} /> Prev
                </button>
                <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className="hb-page-btn">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="hb-modal-overlay" onClick={closePreview}>
          <div className="hb-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="hb-modal-close" onClick={closePreview}>
              <X size={24} />
            </button>
            <img src={previewModal.url} alt={previewModal.name} className="hb-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}
