export interface AuthenticationManager {
  setMfaSigninAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}
