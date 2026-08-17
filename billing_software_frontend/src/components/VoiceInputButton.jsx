import { useState, useRef, useEffect, useCallback } from "react";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function setNativeValue(el, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, "value"
  )?.set || Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, "value"
  )?.set;
  if (nativeSetter) nativeSetter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function VoiceInputButton() {
  const [active, setActive] = useState(false);
  const [supported] = useState(() => !!SpeechRecognition);
  const recognitionRef = useRef(null);
  const focusedRef = useRef(null);

  useEffect(() => {
    const onFocus = (e) => {
      const t = e.target;
      if (t.tagName === "INPUT" && t.type === "text") {
        focusedRef.current = t;
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      alert("Voice input not supported. Please use Chrome or Edge.");
      return;
    }
    if (!focusedRef.current) {
      alert("Click on any text input field first, then press the mic button.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      const el = focusedRef.current;
      if (el && document.body.contains(el)) {
        const sep = el.value && !el.value.endsWith(" ") ? " " : "";
        setNativeValue(el, el.value + sep + text);
        el.focus();
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      if (e.error !== "no-speech") setActive(false);
    };

    recognition.onend = () => {
      if (active) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setActive(true);
  }, [supported, active]);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  if (!supported) return null;

  return (
    <>
      <style>{`
        .voice-mode-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          width: 56px; height: 56px; border-radius: 50%; border: none;
          background: ${active ? "#ef4444" : "#6366f1"}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .25s;
          box-shadow: 0 4px 20px ${active ? "rgba(239,68,68,.45)" : "rgba(99,102,241,.35)"};
        }
        .voice-mode-fab:hover { transform: scale(1.08); }
        .voice-mode-fab.active { animation: vm-pulse 1.2s ease-in-out infinite; }
        .voice-mode-fab svg { width: 26px; height: 26px; }
        @keyframes vm-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5); }
          50%     { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
        }
        .voice-mode-badge {
          position: fixed; bottom: 92px; right: 18px; z-index: 9999;
          background: #1e293b; color: #fff; padding: 8px 16px;
          border-radius: 20px; font-size: 13px; font-weight: 600;
          pointer-events: none; animation: vm-badge-in .25s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,.2);
          display: flex; align-items: center; gap: 8px;
        }
        .voice-mode-badge .vm-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
          animation: vm-dot-blink .8s ease-in-out infinite;
        }
        @keyframes vm-badge-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes vm-dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      {active && (
        <div className="voice-mode-badge">
          <span className="vm-dot" />
          Listening... click any input & speak
        </div>
      )}

      <button
        type="button"
        className={`voice-mode-fab ${active ? "active" : ""}`}
        onClick={() => active ? stop() : start()}
        title={active ? "Stop voice mode" : "Start voice mode"}
      >
        {active ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>
    </>
  );
}
