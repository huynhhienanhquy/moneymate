export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: any[];
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, errors: any[] = [], code: string = 'REQUEST_FAILED') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
