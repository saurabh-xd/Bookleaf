export interface AppError extends Error {
  statusCode: number;
  details?: any;
}

export const createAppError = (message: string, statusCode = 400, details?: any): AppError => {
  const error = new Error(message) as AppError;
  error.name = "AppError";
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const notFoundError = (message = "Resource not found"): AppError => {
  return createAppError(message, 404);
};

export const unauthorizedError = (message = "Unauthorized access"): AppError => {
  return createAppError(message, 401);
};

export const forbiddenError = (message = "Forbidden: Insufficient permissions"): AppError => {
  return createAppError(message, 403);
};

export const badRequestError = (message = "Bad request", details?: any): AppError => {
  return createAppError(message, 400, details);
};

// Aliases for quick throws
export const throwNotFound = (message = "Resource not found"): never => {
  throw notFoundError(message);
};

export const throwUnauthorized = (message = "Unauthorized access"): never => {
  throw unauthorizedError(message);
};

export const throwForbidden = (message = "Forbidden: Insufficient permissions"): never => {
  throw forbiddenError(message);
};

export const throwBadRequest = (message = "Bad request", details?: any): never => {
  throw badRequestError(message, details);
};
