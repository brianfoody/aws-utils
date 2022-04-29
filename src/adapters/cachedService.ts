import { Authoriser, AWSCredentials } from "../ports/authoriser";
import { CachedService, ServiceFactory } from "../ports/cachedService";

type CachedServicePorts<S> = {
  authoriser: Authoriser;
  serviceFactory: ServiceFactory<S>;
};

/**
 *
 * @param ports Wraps a credentials provider around a service to ensure it is being called with valid credentials.
 * @returns
 */
export const makeCachedService = <S>(
  ports: CachedServicePorts<S>
): CachedService<S> => {
  let service: S | undefined;
  let expiry: number | undefined;
  let fetching: Promise<AWSCredentials> | undefined;

  return {
    get: async () => {
      const needsRefreshing = !service || !expiry || expiry < +new Date();
      if (needsRefreshing && !fetching) {
        console.log(`Expired: ${expiry} < ${+new Date()}`);

        fetching = ports.authoriser.authorise();

        const credentials = await fetching;

        expiry = credentials.expiration ? +credentials.expiration : undefined;
        service = ports.serviceFactory(credentials);

        fetching = undefined;
      } else if (fetching) {
        await fetching;
      }

      return service!;
    },
  };
};
