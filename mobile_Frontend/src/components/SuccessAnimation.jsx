import { motion } from "framer-motion";
import { Check } from "lucide-react";

const CONFETTI_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: 12 + ((i * 37) % 76),
  delay: 0.15 + (i % 7) * 0.06,
  duration: 1.6 + (i % 5) * 0.2,
  size: 6 + (i % 3) * 2,
  rotate: (i % 2 === 0 ? 1 : -1) * (120 + i * 30),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

export default function SuccessAnimation({ size = 96 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Confetti burst */}
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: 0, y: -size * 0.85, opacity: 0, scale: 1, rotate: c.rotate }}
          transition={{ delay: c.delay, duration: c.duration, ease: "easeOut" }}
          className="absolute rounded-sm"
          style={{
            left: `${c.left}%`,
            top: "50%",
            width: c.size,
            height: c.size * 1.6,
            backgroundColor: c.color,
          }}
        />
      ))}

      {/* Pulsing rings */}
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            delay: ring * 0.55,
            ease: "easeOut",
          }}
          className="absolute rounded-full border-2 border-emerald-400/50"
          style={{ width: size * 0.72, height: size * 0.72 }}
        />
      ))}

      {/* Checkmark circle */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
        className="relative z-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.32, type: "spring", damping: 14, stiffness: 260 }}
        >
          <Check
            strokeWidth={3}
            className="text-white"
            style={{ width: size * 0.3, height: size * 0.3 }}
          />
        </motion.span>
      </motion.div>
    </div>
  );
}
