function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  // Remove all non-digit characters except leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  return cleaned;
}

function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  const cleaned = normalizePhoneNumber(phoneNumber);
  // Allow phone numbers with at least 7 digits
  const digitsOnly = cleaned.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

module.exports = {
  normalizePhoneNumber,
  validatePhoneNumber,
};
