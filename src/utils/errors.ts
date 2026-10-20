export class ValidationError extends Error {
  status = 400;
}

export class NotFoundError extends Error {
  status = 404;
}
