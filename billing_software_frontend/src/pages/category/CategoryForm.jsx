import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import VoiceInputButton from "../../components/VoiceInputButton";

/* ─── Toast Hook ─────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (type, title, msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, show, remove };
}

/* ─── Toast UI ───────────────────────────────────────────── */
function ToastPortal({ toasts, remove }) {
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none"
    }}>
      {toasts.map(t => (
        <div key={t.id} className={`cf-toast cf-toast-${t.type}`}>
          <div className="cf-toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "!"}
          </div>
          <div className="cf-toast-content">
            <p className="cf-toast-title">{t.title}</p>
            {t.msg && <p className="cf-toast-msg">{t.msg}</p>}
          </div>
          <button className="cf-toast-x" style={{ pointerEvents: "auto" }} onClick={() => remove(t.id)}>✕</button>
          <div className="cf-toast-progress" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // const [videoUrl, setVideoUrl] = useState(""); // VIDEO DISABLED
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const { toasts, show, remove } = useToast();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    localStorage.getItem("selected_company_id") || ""
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  // const [previewVideo, setPreviewVideo] = useState(null); // VIDEO DISABLED
  const [removeImage, setRemoveImage] = useState(false);
  // const [removeVideo, setRemoveVideo] = useState(false); // VIDEO DISABLED

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;
    loadCompanies(user.id);

    if (id) {
      setIsEditMode(true);
      loadCategoryData(id);
    }
  }, [id]);

  const loadCompanies = async (admin_id) => {
    try {
      const res = await api.get(`/company/get_companies_by_admin?admin_id=${admin_id}`);
      if (res.data.status) {
        setCompanies(res.data.data);
        if (!localStorage.getItem("selected_company_id") && res.data.data.length > 0) {
          localStorage.setItem("selected_company_id", res.data.data[0].id);
          setSelectedCompany(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const loadCategoryData = async (categoryId) => {
    try {
      const res = await api.get(`/category/get_by_id?id=${categoryId}`);
      if (res.data.status) {
        const data = res.data.data;
        setName(data.name || "");
        setSelectedCompany(data.company_id || "");
        
        // Load IMAGE URL
        if (data.image) {
          setImageUrl(data.image);
          setPreviewImage(data.image);
        }
        
        // Load VIDEO URL  // VIDEO DISABLED
        // if (data.video) {
        //   setVideoUrl(data.video);
        //   setPreviewVideo(data.video);
        // }
      } else {
        show("error", "Error", "Category not found");
        navigate("/category");
      }
    } catch (err) {
      console.error(err);
      show("error", "Error", "Failed to load category data");
    }
  };

  // Handle Image URL change
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setPreviewImage(url);
    setRemoveImage(false);
  };

  // Handle Video URL change  // VIDEO DISABLED
  // const handleVideoUrlChange = (e) => {
  //   const url = e.target.value;
  //   setVideoUrl(url);
  //   setPreviewVideo(url);
  //   setRemoveVideo(false);
  // };

  // Remove Image
  const handleRemoveImage = () => {
    setImageUrl("");
    setPreviewImage(null);
    setRemoveImage(true);
  };

  // Remove Video  // VIDEO DISABLED
  // const handleRemoveVideo = () => {
  //   setVideoUrl("");
  //   setPreviewVideo(null);
  //   setRemoveVideo(true);
  // };

  const handleChange = (e) => {
    setName(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = async () => {
    const company_id = Number(selectedCompany);
    
    if (!name.trim()) {
      show("warn", "Missing field", "Category name is required.");
      return;
    }
    if (!company_id) {
      show("error", "Auth error", "Please select a company.");
      return;
    }

    // Validate URLs
    if (imageUrl && !isValidUrl(imageUrl)) {
      show("error", "Invalid URL", "Please enter a valid image URL.");
      return;
    }
    // VIDEO DISABLED
    // if (videoUrl && !isValidUrl(videoUrl)) {
    //   show("error", "Invalid URL", "Please enter a valid video URL.");
    //   return;
    // }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        company_id: company_id,
        image_url: imageUrl || null,
        // video_url: videoUrl || null  // VIDEO DISABLED
      };

      if (isEditMode) {
        payload.id = parseInt(id);
        if (removeImage) payload.remove_image = true;
        // if (removeVideo) payload.remove_video = true;  // VIDEO DISABLED
      }

      const url = isEditMode ? `/category/update` : `/category/create`;
      const res = await api.post(url, payload);

      if (res.data.status) {
        show("success", isEditMode ? "Category updated!" : "Category added!", 
          `"${name.trim()}" has been ${isEditMode ? 'updated' : 'created'}.`);
        setTimeout(() => navigate("/category"), 2000);
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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .cf-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef2ff;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .cf-card {
          position: relative;
          width: 100%;
          max-width: 600px;
          background: #ffffff;
          border-radius: 26px;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 20px 60px rgba(37,99,235,0.1);
          overflow: hidden;
          animation: cfSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes cfSlideUp {
          from { opacity:0; transform:translateY(28px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .cf-stripe {
          height: 5px;
          background: linear-gradient(90deg, #1d4ed8, #6366f1, #3b82f6, #1d4ed8);
          background-size: 200% 100%;
          animation: cfStripe 3s linear infinite;
        }
        @keyframes cfStripe {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        .cf-header {
          padding: 1.5rem 2rem 1rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .cf-icon-box {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 6px 20px rgba(37,99,235,0.35);
        }
        .cf-header-text h1 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.4px;
        }
        .cf-header-text p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          font-weight: 400;
        }

        .cf-hr { height: 1px; background: #f1f5f9; margin: 0 2rem; }
        .cf-body { padding: 1.5rem 2rem 2rem; }

        .cf-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .cf-label {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }
        .cf-char {
          font-size: 11px;
          color: #cbd5e1;
          font-weight: 500;
          transition: color 0.2s;
        }
        .cf-char.active { color: #3b82f6; }

        .cf-input-group {
          position: relative;
          margin-bottom: 1.5rem;
        }
        .cf-input-prefix {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 48px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          color: #cbd5e1;
          border-right: 1.5px solid #e2e8f0;
          pointer-events: none;
          transition: all 0.25s;
          border-radius: 14px 0 0 14px;
        }
        .cf-input {
          width: 100%;
          padding: 14px 16px 14px 60px;
          border-radius: 14px;
          border: 1.5px solid #e2e8f0;
          background: #f8faff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: #1e293b;
          outline: none;
          box-sizing: border-box;
          transition: all 0.25s;
        }
        .cf-input::placeholder { color: #c4cdd6; font-weight: 400; }
        .cf-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
        }

        /* ── Media URL Upload Styles ── */
        .cf-media-section {
          margin-bottom: 1.5rem;
        }
        .cf-media-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        @media (max-width: 480px) {
          .cf-media-grid {
            grid-template-columns: 1fr;
          }
        }

        .cf-upload-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 14px;
          padding: 1rem;
          text-align: center;
          transition: all 0.25s;
          background: #f8faff;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          position: relative;
        }
        .cf-upload-zone.has-preview {
          padding: 0.5rem;
        }
        .cf-upload-zone.image-zone:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .cf-upload-zone.video-zone:hover {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }
        .cf-upload-icon {
          font-size: 28px;
          margin-bottom: 4px;
        }
        .cf-upload-text {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }
        .cf-upload-text span {
          color: #2563eb;
          font-weight: 600;
        }
        .cf-upload-format {
          font-size: 10px;
          color: #cbd5e1;
          margin-top: 2px;
        }

        .cf-preview-container {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
        }
        .cf-preview-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 50%;
          background: #f1f5f9;
          display: block;
          margin: 0 auto;
        }
        .cf-preview-video {
          width: 100%;
          max-height: 150px;
          border-radius: 12px;
          background: #000;
        }
        .cf-remove-media {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cf-remove-media:hover {
          background: rgba(220,38,38,0.9);
          transform: scale(1.05);
        }
        .cf-media-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: rgba(0,0,0,0.6);
          color: #fff;
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .cf-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 1.5rem;
        }
        .cf-chip-label {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          width: 100%;
          margin-bottom: 2px;
        }
        .cf-chip {
          padding: 5px 12px;
          border-radius: 100px;
          border: 1.5px solid #e2e8f0;
          background: #f8faff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s;
        }
        .cf-chip:hover {
          border-color: #3b82f6;
          color: #2563eb;
          background: #eff6ff;
        }

        .cf-btn {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
          color: #fff;
          box-shadow: 0 4px 18px rgba(37,99,235,0.38);
          position: relative;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.25s;
        }
        .cf-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .cf-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(37,99,235,0.45);
        }
        .cf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .cf-btn-cancel {
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cf-btn-cancel:hover { background: #f8fafc; color: #475569; }

        .cf-spinner {
          width: 17px; height: 17px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Toast styles */
        .cf-toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 290px;
          max-width: 370px;
          padding: 13px 16px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.13);
          animation: cfToastIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        @keyframes cfToastIn {
          from { opacity:0; transform:translateX(60px) scale(0.9); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        .cf-toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .cf-toast-error { background: #fff1f2; border: 1px solid #fecdd3; }
        .cf-toast-warn { background: #fffbeb; border: 1px solid #fde68a; }
        .cf-toast-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; flex-shrink: 0;
        }
        .cf-toast-success .cf-toast-icon { background: #dcfce7; color: #16a34a; }
        .cf-toast-error .cf-toast-icon { background: #ffe4e6; color: #e11d48; }
        .cf-toast-warn .cf-toast-icon { background: #fef9c3; color: #b45309; }
        .cf-toast-content { flex: 1; }
        .cf-toast-title { font-size: 13px; font-weight: 700; margin: 0 0 2px; }
        .cf-toast-success .cf-toast-title { color: #15803d; }
        .cf-toast-error .cf-toast-title { color: #be123c; }
        .cf-toast-warn .cf-toast-title { color: #92400e; }
        .cf-toast-msg { font-size: 12px; margin: 0; font-weight: 400; }
        .cf-toast-success .cf-toast-msg { color: #16a34a; }
        .cf-toast-error .cf-toast-msg { color: #e11d48; }
        .cf-toast-warn .cf-toast-msg { color: #b45309; }
        .cf-toast-x {
          background: none; border: none; cursor: pointer;
          font-size: 13px; opacity: 0.4; transition: opacity 0.2s;
          flex-shrink: 0; padding: 2px;
        }
        .cf-toast-x:hover { opacity: 0.9; }
        .cf-toast-progress {
          position: absolute; bottom: 0; left: 0;
          height: 3px; border-radius: 0 0 16px 16px;
          animation: cfShrink 3.8s linear forwards;
        }
        .cf-toast-success .cf-toast-progress { background: #4ade80; }
        .cf-toast-error .cf-toast-progress { background: #fb7185; }
        .cf-toast-warn .cf-toast-progress { background: #fbbf24; }
        @keyframes cfShrink {
          from { width: 100%; } to { width: 0%; }
        }
      `}</style>

      <ToastPortal toasts={toasts} remove={remove} />

      <div className="cf-page">
        <div className="cf-card">
          <div className="cf-stripe" />

          <div className="cf-header">
            <div className="cf-icon-box">{isEditMode ? "✏️" : "🏷️"}</div>
            <div className="cf-header-text">
              <h1>{isEditMode ? "Edit Category" : "Add Category"}</h1>
              <p>{isEditMode ? "Update category details" : "Organise your products under a new category"}</p>
            </div>
          </div>

          <div className="cf-hr" />

          <div className="cf-body">
            {/* Company Select */}
            <div style={{ marginBottom: "20px" }}>
              <label className="cf-label">Select Company</label>
              <select
                className="cf-input"
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  localStorage.setItem("selected_company_id", e.target.value);
                }}
                disabled={isEditMode}
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Name Input */}
            <div className="cf-label-row">
              <span className="cf-label">Category Name</span>
              <span className={`cf-char ${charCount > 0 ? "active" : ""}`}>{charCount}/50</span>
            </div>
            <div className="cf-input-group">
              <input
                type="text"
                className="cf-input"
                placeholder="e.g. Electronics, Beverages…"
                value={name}
                maxLength={50}
                onChange={handleChange}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <VoiceInputButton
                onTranscript={(text) => {
                  setName(text);
                  setCharCount(text.length);
                }}
                style={{ position: "absolute", right: 44, top: "50%", transform: "translateY(-50%)" }}
              />
              <div className="cf-input-prefix">#</div>
            </div>

            {/* ── IMAGE & VIDEO URL SECTION ── */}
            <div className="cf-media-section">
              <div className="cf-media-grid">
                
                {/* Image URL */}
                <div>
                  <label className="cf-label">Image URL</label>
                  <input
                    type="text"
                    className="cf-input"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    style={{ paddingLeft: "16px", marginBottom: "8px" }}
                  />
                  
                  <div className={`cf-upload-zone image-zone ${previewImage ? 'has-preview' : ''}`}>
                    {previewImage ? (
                      <div className="cf-preview-container">
                        <img src={previewImage} alt="Category" className="cf-preview-image" />
                        <button className="cf-remove-media" onClick={handleRemoveImage}>✕</button>
                        <span className="cf-media-badge">📷 Image</span>
                      </div>
                    ) : (
                      <>
                        <div className="cf-upload-icon">🖼️</div>
                        <div className="cf-upload-text">Enter URL above</div>
                      </>
                    )}
                  </div>
                  {imageUrl && !isValidUrl(imageUrl) && (
                    <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                      ⚠️ Invalid URL
                    </div>
                  )}
                </div>

                {/* Video URL  // VIDEO DISABLED */}
                {/* <div>
                  <label className="cf-label">Video URL</label>
                  <input
                    type="text"
                    className="cf-input"
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={handleVideoUrlChange}
                    style={{ paddingLeft: "16px", marginBottom: "8px" }}
                  />
                  
                  <div className={`cf-upload-zone video-zone ${previewVideo ? 'has-preview' : ''}`}>
                    {previewVideo ? (
                      <div className="cf-preview-container">
                        <video src={previewVideo} className="cf-preview-video" controls />
                        <button className="cf-remove-media" onClick={handleRemoveVideo}>✕</button>
                        <span className="cf-media-badge">🎥 Video</span>
                      </div>
                    ) : (
                      <>
                        <div className="cf-upload-icon">🎬</div>
                        <div className="cf-upload-text">Enter URL above</div>
                      </>
                    )}
                  </div>
                  {videoUrl && !isValidUrl(videoUrl) && (
                    <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                      ⚠️ Invalid URL
                    </div>
                  )}
                </div> */}

              </div>
            </div>

            {/* Quick-fill chips */}
            <div className="cf-chips">
              <span className="cf-chip-label">Quick suggestions</span>
              {["Electronics", "Beverages", "Snacks", "Dairy", "Bakery", "Stationery"].map(s => (
                <button key={s} className="cf-chip" onClick={() => { setName(s); setCharCount(s.length); }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Submit buttons */}
            <button className="cf-btn" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><div className="cf-spinner" /> Saving…</>
                : <>{isEditMode ? "✏️ Update Category" : "💾 Save Category"}</>
              }
            </button>
            <button className="cf-btn-cancel" onClick={() => navigate("/category")}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}