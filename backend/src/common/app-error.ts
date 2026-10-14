export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: any[];
  public readonly code: string;

  /**
   * Create an application error with HTTP status and stable error metadata.
   *
   * Use it to keep shared app error behavior consistent across application layers.
   * @param message - The human-readable outcome message returned to the caller.
   * @param statusCode - The HTTP status code associated with the response or error.
   * @param errors - Optional validation or domain details that explain the failure.
   * @param code - The stable machine-readable code used to classify the outcome.
   */
  constructor(message: string, statusCode: number = 400, errors: any[] = [], code: string = 'REQUEST_FAILED') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
