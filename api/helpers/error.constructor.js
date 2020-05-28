class BaseError extends Error {
  constructor(name, message, status) {
    super(message);
    this.name = name;
    this.status = status;
  }
}

class ConflictError extends BaseError {
  constructor(message) {
    super("ConflictError", message, 409);
  }
}
class Unauthorized extends BaseError {
  constructor(message) {
    super("Unauthorized", message, 401);
  }
}
module.exports = BaseError;
module.exports = ConflictError;
module.exports = Unauthorized;
