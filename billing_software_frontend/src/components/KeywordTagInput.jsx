import { useState } from "react";

const normalize = (raw) =>
  String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export default function KeywordTagInput({
  value = [],
  onChange,
  placeholder = "Type a keyword and press Enter, comma or Tab",
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = normalize(input);
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="kti-root">
      <style>{`
        .kti-box{
          display:flex; flex-wrap:wrap; gap:8px; align-items:center;
          min-height:48px; padding:8px 12px;
          border:1.5px solid #e2e8f0; border-radius:12px; background:#f8faff;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .kti-box:focus-within{
          border-color:#2563eb; box-shadow:0 0 0 3px rgba(59,130,246,.12);
        }
        .kti-chip{
          display:inline-flex; align-items:center; gap:6px;
          background:#1e40af; color:#fff; font-size:13px; font-weight:600;
          border-radius:100px; padding:4px 6px 4px 12px; line-height:1.2;
        }
        .kti-x{
          background:rgba(255,255,255,.25); border:none; color:#fff; cursor:pointer;
          width:18px; height:18px; border-radius:50%; font-size:13px; line-height:1;
          display:inline-flex; align-items:center; justify-content:center;
          transition:background .15s ease;
        }
        .kti-x:hover{ background:rgba(255,255,255,.45); }
        .kti-input{
          flex:1; min-width:160px; border:none; outline:none; background:transparent;
          font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; padding:4px 2px;
        }
        .kti-hint{ margin-top:6px; font-size:12px; color:#94a3b8; }
      `}</style>

      <div className="kti-box">
        {value.map((tag) => (
          <span key={tag} className="kti-chip">
            {tag}
            <button
              type="button"
              className="kti-x"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="kti-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>
      <p className="kti-hint">
        Press Enter, comma or Tab to add a keyword. Click × to remove. Duplicates are ignored.
      </p>
    </div>
  );
}
