import { Credentials as BaseCredentials } from "@aws-sdk/types";

export type AWSCredentials = BaseCredentials & {
  identityId?: string;
};

// if(error instanceof NotAuthorisedError){
export class NotAuthorisedError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotAuthorisedError.prototype);
  }
}

export interface Authoriser {
  authorise: () => Promise<AWSCredentials>;
}
