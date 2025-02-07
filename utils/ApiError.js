class ApiError {
  constructor(statusCode) {
    this.statusCode = statusCode;
  }

  static badRequest() {
    return new ApiError(400);
  }

  static notFound() {
    return new ApiError(404);
  }

  static methodNotAllowed() {
    return new ApiError(405);
  }

  static unsupportedMediaType() {
    return new ApiError(415);
  }

  static serviceUnavailable() {
    return new ApiError(500);
  }
}

module.exports = ApiError;
