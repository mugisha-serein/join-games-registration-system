function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

function errorResponse(message = 'An error occurred', errors = {}) {
  return {
    success: false,
    message,
    errors,
  };
}

function paginatedResponse(data, pagination) {
  return {
    success: true,
    data,
    pagination,
  };
}

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
