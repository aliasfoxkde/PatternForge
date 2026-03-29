/**
 * Shared types for the PatternForge application.
 *
 * Add cross-cutting type definitions here that are used across
 * multiple features or layers.
 */

/** General-purpose callback with no arguments and no return. */
export type VoidCallback = () => void;

/** A function that takes a value and returns nothing. */
export type Mutator<T> = (value: T) => void;

/** A generic result type for operations that can fail. */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
