export class InvalidResponseMessageError extends Error {
  readonly httpStatus = 400;
}
