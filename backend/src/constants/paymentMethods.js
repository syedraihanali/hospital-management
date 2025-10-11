const PAYMENT_METHODS = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
];

function findPaymentMethod(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return PAYMENT_METHODS.find((method) => method.value === normalized) || null;
}

module.exports = {
  PAYMENT_METHODS,
  findPaymentMethod,
};
