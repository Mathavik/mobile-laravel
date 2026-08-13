const STORAGE_KEY = "mobilekart_addresses";

const getAddresses = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persist = (addresses) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  return addresses;
};

const saveAddress = (address, existingId = null) => {
  const addresses = getAddresses();
  const id = existingId || `addr-${Date.now()}`;
  const record = { id, ...address, is_default: false };

  if (existingId) {
    const index = addresses.findIndex((a) => a.id === existingId);
    if (index !== -1) {
      addresses[index] = { ...addresses[index], ...record };
    }
  } else {
    addresses.unshift(record);
  }

  if (addresses.length === 1 || record.is_default) {
    addresses.forEach((a) => (a.is_default = a.id === record.id));
  }

  return persist(addresses).find((a) => a.id === record.id);
};

const deleteAddress = (id) => {
  let addresses = getAddresses().filter((a) => a.id !== id);
  if (addresses.length > 0 && !addresses.some((a) => a.is_default)) {
    addresses[0].is_default = true;
  }
  return persist(addresses);
};

const setDefaultAddress = (id) => {
  const addresses = getAddresses().map((a) => ({
    ...a,
    is_default: a.id === id,
  }));
  return persist(addresses);
};

const formatFullAddress = (address) => {
  if (!address) return "";
  const parts = [
    address.address,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  return parts.join(", ");
};

export {
  getAddresses,
  saveAddress,
  deleteAddress,
  setDefaultAddress,
  formatFullAddress,
};
