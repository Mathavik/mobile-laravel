import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const UNITS = [
  "Piece", "Kg", "Gram", "Litre", "ML", "Meter", "Feet",
  "Box", "Pack", "Dozen", "Pair", "Roll", "Bag", "Bottle", "Can", "Set",
];

/* ─── Toast Hook ─────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (type, title, msg) => {
    const id = Date.now();
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4200);
  };
  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, show, remove };
}

function ToastPortal({ toasts, remove }) {
  return (
    <div className="bk-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`bk-toast bk-toast-${t.type}`}>
          <div className="bk-toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "!"}</div>
          <div className="bk-toast-body">
            <p className="bk-toast-title">{t.title}</p>
            {t.msg && <p className="bk-toast-msg">{t.msg}</p>}
          </div>
          <button className="bk-toast-x" onClick={() => remove(t.id)}>✕</button>
          <div className="bk-toast-bar" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function BulkAddProduct({ embedded, onClose }) {
  const navigate = useNavigate();
  const { toasts, show, remove } = useToast();

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    localStorage.getItem("selected_company_id") || ""
  );
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [defaults, setDefaults] = useState({
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    supplier_id: "",
    unit: "",
    gst: "",
  });

  const [rows, setRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [resultErrors, setResultErrors] = useState([]);

  const uidRef = useRef(1);
  const nextUid = () => uidRef.current++;

  const getCompanyId = () => Number(localStorage.getItem("selected_company_id"));

  const makeRow = () => ({
    uid: nextUid(),
    product_name: "",
    product_code: "",
    category_id: defaults.category_id,
    subcategory_id: "",
    brand_id: "",
    supplier_id: defaults.supplier_id,
    unit: defaults.unit,
    price: "",
    mrp: "",
    stock: "",
    gst_percentage: defaults.gst,
    barcode: "",
    color: "",
    model_name: "",
    ram: "",
    internal_storage: "",
    display_size: "",
    warranty: "",
    short_description: "",
  });

  const addRows = (count) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => makeRow())]);
  };

  useEffect(() => {
    if (rows.length === 0) addRows(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load dependent data when company changes ──────────── */
  const loadCompanyData = async (companyId) => {
    const p1 = api
      .get(`/category/get_active_category?company_id=${companyId}`)
      .then((res) => setCategories(res.data.status ? res.data.data : []))
      .catch(() => setCategories([]));

    const p2 = api
      .get(`/subcategory/get_active_subcategory?company_id=${companyId}`)
      .then((res) => setSubCategories(res.data.status ? res.data.data : []))
      .catch(() => setSubCategories([]));

    const p3 = api
      .get(`/brand/get_active_brand?company_id=${companyId}`)
      .then((res) => setBrands(res.data.status ? res.data.data : []))
      .catch(() => setBrands([]));

    const p4 = api
      .get(`/supplier/get_all?company_id=${companyId}`)
      .then((res) => setSuppliers(res.data.status ? res.data.data : []))
      .catch(() => setSuppliers([]));

    await Promise.all([p1, p2, p3, p4]);
  };

  /* ── Load companies ────────────────────────────────────── */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) return;
    api
      .get(`/company/get_companies_by_admin?admin_id=${user.id}`)
      .then((res) => {
        if (res.data.status) {
          setCompanies(res.data.data);
          // Auto-load categories/brands/suppliers for the already-selected
          // company so the grid has data immediately on mount.
          const savedId = localStorage.getItem("selected_company_id");
          if (savedId) {
            setSelectedCompany(savedId);
            loadCompanyData(savedId);
          }
        }
      })
      .catch(() => console.log("Failed to load companies"));
  }, []);

  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    localStorage.setItem("selected_company_id", companyId);

    setDefaults({ category_id: "", subcategory_id: "", brand_id: "", supplier_id: "", unit: "", gst: "" });
    setRows([]);
    setInvalidRows([]);
    setResultErrors([]);

    if (companyId) await loadCompanyData(companyId);
    addRows(5);
  };

  /* ── Defaults helpers ──────────────────────────────────── */
  const setDefault = (key, value) => {
    setDefaults((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category_id") { next.subcategory_id = ""; next.brand_id = ""; }
      if (key === "subcategory_id") { next.brand_id = ""; }
      return next;
    });
  };

  const applyDefaults = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        category_id: r.category_id || defaults.category_id,
        subcategory_id: r.subcategory_id || defaults.subcategory_id,
        brand_id: r.brand_id || defaults.brand_id,
        supplier_id: r.supplier_id || defaults.supplier_id,
        unit: r.unit || defaults.unit,
        gst_percentage: r.gst_percentage || defaults.gst,
      }))
    );
    show("success", "Defaults Applied", "Empty cells have been filled from the defaults bar.");
  };

  /* ── Row helpers ───────────────────────────────────────── */
  const changeCell = (uid, key, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r;
        const next = { ...r, [key]: value };
        if (key === "category_id") { next.subcategory_id = ""; next.brand_id = ""; }
        if (key === "subcategory_id") { next.brand_id = ""; }
        return next;
      })
    );
  };

  const removeRow = (uid) => {
    setRows((prev) => prev.filter((r) => r.uid !== uid));
    setInvalidRows((prev) => prev.filter((r) => r.uid !== uid));
  };

  const clearRows = () => {
    if (rows.length > 0 && !window.confirm("Clear all rows?")) return;
    setRows([]);
    setInvalidRows([]);
    setResultErrors([]);
    addRows(5);
  };

  /* ── Excel paste ───────────────────────────────────────── */
  const parsePaste = () => {
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.replace(/\r/g, "").trim())
      .filter(Boolean);
    if (lines.length === 0) {
      show("warn", "Empty Paste", "No rows found in the clipboard text.");
      return;
    }

    const idByName = (list, name) => {
      if (!name) return "";
      const match = list.find(
        (o) => String(o.name).toLowerCase() === String(name).toLowerCase()
      );
      return match ? String(match.id) : "";
    };

    const parsed = lines.map((line) => {
      const cols = line.split(/\t/).map((c) => c.trim());
      const r = makeRow();
      r.product_name = cols[0] || "";
      r.product_code = cols[1] || "";
      r.category_id = idByName(categories, cols[2]);
      r.subcategory_id = idByName(subCategories, cols[3]);
      r.brand_id = idByName(brands, cols[4]);
      r.supplier_id = idByName(suppliers, cols[5]);
      r.unit = cols[6] || defaults.unit;
      r.price = cols[7] || "";
      r.mrp = cols[8] || "";
      r.stock = cols[9] || "";
      r.gst_percentage = cols[10] || defaults.gst;
      r.barcode = cols[11] || "";
      r.color = cols[12] || "";
      r.model_name = cols[13] || "";
      r.ram = cols[14] || "";
      r.internal_storage = cols[15] || "";
      r.display_size = cols[16] || "";
      r.warranty = cols[17] || "";
      r.short_description = cols[18] || "";
      return r;
    });

    setRows((prev) => [...prev, ...parsed]);
    setPasteOpen(false);
    setPasteText("");
    show("success", "Pasted!", `${parsed.length} rows added from clipboard.`);
  };

  /* ── Save ──────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!selectedCompany) {
      show("warn", "Missing Company", "Please select a company first.");
      return;
    }

    const bad = [];
    rows.forEach((r, idx) => {
      const errs = [];
      if (!r.product_name.trim()) errs.push("Product name required");
      if (!r.category_id) errs.push("Category required");
      if (r.price === "" || isNaN(Number(r.price)) || Number(r.price) < 0) errs.push("Valid price required");
      if (r.stock === "" || isNaN(Number(r.stock)) || Number(r.stock) < 0) errs.push("Valid stock required");
      if (errs.length) bad.push({ uid: r.uid, row: idx + 1, errs });
    });

    if (bad.length) {
      setInvalidRows(bad.map((b) => b.uid));
      show("warn", "Incomplete Rows", `${bad.length} row(s) need attention — highlighted in red.`);
      return;
    }

    const payload = rows.map(({ uid, ...data }) => data);

    setSaving(true);
    setResultErrors([]);
    try {
      const res = await api.post("/product/bulk_add", {
        company_id: Number(selectedCompany),
        products: payload,
      });

      if (res.data.status) {
        const errs = res.data.errors || [];
        setResultErrors(errs);
        if (errs.length === 0) {
          show("success", "Bulk Added!", `${res.data.added || payload.length} products saved successfully.`);
          setRows([]);
          addRows(5);
        } else {
          show("warn", "Partially Saved", `${res.data.added} added, ${errs.length} rows failed.`);
        }
      } else {
        show("error", "Failed", res.data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      show("error", "Server Error", "Unable to reach server. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Row sub-category/brand option filtering ───────────── */
  const rowSubCategories = (row) =>
    row.category_id
      ? subCategories.filter((s) => String(s.category_id) === String(row.category_id))
      : [];

  const rowBrands = (row) =>
    row.category_id
      ? brands.filter(
          (b) =>
            String(b.category_id) === String(row.category_id) &&
            (row.subcategory_id ? String(b.subcategory_id) === String(row.subcategory_id) : true)
        )
      : [];

  const isInvalid = (uid) => invalidRows.includes(uid);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .bk-page{
          font-family:'Plus Jakarta Sans',sans-serif;
          min-height:100vh;
          background:#f0f4ff;
          padding:1.5rem;
        }

        .bk-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:12px;
          margin-bottom:1.25rem;
        }

        .bk-header-left h1{
          font-size:22px;
          font-weight:800;
          margin:0;
          color:#0f172a;
        }

        .bk-header-left p{
          font-size:13px;
          color:#94a3b8;
          margin-top:4px;
        }

        .bk-back-btn{
          padding:10px 18px;
          border:1.5px solid #e2e8f0;
          background:#fff;
          color:#475569;
          font-weight:700;
          border-radius:12px;
          cursor:pointer;
          font-size:13px;
          transition:all 0.2s;
        }

        .bk-back-btn:hover{
          border-color:#2563eb;
          color:#2563eb;
        }

        .bk-card{
          background:#fff;
          border-radius:20px;
          border:1px solid #e2e8f0;
          box-shadow:0 4px 24px rgba(37,99,235,0.08);
          padding:1.25rem;
          margin-bottom:1rem;
        }

        .bk-card-title{
          font-size:11px;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:0.1em;
          color:#3b82f6;
          margin:0 0 14px;
          display:flex;
          align-items:center;
          gap:8px;
        }

        .bk-card-title::after{
          content:'';
          flex:1;
          height:1px;
          background:#e8f0fe;
        }

        .bk-field{
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .bk-label{
          font-size:11px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.07em;
          color:#94a3b8;
        }

        .bk-select, .bk-input{
          padding:11px 13px;
          border-radius:12px;
          border:1.5px solid #e2e8f0;
          background:#f8faff;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:13.5px;
          font-weight:500;
          color:#1e293b;
          outline:none;
          transition:all 0.2s;
        }

        .bk-select:focus, .bk-input:focus{
          border-color:#3b82f6;
          background:#fff;
          box-shadow:0 0 0 4px rgba(59,130,246,0.1);
        }

        .bk-toolbar{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          align-items:center;
          margin-bottom:1rem;
        }

        .bk-toolbar-btn{
          padding:10px 16px;
          border:none;
          border-radius:12px;
          font-weight:700;
          font-size:13px;
          cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:all 0.2s;
        }

        .bk-btn-add{
          background:#eff6ff;
          color:#2563eb;
          border:1.5px solid #bfdbfe;
        }

        .bk-btn-add:hover{ background:#dbeafe; }

        .bk-btn-outline{
          background:#fff;
          color:#475569;
          border:1.5px solid #e2e8f0;
        }

        .bk-btn-outline:hover{ border-color:#2563eb; color:#2563eb; }

        .bk-btn-danger{
          background:#fff;
          color:#e11d48;
          border:1.5px solid #fecdd3;
        }

        .bk-btn-danger:hover{ background:#fff1f2; }

        .bk-btn-primary{
          background:linear-gradient(135deg,#1e40af,#3b82f6);
          color:#fff;
          box-shadow:0 4px 14px rgba(37,99,235,0.35);
          padding:12px 26px;
          font-size:14px;
        }

        .bk-btn-primary:hover{ box-shadow:0 6px 20px rgba(37,99,235,0.45); }
        .bk-btn-primary:disabled{ opacity:0.6; cursor:not-allowed; }

        .bk-count-badge{
          font-size:12px;
          font-weight:700;
          color:#2563eb;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          padding:6px 12px;
          border-radius:999px;
        }

        .bk-grid-wrap{
          overflow-x:auto;
          border:1px solid #e2e8f0;
          border-radius:16px;
          background:#fff;
          max-height:70vh;
          overflow-y:auto;
        }

        .bk-table{
          border-collapse:collapse;
          width:100%;
          min-width:1800px;
          font-size:13px;
        }

        .bk-table thead{
          position:sticky;
          top:0;
          z-index:20;
        }

        .bk-table th{
          background:linear-gradient(135deg,#1e40af,#2563eb);
          color:#fff;
          padding:11px 10px;
          font-size:10.5px;
          text-transform:uppercase;
          letter-spacing:0.04em;
          text-align:left;
          white-space:nowrap;
          font-weight:700;
        }

        .bk-table td{
          padding:8px 10px;
          border-bottom:1px solid #f1f5f9;
          vertical-align:top;
        }

        .bk-table tbody tr:hover td{ background:#f8faff; }

        .bk-row-num{
          position:sticky;
          left:0;
          background:#f8faff;
          font-weight:800;
          color:#64748b;
          text-align:center;
          z-index:5;
          border-right:1px solid #eef2f7;
        }

        .bk-row-actions{
          position:sticky;
          right:0;
          background:#fff;
          text-align:center;
          z-index:5;
          border-left:1px solid #eef2f7;
        }

        .bk-cell{
          width:100%;
          padding:9px 10px;
          border-radius:9px;
          border:1.5px solid #e2e8f0;
          background:#fff;
          font-size:13px;
          font-family:'Plus Jakarta Sans',sans-serif;
          color:#0f172a;
          outline:none;
          box-sizing:border-box;
          min-width:110px;
          transition:all 0.15s;
        }

        .bk-cell:focus{
          border-color:#2563eb;
          box-shadow:0 0 0 3px rgba(37,99,235,0.12);
          background:#fff;
        }

        .bk-cell-cell{
          background:#f8faff;
          border-color:#e2e8f0;
          cursor:pointer;
        }

        .bk-cell-textarea{
          min-width:200px;
          resize:vertical;
        }

        .bk-row-invalid .bk-cell{
          border-color:#fca5a5;
          background:#fff5f5;
        }

        .bk-required-dot{ color:#ef4444; }

        .bk-row-del{
          width:32px;
          height:32px;
          border:none;
          border-radius:9px;
          background:#fff1f2;
          color:#e11d48;
          cursor:pointer;
          font-weight:800;
          font-size:14px;
        }

        .bk-row-del:hover{ background:#ffe4e6; }

        .bk-error-panel{
          background:#fff1f2;
          border:1px solid #fecdd3;
          border-radius:14px;
          padding:14px 18px;
          margin-bottom:1rem;
        }

        .bk-error-panel h4{
          margin:0 0 8px;
          font-size:13px;
          color:#be123c;
          font-weight:800;
        }

        .bk-error-item{
          font-size:12.5px;
          color:#e11d48;
          padding:3px 0;
        }

        /* Paste modal */
        .bk-modal-overlay{
          position:fixed;
          inset:0;
          background:rgba(15,23,42,0.45);
          z-index:9998;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:1rem;
        }

        .bk-modal{
          background:#fff;
          border-radius:20px;
          max-width:640px;
          width:100%;
          padding:1.5rem;
          box-shadow:0 20px 60px rgba(15,23,42,0.25);
        }

        .bk-modal h3{
          margin:0 0 4px;
          font-size:17px;
          font-weight:800;
          color:#0f172a;
        }

        .bk-modal p{
          margin:0 0 14px;
          font-size:12.5px;
          color:#94a3b8;
        }

        .bk-paste-area{
          width:100%;
          height:180px;
          border:1.5px dashed #cbd5e1;
          border-radius:14px;
          padding:12px;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:12.5px;
          outline:none;
          resize:vertical;
          background:#f8faff;
          box-sizing:border-box;
        }

        .bk-paste-area:focus{
          border-color:#2563eb;
          background:#fff;
        }

        .bk-modal-actions{
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:14px;
        }

        .bk-hint{
          font-size:12px;
          color:#64748b;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          border-radius:10px;
          padding:10px 12px;
          margin-top:10px;
          line-height:1.6;
        }

        .bk-hint b{ color:#2563eb; }

        /* Toasts */
        .bk-toasts{
          position:fixed;
          top:22px;
          right:22px;
          z-index:9999;
          display:flex;
          flex-direction:column;
          gap:9px;
          pointer-events:none;
        }

        .bk-toast{
          pointer-events:auto;
          display:flex;
          align-items:center;
          gap:11px;
          min-width:280px;
          max-width:360px;
          padding:12px 15px;
          border-radius:15px;
          position:relative;
          overflow:hidden;
          box-shadow:0 8px 28px rgba(0,0,0,0.12);
          animation:bkToastIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        @keyframes bkToastIn{
          from{opacity:0;transform:translateX(60px) scale(0.9)}
          to{opacity:1;transform:translateX(0) scale(1)}
        }

        .bk-toast-success{background:#f0fdf4;border:1px solid #bbf7d0;}
        .bk-toast-error{background:#fff1f2;border:1px solid #fecdd3;}
        .bk-toast-warn{background:#fffbeb;border:1px solid #fde68a;}

        .bk-toast-icon{
          width:30px;height:30px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;font-weight:800;flex-shrink:0;
        }

        .bk-toast-success .bk-toast-icon{background:#dcfce7;color:#16a34a;}
        .bk-toast-error .bk-toast-icon{background:#ffe4e6;color:#e11d48;}
        .bk-toast-warn .bk-toast-icon{background:#fef9c3;color:#b45309;}

        .bk-toast-body{flex:1;}
        .bk-toast-title{font-size:13px;font-weight:700;margin:0 0 2px;}
        .bk-toast-success .bk-toast-title{color:#15803d;}
        .bk-toast-error .bk-toast-title{color:#be123c;}
        .bk-toast-warn .bk-toast-title{color:#92400e;}
        .bk-toast-msg{font-size:12px;margin:0;}
        .bk-toast-success .bk-toast-msg{color:#16a34a;}
        .bk-toast-error .bk-toast-msg{color:#e11d48;}
        .bk-toast-warn .bk-toast-msg{color:#b45309;}

        .bk-toast-x{
          background:none;border:none;cursor:pointer;font-size:12px;
          opacity:0.4;transition:opacity 0.2s;flex-shrink:0;padding:2px;
        }

        .bk-toast-x:hover{opacity:0.9;}

        .bk-toast-bar{
          position:absolute;bottom:0;left:0;height:3px;
          animation:bkShrink 4.2s linear forwards;
        }

        .bk-toast-success .bk-toast-bar{background:#4ade80;}
        .bk-toast-error .bk-toast-bar{background:#fb7185;}
        .bk-toast-warn .bk-toast-bar{background:#fbbf24;}

        @keyframes bkShrink{from{width:100%}to{width:0%}}
      `}</style>

      <ToastPortal toasts={toasts} remove={remove} />

      <div className="bk-page">

        {/* HEADER */}
        <div className="bk-header">
          <div className="bk-header-left">
            <h1>📦 Bulk Add Products</h1>
            <p>Fill in multiple products at once and save them together</p>
          </div>
          {embedded && onClose ? (
            <button className="bk-back-btn" onClick={onClose}>✕ Close</button>
          ) : (
            <button className="bk-back-btn" onClick={() => navigate("/products")}>← Back to Products</button>
          )}
        </div>

        {/* COMPANY */}
        <div className="bk-card">
          <p className="bk-card-title">🏢 Select Company</p>
          <div style={{ maxWidth: 420 }}>
            <select
              className="bk-select"
              style={{ width: "100%" }}
              value={selectedCompany}
              onChange={handleCompanyChange}
            >
              <option value="">Select Company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DEFAULTS BAR */}
        <div className="bk-card">
          <p className="bk-card-title">⚡ Defaults (auto-filled into new rows)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <div className="bk-field">
              <label className="bk-label">Category</label>
              <select
                className="bk-select"
                value={defaults.category_id}
                onChange={(e) => setDefault("category_id", e.target.value)}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="bk-field">
              <label className="bk-label">Sub Category</label>
              <select
                className="bk-select"
                value={defaults.subcategory_id}
                onChange={(e) => setDefault("subcategory_id", e.target.value)}
              >
                <option value="">—</option>
                {subCategories
                  .filter((s) => defaults.category_id && String(s.category_id) === String(defaults.category_id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>
            <div className="bk-field">
              <label className="bk-label">Brand</label>
              <select
                className="bk-select"
                value={defaults.brand_id}
                onChange={(e) => setDefault("brand_id", e.target.value)}
              >
                <option value="">—</option>
                {brands
                  .filter(
                    (b) =>
                      defaults.category_id &&
                      String(b.category_id) === String(defaults.category_id) &&
                      (defaults.subcategory_id ? String(b.subcategory_id) === String(defaults.subcategory_id) : true)
                  )
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>
            <div className="bk-field">
              <label className="bk-label">Supplier</label>
              <select
                className="bk-select"
                value={defaults.supplier_id}
                onChange={(e) => setDefault("supplier_id", e.target.value)}
              >
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>
            <div className="bk-field">
              <label className="bk-label">Unit</label>
              <select
                className="bk-select"
                value={defaults.unit}
                onChange={(e) => setDefault("unit", e.target.value)}
              >
                <option value="">—</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="bk-field">
              <label className="bk-label">GST %</label>
              <input
                className="bk-input"
                type="number"
                placeholder="e.g. 18"
                value={defaults.gst}
                onChange={(e) => setDefault("gst", e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="bk-toolbar-btn bk-btn-add" onClick={applyDefaults}>Apply defaults to rows</button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bk-toolbar">
          <span className="bk-count-badge">{rows.length} row(s)</span>
          <button className="bk-toolbar-btn bk-btn-add" onClick={() => addRows(1)}>+ Add Row</button>
          <button className="bk-toolbar-btn bk-btn-add" onClick={() => addRows(5)}>+ 5 Rows</button>
          <button className="bk-toolbar-btn bk-btn-add" onClick={() => addRows(100)}>+ 100 Rows</button>
          <button className="bk-toolbar-btn bk-btn-outline" onClick={() => setPasteOpen(true)}>📋 Paste from Excel</button>
          <button className="bk-toolbar-btn bk-btn-danger" onClick={clearRows}>Clear All</button>
        </div>

        {/* BACKEND ERRORS */}
        {resultErrors.length > 0 && (
          <div className="bk-error-panel">
            <h4>⚠️ {resultErrors.length} row(s) rejected by server</h4>
            {resultErrors.map((e, i) => (
              <div key={i} className="bk-error-item">Row {e.row}: {e.message}</div>
            ))}
          </div>
        )}

        {/* GRID */}
        <div className="bk-grid-wrap">
          <table className="bk-table">
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, zIndex: 21 }}>#</th>
                <th>Product Name <span className="bk-required-dot">*</span></th>
                <th>HSN Code</th>
                <th>Category <span className="bk-required-dot">*</span></th>
                <th>Sub Category</th>
                <th>Brand</th>
                <th>Supplier</th>
                <th>Unit</th>
                <th>Price <span className="bk-required-dot">*</span></th>
                <th>MRP</th>
                <th>Stock <span className="bk-required-dot">*</span></th>
                <th>GST %</th>
                <th>Barcode</th>
                <th>Color</th>
                <th>Model</th>
                <th>RAM</th>
                <th>Storage</th>
                <th>Display</th>
                <th>Warranty</th>
                <th>Short Description</th>
                <th style={{ position: "sticky", right: 0, zIndex: 21 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.uid} className={isInvalid(row.uid) ? "bk-row-invalid" : ""}>
                  <td className="bk-row-num">{idx + 1}</td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="Product name"
                      value={row.product_name}
                      onChange={(e) => changeCell(row.uid, "product_name", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="e.g. PRD001"
                      value={row.product_code}
                      onChange={(e) => changeCell(row.uid, "product_code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                    />
                  </td>

                  <td>
                    <select
                      className="bk-cell bk-cell-cell"
                      value={row.category_id}
                      onChange={(e) => changeCell(row.uid, "category_id", e.target.value)}
                    >
                      <option value="">Select</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className="bk-cell bk-cell-cell"
                      value={row.subcategory_id}
                      onChange={(e) => changeCell(row.uid, "subcategory_id", e.target.value)}
                    >
                      <option value="">Select</option>
                      {rowSubCategories(row).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className="bk-cell bk-cell-cell"
                      value={row.brand_id}
                      onChange={(e) => changeCell(row.uid, "brand_id", e.target.value)}
                    >
                      <option value="">Select</option>
                      {rowBrands(row).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className="bk-cell bk-cell-cell"
                      value={row.supplier_id}
                      onChange={(e) => changeCell(row.uid, "supplier_id", e.target.value)}
                    >
                      <option value="">Select</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.supplier_name}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <select
                      className="bk-cell bk-cell-cell"
                      value={row.unit}
                      onChange={(e) => changeCell(row.uid, "unit", e.target.value)}
                    >
                      <option value="">Select</option>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={row.price}
                      onChange={(e) => changeCell(row.uid, "price", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={row.mrp}
                      onChange={(e) => changeCell(row.uid, "mrp", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.stock}
                      onChange={(e) => changeCell(row.uid, "stock", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g. 18"
                      value={row.gst_percentage}
                      onChange={(e) => changeCell(row.uid, "gst_percentage", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="Barcode"
                      value={row.barcode}
                      onChange={(e) => changeCell(row.uid, "barcode", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="Color"
                      value={row.color}
                      onChange={(e) => changeCell(row.uid, "color", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="Model"
                      value={row.model_name}
                      onChange={(e) => changeCell(row.uid, "model_name", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="e.g. 8 GB"
                      value={row.ram}
                      onChange={(e) => changeCell(row.uid, "ram", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="e.g. 128 GB"
                      value={row.internal_storage}
                      onChange={(e) => changeCell(row.uid, "internal_storage", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="e.g. 6.7 inch"
                      value={row.display_size}
                      onChange={(e) => changeCell(row.uid, "display_size", e.target.value)}
                    />
                  </td>

                  <td>
                    <input
                      className="bk-cell"
                      placeholder="e.g. 1 Year"
                      value={row.warranty}
                      onChange={(e) => changeCell(row.uid, "warranty", e.target.value)}
                    />
                  </td>

                  <td>
                    <textarea
                      className="bk-cell bk-cell-textarea"
                      rows={1}
                      placeholder="Short description"
                      value={row.short_description}
                      onChange={(e) => changeCell(row.uid, "short_description", e.target.value)}
                    />
                  </td>

                  <td className="bk-row-actions">
                    <button className="bk-row-del" title="Remove row" onClick={() => removeRow(row.uid)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SAVE BAR */}
        <div className="bk-toolbar" style={{ marginTop: 16, justifyContent: "space-between" }}>
          <span className="bk-count-badge">Total rows: {rows.length}</span>
          <button className="bk-toolbar-btn bk-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "💾 Save All Products"}
          </button>
        </div>

        {/* PASTE MODAL */}
        {pasteOpen && (
          <div className="bk-modal-overlay" onClick={() => setPasteOpen(false)}>
            <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
              <h3>📋 Paste from Excel / CSV</h3>
              <p>
                Copy cells from Excel (or a .tsv/.csv file) and paste below. One product per line,
                columns separated by <b>Tab</b>. Column order:
              </p>
              <ol className="bk-hint" style={{ paddingLeft: 22, marginTop: 0 }}>
                <li>Product Name</li>
                <li>HSN Code</li>
                <li>Category</li>
                <li>Sub Category</li>
                <li>Brand</li>
                <li>Supplier</li>
                <li>Unit</li>
                <li>Price</li>
                <li>MRP</li>
                <li>Stock</li>
                <li>GST %</li>
                <li>Barcode</li>
                <li>Color</li>
                <li>Model</li>
                <li>RAM</li>
                <li>Storage</li>
                <li>Display</li>
                <li>Warranty</li>
                <li>Short Description</li>
              </ol>
              <textarea
                className="bk-paste-area"
                placeholder={"Example (tab-separated):\nSamsung Galaxy A15\tSAM001\tMobiles\tSmartphones\tSamsung\t\tPiece\t15000\t18000\t10\t18\t\tBlack\tA15\t8 GB\t128 GB\t6.5 inch\t1 Year\tBudget phone"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className="bk-modal-actions">
                <button className="bk-toolbar-btn bk-btn-outline" onClick={() => setPasteOpen(false)}>Cancel</button>
                <button className="bk-toolbar-btn bk-btn-add" onClick={parsePaste}>Add Pasted Rows</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
