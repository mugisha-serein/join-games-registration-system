function validateFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return false;
  const trimmed = fullName.trim();
  return trimmed.length >= 2 && trimmed.length <= 255;
}

function validateJoinType(joinType) {
  const validTypes = ['ninja_region_family', 'tiktok_game'];
  return validTypes.includes(joinType);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function trimAllStrings(obj) {
  const trimmed = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      trimmed[key] = obj[key].trim();
    } else {
      trimmed[key] = obj[key];
    }
  }
  return trimmed;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

module.exports = {
  validateFullName,
  validateJoinType,
  validateEmail,
  trimAllStrings,
  escapeHtml,
};
