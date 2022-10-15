import {
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
  SetUserMFAPreferenceCommand,
  SetUserSettingsCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { retry } from "ts-retry-promise";
import { AuthenticationManager } from "../ports/authenticationManager";
import { Authenticator } from "../ports/authenticator";
import { Authoriser, AWSCredentials } from "../ports/authoriser";
import { LocalStorage } from "../ports/storageLocal";
import { makeCachedService } from "./cachedService";

type ProviderConfig = {
  region: string;
  clientId: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  authenticator: Authenticator;
  authoriser: Authoriser;
  localStorage: LocalStorage;
};

/**
 * Got a bit confused here. Some calls to cognito user pools require you to be authenticated
 * and didn't want to have a cyclic dep between authoriser to get acess and authenticator.
 *
 * Feel like I'm missing something but need to move on/
 * @param param0
 * @returns
 */
export const makeCognitoAuthManager = ({
  authoriser,
  authenticator,
  localStorage,
  config,
}: ProviderPorts): AuthenticationManager => {
  let cognitoCache = makeCachedService<CognitoIdentityProviderClient>({
    authoriser,
    serviceFactory: (creds: AWSCredentials) =>
      new CognitoIdentityProviderClient({
        region: config.region,
        credentials: creds,
      }),
  });

  return {
    setMfaSigninAccess: async () => {
      const client = await cognitoCache.get();

      const creds = await authenticator.refresh();

      console.info(`Sending SetUserMFAPreferenceCommand`);
      await client.send(
        new SetUserMFAPreferenceCommand({
          AccessToken: creds.success!.accessToken!,
          SMSMfaSettings: {
            PreferredMfa: true,
            Enabled: true,
          },
        })
      );

      console.info(`Sending SetUserSettingsCommand`);
      await client.send(
        new SetUserSettingsCommand({
          AccessToken: creds.success!.accessToken!,
          MFAOptions: [
            {
              DeliveryMedium: "SMS",
              AttributeName: "phone_number",
            },
          ],
        })
      );
    },
    signOut: async () => {
      await localStorage.deleteItem("AUTH_ID");

      const refreshToken = await retry(
        () => localStorage.getItem("REFRESH_TOKEN"),
        { retries: 3 }
      );

      if (!refreshToken) {
        return;
      }
      const client = await cognitoCache.get();

      const creds = await authenticator.refresh();

      const command = new GlobalSignOutCommand({
        AccessToken: creds.success!.accessToken!,
      });

      await localStorage.deleteItem("REFRESH_TOKEN");

      console.info(`Sending GlobalSignOutCommand`);
      await retry(() => client.send(command), {
        retries: 3,
      });
    },
  };
};
