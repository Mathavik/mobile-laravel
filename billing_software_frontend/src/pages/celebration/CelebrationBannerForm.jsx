import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

// Banner images are remote URLs stored directly in the database.
const isValidImageUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return ALLOWED_IMAGE_EXT.test(parsed.pathname);
  } catch {
    return false;
  }
};

/* ─── Toast Hook ─────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (type, title, msg) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, show, remove };
}

function ToastPortal({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12,
          minWidth: 290, maxWidth: 370, padding: "13px 16px", borderRadius: 16,
          position: "relative", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.13)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          background: t.type === "success" ? "#f0fdf4" : t.type === "error" ? "#fff1f2" : "#fffbeb",
          border: `1px solid ${t.type === "success" ? "#bbf7d0" : t.type === "error" ? "#fecdd3" : "#fde68a"}`,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, flexShrink: 0,
            background: t.type === "success" ? "#dcfce7" : t.type === "error" ? "#ffe4e6" : "#fef9c3",
            color: t.type === "success" ? "#16a34a" : t.type === "error" ? "#e11d48" : "#b45309",
          }}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "!"}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px", color: t.type === "success" ? "#15803d" : t.type === "error" ? "#be123c" : "#92400e" }}>{t.title}</p>
            {t.msg && <p style={{ fontSize: 12, margin: 0 }}>{t.msg}</p>}
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.4 }} onClick={() => remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

export default function CelebrationBannerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [bannerName, setBannerName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const { toasts, show, remove } = useToast();

  useEffect(() => {
    if (!isEditMode) return;

    (async () => {
      try {
        const res = await api.get(`/celebration-banners/get_by_id?id=${id}`);
        if (res.data.status) {
          const data = res.data.data;
          setBannerName(data.banner_name || "");
          setIsActive(!!data.is_active);
          if (data.image_url) {
            setImageUrl(data.image_url);
          }
        } else {
          show("error", "Error", "Banner not found");
          navigate("/celebration-banner");
        }
      } catch (err) {
        console.error(err);
        show("error", "Error", "Failed to load banner");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEditMode]);

  const handleSubmit = async () => {
    if (!bannerName.trim()) {
      show("warn", "Missing field", "Banner name is required.");
      return;
    }
    if (!imageUrl.trim()) {
      show("warn", "Missing field", "Image URL is required.");
      return;
    }
    if (!isValidImageUrl(imageUrl.trim())) {
      show("error", "Invalid URL", "Please enter a valid HTTPS image URL (JPG, JPEG, PNG, WEBP or AVIF).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        banner_name: bannerName.trim(),
        image_url: imageUrl.trim(),
        is_active: isActive ? 1 : 0,
      };
      if (isEditMode) {
        payload.id = id;
      }

      const url = isEditMode ? "/celebration-banners/update" : "/celebration-banners/create";
      const res = await api.post(url, payload);

      if (res.data.status) {
        show("success", isEditMode ? "Banner updated!" : "Banner added!", `"${bannerName.trim()}" saved successfully.`);
        setTimeout(() => navigate("/celebration-banner"), 1800);
      } else {
        show("error", "Failed", res.data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      show("error", "Server error", "Unable to reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0",
    background: "#f8faff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14,
    fontWeight: 500, color: "#1e293b", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b", marginBottom: 6 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .hb-form-page { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; background: #eef2ff; padding: 2.5rem 1.5rem; }
        .hb-form-card { position: relative; width: 100%; max-width: 620px; background: #fff; border-radius: 26px; border: 1px solid #e2e8f0; box-shadow: 0 20px 60px rgba(37,99,235,0.1); overflow: hidden; animation: hbUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes hbUp { from { opacity: 0; transform: translateY(28px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .hb-form-stripe { height: 5px; background: linear-gradient(90deg, #1d4ed8, #6366f1, #3b82f6, #1d4ed8); background-size: 200% 100%; animation: hbStripe 3s linear infinite; }
        @keyframes hbStripe { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
        .hb-form-header { padding: 1.75rem 2rem 1.25rem; display: flex; align-items: flex-start; gap: 1rem; }
        .hb-form-icon { width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #1d4ed8, #3b82f6); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
        .hb-form-header h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.4px; }
        .hb-form-header p { font-size: 13px; color: #94a3b8; margin: 0; }
        .hb-form-hr { height: 1px; background: #f1f5f9; margin: 0 2rem; }
        .hb-form-body { padding: 1.5rem 2rem 2rem; }
        .hb-field { margin-bottom: 1.25rem; }
        .hb-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #f8faff; }
        .hb-submit { width: 100%; padding: 15px; border-radius: 14px; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 800; background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%); color: #fff; box-shadow: 0 4px 18px rgba(37,99,235,0.38); display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.25s; }
        .hb-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,99,235,0.45); }
        .hb-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .hb-cancel { width: 100%; margin-top: 10px; padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: transparent; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .hb-cancel:hover { background: #f8fafc; color: #475569; }
        .hb-spinner { width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: hbSpin 0.7s linear infinite; }
        @keyframes hbSpin { to { transform: rotate(360deg); } }
        .hb-skeleton { height: 46px; border-radius: 12px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: hbShimmer 1.4s ease infinite; margin-bottom: 1rem; }
        @keyframes hbShimmer { 0% { background-position: 200%; } 100% { background-position: -200%; } }
      `}</style>

      <ToastPortal toasts={toasts} remove={remove} />

      <div className="hb-form-page">
        <div className="hb-form-card">
          <div className="hb-form-stripe" />
          <div className="hb-form-header">
            <div className="hb-form-icon">{isEditMode ? "✏️" : "🖼️"}</div>
            <div>
              <h1>{isEditMode ? "Edit Celebration Banner" : "Add Celebration Banner"}</h1>
              <p>{isEditMode ? "Update the banner details" : "Create the banner for the storefront celebration section"}</p>
            </div>
          </div>
          <div className="hb-form-hr" />

          <div className="hb-form-body">
            {fetching ? (
              <>
                <div className="hb-skeleton" />
                <div className="hb-skeleton" />
                <div className="hb-skeleton" />
              </>
            ) : (
              <>
                {/* Banner Name */}
                <div className="hb-field">
                  <label style={labelStyle}>Banner Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="e.g. Crafted For Celebration"
                    value={bannerName}
                    maxLength={100}
                    onChange={(e) => setBannerName(e.target.value)}
                  />
                </div>

                {/* Image URL */}
                <div className="hb-field">
                  <label style={labelStyle}>Image URL <span style={{ color: "#ef4444" }}>*</span></label>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="https://example.com/banner-image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl.trim() && !isValidImageUrl(imageUrl.trim()) && (
                    <div style={{ color: "#ef4444", fontSize: "11px", marginTop: 4 }}>
                      ⚠️ Enter a valid HTTPS image URL (JPG, JPEG, PNG, WEBP, AVIF)
                    </div>
                  )}
                  {imageUrl.trim() && isValidImageUrl(imageUrl.trim()) && (
                    <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img
                        src={imageUrl.trim()}
                        alt="Banner preview"
                        style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "#f1f5f9" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="hb-field">
                  <div className="hb-toggle-row">
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1e293b" }}>Active</div>
                      <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: 2 }}>Show this banner on the homepage</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 44, height: 22, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: "absolute", cursor: "pointer", inset: 0, background: isActive ? "#2563eb" : "#cbd5e1", transition: "0.3s", borderRadius: 22 }}>
                        <span style={{ position: "absolute", height: 16, width: 16, left: isActive ? 24 : 3, top: 3, background: "#fff", transition: "0.3s", borderRadius: "50%" }} />
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <button className="hb-submit" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><div className="hb-spinner" /> Saving…</>
                    : <>{isEditMode ? "✏️ Update Banner" : "💾 Save Banner"}</>
                  }
                </button>
                <button className="hb-cancel" onClick={() => navigate("/celebration-banner")}>
                  ← Back to Banners
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
