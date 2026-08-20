import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import ProductMedia from "../components/ProductMedia";
import { 
  Package, 
  Calendar, 
  Eye, 
  X, 
  Clock, 
  CheckCircle, 
  FileText, 
  Truck, 
  Copy, 
  Check,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CalendarDays,
  ShieldCheck
} from "lucide-react";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to format date short
const formatDateShort = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/shop/orders', { params: { user_id: user.id } });
      const payload = response.data;

      if (payload?.success) {
        const ordersData = Array.isArray(payload.data) ? payload.data : [];
        setOrders(ordersData);
      } else {
        setOrders([]);
        setError(payload?.message || 'No orders found');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const viewInvoice = (orderId) => {
    navigate(`/invoice/${orderId}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
      packed: "bg-purple-50 text-purple-700 border-purple-200",
      shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusDotColor = (status) => {
    const colors = {
      pending: "bg-amber-400",
      processing: "bg-blue-400",
      confirmed: "bg-indigo-400",
      packed: "bg-purple-400",
      shipped: "bg-cyan-400",
      delivered: "bg-emerald-400",
      cancelled: "bg-rose-400",
    };
    return colors[status] || "bg-gray-400";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={14} className="text-amber-600" />,
      processing: <Package size={14} className="text-blue-600" />,
      confirmed: <CheckCircle size={14} className="text-indigo-600" />,
      packed: <Package size={14} className="text-purple-600" />,
      shipped: <Truck size={14} className="text-cyan-600" />,
      delivered: <CheckCircle size={14} className="text-emerald-600" />,
      cancelled: <X size={14} className="text-rose-600" />,
    };
    return icons[status] || <Clock size={14} className="text-gray-600" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      processing: "Processing",
      confirmed: "Confirmed",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return labels[status] || status || "Unknown";
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeFilter === "all") return true;
    return (order.status || 'pending') === activeFilter;
  });

  const getDeliveryProgress = (order) => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
    const status = order.status || 'pending';
    const idx = statusOrder.indexOf(status);
    if (idx === -1) return 0;
    return Math.round(((idx) / (statusOrder.length - 1)) * 100);
  };

  const getDeliveryETA = (order) => {
    if (order.status === 'delivered') return 'Delivered';
    const est = order.estimated_delivery;
    if (!est) return null;
    const now = new Date();
    const estDate = new Date(est);
    const diffMs = estDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Arriving today';
    if (diffDays === 1) return 'Arriving tomorrow';
    return `Arriving in ${diffDays} days`;
  };

  // Order status counts
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const orderStatuses = [
    { key: "all", label: "All", count: orders.length },
    { key: "pending", label: "Pending", count: statusCounts.pending || 0 },
    { key: "processing", label: "Processing", count: statusCounts.processing || 0 },
    { key: "shipped", label: "Shipped", count: statusCounts.shipped || 0 },
    { key: "delivered", label: "Delivered", count: statusCounts.delivered || 0 },
    { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled || 0 },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f0ede6]">
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-[#2563eb]" />
          </div>
          <p className="text-gray-600 text-lg font-semibold">Please login to view your orders</p>
          <Link to="/login" className="mt-5 inline-block px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f0ede6] pt-[116px] lg:pt-[156px] pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">Orders</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-[#0f172a]">
              My Orders
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Track and manage your orders
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Total Orders: <span className="font-semibold text-[#0f172a]">{orders.length}</span>
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
            <p className="text-rose-600 text-sm">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 text-sm text-rose-600 hover:text-rose-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {orderStatuses.map((status) => (
            <button
              key={status.key}
              onClick={() => setActiveFilter(status.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeFilter === status.key
                  ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/30"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status.label}
              {status.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === status.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {status.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#2563eb]/20 border-t-[#2563eb]"></div>
              <p className="text-gray-400 text-sm mt-4 text-center">Loading your orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
            <div className="w-24 h-24 rounded-full bg-[#f8fafc] flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-600 text-lg font-semibold">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
            <Link to="/" className="mt-6 inline-block px-8 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.items?.length || 0;
              const status = order.status || 'pending';
              
              return (
                <div
                  key={order.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100/50 hover:border-[#2563eb]/20 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-sm font-bold text-[#1a1a1a] bg-gray-50 px-3 py-1 rounded-lg">
                            #{order.id}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`}></span>
                            {getStatusIcon(status)}
                            {getStatusLabel(status)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              order.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            <CreditCard size={12} />
                            {order.payment_status === "paid" ? "Paid" : "Pending"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-500 mt-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDateShort(order.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-gray-400" />
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck size={14} className="text-gray-400" />
                            <span>{order.tracking_id ? 'Shipped' : 'Not shipped'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#2563eb] text-base">
                              ₹{parseFloat(order.total || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Mini delivery progress */}
                        {order.status !== 'cancelled' && (
                          <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck size={13} className={order.status === 'delivered' ? 'text-emerald-500' : 'text-[#2563eb]'} />
                                <span className={`text-xs font-semibold ${order.status === 'delivered' ? 'text-emerald-600' : 'text-[#1a1a1a]'}`}>
                                  {getDeliveryETA(order) || 'Delivery updating'}
                                </span>
                              </div>
                              {order.estimated_delivery && order.status !== 'delivered' && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <CalendarDays size={10} />
                                  {formatDateShort(order.estimated_delivery)}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  order.status === 'delivered'
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed]'
                                }`}
                                style={{ width: `${getDeliveryProgress(order)}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[9px] text-gray-400">Ordered</span>
                              <span className="text-[9px] text-gray-400">
                                {order.status === 'delivered' ? 'Delivered' : 'Delivery'}
                              </span>
                            </div>
                          </div>
                        )}

                        {order.tracking_id && (
                          <div className="mt-2 flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-1.5 inline-flex">
                            <Truck size={14} className="text-indigo-500" />
                            <span className="text-xs text-indigo-700 font-medium">
                              Tracking: {order.tracking_id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.tracking_id)}
                              className="p-0.5 text-indigo-400 hover:text-indigo-600 transition"
                            >
                              {copiedId === order.tracking_id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order.id}/track`)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200"
                        >
                          <Truck size={16} />
                          Track
                        </button>

                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2563eb] bg-[#2563eb]/10 rounded-xl hover:bg-[#2563eb] hover:text-white transition-all duration-200"
                        >
                          <Eye size={16} />
                          Details
                        </button>

                        <button
                          onClick={() => viewInvoice(order.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200"
                        >
                          <FileText size={16} />
                          Invoice
                        </button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 overflow-x-auto pb-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 flex-shrink-0">
                              <ProductMedia
                                product={item}
                                image={item.image}
                                video={item.video_url}
                                alt={item.product_name}
                                className="w-12 h-12 object-cover rounded-lg bg-gray-50"
                              />
                              <div className="text-xs">
                                <p className="font-medium text-gray-700 max-w-[100px] truncate">{item.product_name}</p>
                                <p className="text-gray-400">Qty: {item.quantity}</p>
                              </div>
                              {index < order.items.slice(0, 3).length - 1 && (
                                <span className="text-gray-300">•</span>
                              )}
                            </div>
                          ))}
                          {itemCount > 3 && (
                            <span className="text-xs text-gray-400 font-medium">
                              +{itemCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#2563eb]/10 to-[#2563eb]/5 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1a1a1a]">
                    Order #{selectedOrder.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center transition text-gray-400 hover:text-gray-600"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
              {/* Status Bar */}
              <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-4 border border-amber-100 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusDotColor(selectedOrder.status || 'pending')}`}></span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {getStatusLabel(selectedOrder.status || 'pending')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard size={14} />
                    <span>{selectedOrder.payment_status === "paid" ? "Payment Completed" : "Payment Pending"}</span>
                  </div>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Details</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-[#1a1a1a] flex items-center gap-2">
                      <span>{selectedOrder.customer_name || selectedOrder.name || "Customer"}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {selectedOrder.email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      {selectedOrder.mobile || selectedOrder.phone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    {selectedOrder.shipping_address || selectedOrder.address || "N/A"}
                  </p>
                </div>
              </div>

              {/* Tracking Info */}
              {selectedOrder.tracking_id && (
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-indigo-500" />
                      <div>
                        <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Tracking ID</p>
                        <p className="font-mono font-semibold text-[#1a1a1a]">
                          {selectedOrder.tracking_id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.tracking_id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-medium"
                    >
                      {copiedId === selectedOrder.tracking_id ? (
                        <><Check size={14} /> Copied</>
                      ) : (
                        <><Copy size={14} /> Copy</>
                      )}
                    </button>
                  </div>
                  {selectedOrder.shipped_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Shipped on: {formatDate(selectedOrder.shipped_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                  <Package size={16} className="text-[#2563eb]" />
                  Order Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50/30 rounded-xl p-3 border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <ProductMedia
                        product={item}
                        image={item.image}
                        video={item.video_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-100"
                      />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1a1a1a] text-sm truncate">{item.product_name}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            {item.size && <span>• Size: {item.size}</span>}
                            <span className="text-[#2563eb] font-semibold">
                              ₹{parseFloat(item.total || item.price * item.quantity || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-[#2563eb]/10 to-[#2563eb]/5 rounded-2xl p-5 border border-[#2563eb]/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-[#2563eb]">
                    ₹{parseFloat(selectedOrder.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    navigate(`/orders/${selectedOrder.id}/track`);
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
                >
                  <Truck size={16} />
                  Track Order
                </button>
                {selectedOrder.tracking_id && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.tracking_id);
                      setCopiedId(selectedOrder.tracking_id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
                  >
                    <Copy size={16} />
                    Copy Tracking
                  </button>
                )}
                <button
                  onClick={() => viewInvoice(selectedOrder.id)}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition font-medium"
                >
                  <FileText size={16} />
                  View Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;