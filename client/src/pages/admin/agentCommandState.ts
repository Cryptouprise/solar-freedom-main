export function fullCycleRunError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The full system cycle did not complete. Check the recorded run history before trying again.";
}
