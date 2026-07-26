/**
 * Wraps a non-ok response from an upstream service. `httpStatus` mirrors
 * the upstream's own status code (a 404 from `listing` becomes a 404 from
 * `bff`) -- `@classifieds/platform`'s exception filter picks it up the
 * same way it does for every other service's domain errors.
 */
export class UpstreamServiceError extends Error {
  constructor(
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
  }
}
