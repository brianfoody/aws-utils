import { AWSCredentials } from "./authoriser";

export type ServiceFactory<S> = (credentials: AWSCredentials) => S;

export interface CachedService<S> {
  get: () => Promise<S>;
}
