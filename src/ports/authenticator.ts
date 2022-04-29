type SignUpProps = {
  username: string;
  password: string;
  phoneNumber: string;
};
type SignInProps = {
  username: string;
  password: string;
};
type VerifySignUpProps = {
  username: string;
  code: string;
};
type VerifySignInProps = {
  session?: string;
  username?: string;
  code: string;
};

export type Authentication = {
  challenge: boolean;
  session?: string;
  username?: string;
  success: {
    identityToken: string;
    providerId: string;
    id?: string;
    accessToken?: string;
  };
};

// if(error instanceof NotAuthenticatedError){
export class NotAuthenticatedError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotAuthenticatedError.prototype);
  }
}

type SignUpResponse = { id: string };

export interface Authenticator<
  A = Authentication,
  R = SignUpResponse,
  I = SignInProps,
  U = SignUpProps,
  VI = VerifySignInProps,
  VU = VerifySignUpProps
> {
  isLoggedIn: () => Promise<boolean>;
  signIn: (props: I) => Promise<A>;
  signUp: (props: U) => Promise<R>;
  refresh: () => Promise<A>;
  signOut: () => Promise<void>;
  resendCode: ({ username }: { username: string }) => Promise<void>;
  verifySignin?: (props: VI) => Promise<A>;
  verifySignup?: (props: VU) => Promise<void>;
}
