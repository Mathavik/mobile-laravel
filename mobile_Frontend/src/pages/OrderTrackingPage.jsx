import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import ProductMedia from "../components/ProductMedia";
import {
  ClipboardCheck,
  CheckCircle,
  Loader,
  Package,
  Truck,
  MapPinCheck,
  XCircle,
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
  Home,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatDateFull = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return `${formatDateFull(dateString)}, ${formatTime(dateString)}`;
};

const iconMap = {
  "clipboard-check": ClipboardCheck,
  "check-circle": CheckCircle,
  loader: Loader,
  package: Package,
  truck: Truck,
  "map-pin-check": MapPinCheck,
  "x-circle": XCircle,
};

const stepLabels = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function OrderTrackingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && id) fetchTracking();
  }, [user, id]);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/shop/orders/${id}/tracking`, {
        params: { user_id: user.id },
      });
      if (res.data?.success) {
        setTracking(res.data.data);
      } else {
        setError(res.data?.message || "Failed to load tracking");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tracking");
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingId = () => {
    if (tracking?.tracking_id) {
      navigator.clipboard.writeText(tracking.tracking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deliveryInfo = useMemo(() => {
    if (!tracking) return null;
    const now = new Date();
    const estDate = tracking.estimated_delivery
      ? new Date(tracking.estimated_delivery)
      : null;
    const orderDate = tracking.created_at ? new Date(tracking.created_at) : null;

    if (tracking.status === "delivered") {
      const deliveredDate = tracking.delivered_at
        ? new Date(tracking.delivered_at)
        : now;
      return {
        label: "Delivered",
        sub: `Delivered on ${formatDateFull(deliveredDate)}`,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: <CheckCircle size={20} className="text-emerald-600" />,
      };
    }

    if (!estDate) {
      return {
        label: "Order Confirmed",
        sub: "Delivery date updating soon",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: <CheckCircle size={20} className="text-blue-600" />,
      };
    }

    const diffMs = estDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    let urgencyColor, urgencyBg, urgencyBorder;
    if (diffDays <= 0) {
      urgencyColor = "text-orange-600";
      urgencyBg = "bg-orange-50";
      urgencyBorder = "border-orange-200";
    } else if (diffDays === 1) {
      urgencyColor = "text-amber-600";
      urgencyBg = "bg-amber-50";
      urgencyBorder = "border-amber-200";
    } else {
      urgencyColor = "text-blue-600";
      urgencyBg = "bg-blue-50";
      urgencyBorder = "border-blue-200";
    }

    let timeLabel;
    if (diffDays < 0) {
      timeLabel = "Delivery was expected " + formatDateFull(estDate);
    } else if (diffDays === 0) {
      timeLabel = diffHours <= 2 ? "Arriving today" : `Arriving today by ${formatTime(estDate)}`;
    } else if (diffDays === 1) {
      timeLabel = "Arriving tomorrow";
    } else {
      timeLabel = `Arriving in ${diffDays} days`;
    }

    return {
      label: timeLabel,
      sub: `Expected by ${formatDateFull(estDate)}`,
      color: urgencyColor,
      bgColor: urgencyBg,
      borderColor: urgencyBorder,
      icon: <Truck size={20} className={urgencyColor} />,
    };
  }, [tracking]);

  const mainSteps = useMemo(() => {
    if (!tracking?.timeline) return [];
    const mainStatuses = ["pending", "confirmed", "processing", "packed", "shipped", "delivered"];
    return mainStatuses.map((s) => {
      const t = tracking.timeline.find((tl) => tl.status === s);
      return {
        status: s,
        label: stepLabels.find((sl) => sl.key === s)?.label || s,
        completed: t?.completed || false,
        active: t?.active || false,
        happened_at: t?.happened_at || null,
      };
    });
  }, [tracking]);

  const horizontalProgress = useMemo(() => {
    if (!mainSteps.length) return 0;
    const completedCount = mainSteps.filter((s) => s.completed || s.active).length;
    return ((completedCount - 1) / (mainSteps.length - 1)) * 100;
  }, [mainSteps]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white shadow-lg p-10 text-center max-w-sm">
          <Package size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">Login to track your order</p>
          <Link
            to="/login"
            className="mt-4 inline-block px-6 py-2.5 bg-[#2563eb] text-white rounded-full font-semibold text-sm"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[116px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2563eb]/20 border-t-[#2563eb] mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-[116px]">
        <div className="text-center max-w-sm px-4">
          <XCircle size={36} className="text-rose-400 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">{error || "Order not found"}</p>
          <button
            onClick={() => navigate("/orders")}
            className="mt-4 px-6 py-2.5 bg-[#2563eb] text-white rounded-full font-semibold text-sm"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[116px] lg:pt-[156px] pb-20">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563eb] mb-4 transition"
        >
          <ArrowLeft size={16} />
          My Orders
        </button>

        {/* ====== HERO CARD ====== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {/* Top: Status banner */}
          <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Order #{tracking.order_id}</p>
                  <p className="font-bold text-base">
                    {tracking.status === "delivered" ? "Order Delivered" : "Order Confirmed"}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchTracking}
                className="p-2 bg-white/15 rounded-lg hover:bg-white/25 transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Delivery ETA banner */}
          {deliveryInfo && (
            <div className={`px-5 py-3 ${deliveryInfo.bgColor} border-b ${deliveryInfo.borderColor}`}>
              <div className="flex items-center gap-2">
                {deliveryInfo.icon}
                <div>
                  <p className={`font-bold text-sm ${deliveryInfo.color}`}>
                    {deliveryInfo.label}
                  </p>
                  <p className="text-xs text-gray-500">{deliveryInfo.sub}</p>
                </div>
              </div>
            </div>
          )}

          {/* ====== HORIZONTAL STEPPER ====== */}
          <div className="px-5 py-5">
            <div className="relative flex items-center justify-between">
              {/* Background line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />
              {/* Active line */}
              <div
                className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] transition-all duration-700"
                style={{ width: `calc(${horizontalProgress}% - 32px)` }}
              />

              {mainSteps.map((step, i) => {
                const isDone = step.completed;
                const isNow = step.active;
                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isDone
                          ? "bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white shadow-md shadow-[#2563eb]/30"
                          : isNow
                          ? "bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white shadow-md shadow-[#2563eb]/30 ring-4 ring-[#2563eb]/20"
                          : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                      }`}
                    >
                      {isDone && !isNow ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-1.5 font-medium text-center leading-tight max-w-[52px] ${
                        isDone || isNow ? "text-[#1a1a1a]" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====== TRACKING ID CARD ====== */}
        {tracking.tracking_id && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Truck size={18} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Tracking ID
                  </p>
                  <p className="font-mono font-bold text-[#1a1a1a]">
                    {tracking.tracking_id}
                  </p>
                </div>
              </div>
              <button
                onClick={copyTrackingId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-xs font-medium text-gray-600"
              >
                {copied ? (
                  <><Check size={12} className="text-emerald-600" /> Copied</>
                ) : (
                  <><Copy size={12} /> Copy</>
                )}
              </button>
            </div>
            {tracking.carrier && (
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Carrier: <b className="text-gray-700">{tracking.carrier}</b></span>
                {tracking.shipped_at && (
                  <span>Shipped: <b className="text-gray-700">{formatDateFull(tracking.shipped_at)}</b></span>
                )}
              </div>
            )}
            {tracking.tracking_url && (
              <a
                href={tracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-xs font-semibold"
              >
                Track on {tracking.carrier || "carrier"} website
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* ====== DETAILED TIMELINE ====== */}
        {tracking.timeline && tracking.timeline.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-[#1a1a1a] text-sm mb-5 flex items-center gap-2">
              <Clock size={16} className="text-[#2563eb]" />
              Shipment Details
            </h3>

            <div className="space-y-0">
              {[...tracking.timeline].reverse().map((step, index) => {
                const Icon = iconMap[step.icon] || CheckCircle;
                const isFirst = index === 0;
                const isCompleted = step.completed;
                const isActive = step.active;
                const isPending = !isCompleted && !isActive;

                return (
                  <div
                    key={step.status}
                    className={`relative flex gap-3.5 ${
                      !isFirst ? "pt-1" : ""
                    }`}
                  >
                    {/* Vertical connector line */}
                    {index < tracking.timeline.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-8px)] ${
                          isCompleted
                            ? "bg-gradient-to-b from-[#2563eb] to-[#2563eb]/30"
                            : "bg-gray-200"
                        }`}
                      />
                    )}

                    {/* Dot */}
                    <div
                      className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                        isActive
                          ? "bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/40 animate-pulse"
                          : isCompleted
                          ? "bg-[#2563eb] text-white"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      {isActive ? (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      ) : isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Icon size={14} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${index === tracking.timeline.length - 1 ? "pb-0" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isActive ? "text-[#2563eb]" : isCompleted ? "text-[#1a1a1a]" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.note && (isCompleted || isActive) && (
                            <p className="text-xs text-gray-500 mt-0.5">{step.note}</p>
                          )}
                        </div>
                        {step.happened_at && (isCompleted || isActive) && (
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-[10px] text-gray-400">{formatDate(step.happened_at)}</p>
                            <p className="text-[10px] text-gray-400">{formatTime(step.happened_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== DELIVERY ADDRESS ====== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin size={16} className="text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Delivering to
              </p>
              <p className="text-sm font-medium text-[#1a1a1a] mt-0.5">
                {tracking.customer_name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {tracking.shipping_address}
              </p>
            </div>
          </div>
        </div>

        {/* ====== ORDER ITEMS ====== */}
        {tracking.items && tracking.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
              Items in this order
            </h3>
            <div className="space-y-3">
              {tracking.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <ProductMedia
                    product={item}
                    image={item.image}
                    video={item.video_url}
                    alt={item.product_name}
                    className="w-14 h-14 object-cover rounded-lg bg-gray-50 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{item.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>Qty: {item.quantity}</span>
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#1a1a1a]">
                    ₹{parseFloat(item.price || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-[#2563eb]">
                ₹{parseFloat(tracking.grand_total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ====== BOTTOM ACTIONS ====== */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition font-medium text-sm"
          >
            <Home size={16} />
            All Orders
          </button>
          <Link
            to={`/invoice/${tracking.order_id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition font-medium text-sm text-center"
          >
            View Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackingPage;
