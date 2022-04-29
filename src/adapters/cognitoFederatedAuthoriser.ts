import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import jwtDecode from "jwt-decode";
import { Authenticator } from "../ports/authenticator";
import { Authoriser } from "../ports/authoriser";

type ProviderConfig = {
  identityPoolId: string;
  accountId: string;
  region: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  authenticationProvider: Authenticator;
};

export const makeCognitoAuthoriser = ({
  authenticationProvider,
  config,
}: ProviderPorts): Authoriser => {
  let identityToken: string | undefined;
  let providerId: string | undefined;

  return {
    authorise: async () => {
      if (
        !identityToken ||
        (jwtDecode(identityToken) as any).exp < Date.now() / 1000
      ) {
        const { success } = await authenticationProvider.refresh();
        identityToken = success.identityToken;
        providerId = success.providerId;
      }

      return fromCognitoIdentityPool({
        identityPoolId: config.identityPoolId,
        accountId: config.accountId,
        logins: {
          [providerId!]: identityToken,
        },
        clientConfig: {
          region: config.region,
        },
      })();
    },
  };
};
