export class ListingNotFoundError extends Error {
  readonly httpStatus = 404;
  constructor(id: string) {
    super(`listing "${id}" not found`);
  }
}

export class ListingForbiddenError extends Error {
  readonly httpStatus = 403;
  constructor(id: string) {
    super(`listing "${id}" does not belong to this user`);
  }
}
