export function loginErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Invalid credentials";
    case 429:
      // The login endpoint allows 10 attempts per IP per 15 minutes. Showing "invalid
      // credentials" here makes a rate-limited user retype a password that is already correct.
      return "Too many attempts. Try again in a few minutes.";
    default:
      return "Login is unavailable right now. Try again shortly.";
  }
}
