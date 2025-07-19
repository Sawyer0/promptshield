/**
 * Represents the result of an operation that can succeed or fail
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Represents a successful result
 */
export class Ok<T> {
  readonly kind = 'ok';

  constructor(public readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as Result<T, F>;
  }
}

/**
 * Represents a failed result
 */
export class Err<E> {
  readonly kind = 'err';

  constructor(public readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as Result<U, E>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as Result<U, E | F>;
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }
}

/**
 * Creates a successful result
 */
export const ok = <T>(value: T): Result<T, never> => new Ok(value);

/**
 * Creates a failed result
 */
export const err = <E>(error: E): Result<never, E> => new Err(error);

/**
 * Pattern matching for Result types
 */
export const match = <T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U => {
  if (result.isOk()) {
    return handlers.ok(result.value);
  } else {
    return handlers.err(result.error);
  }
};

/**
 * Unwraps a Result, throwing an error if it's an Err
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.isOk()) {
    return result.value;
  } else {
    throw result.error;
  }
};

/**
 * Unwraps a Result, returning a default value if it's an Err
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.isOk()) {
    return result.value;
  } else {
    return defaultValue;
  }
};
