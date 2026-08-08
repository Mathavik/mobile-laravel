export const formatCurrency = (value = 0) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getDiscountPercent = (price = 0, offerPrice = 0) => {
  const basePrice = Number(price) || 0;
  const salePrice = Number(offerPrice) || 0;

  if (!basePrice || !salePrice || salePrice >= basePrice) {
    return 0;
  }

  return Math.round(((basePrice - salePrice) / basePrice) * 100);
};
