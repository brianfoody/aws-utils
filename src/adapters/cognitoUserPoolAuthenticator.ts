import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { retry } from "ts-retry-promise";
import { Authenticator, NotAuthenticatedError } from "../ports/authenticator";
import { LocalStorage } from "../ports/storageLocal";

type ProviderConfig = {
  userPoolId: string;
  clientId: string;
  region: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  localStorage: LocalStorage;
};

export const AUTH_ID = "COGNITO";

export const makeCognitoAuthenticator = ({
  config,
  localStorage,
}: ProviderPorts): Authenticator => {
  const client = new CognitoIdentityProviderClient({ region: config.region });

  const PROVIDER_ID = `cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`;

  return {
    isLoggedIn: async () => {
      const refreshToken = await retry(
        () => localStorage.getItem("REFRESH_TOKEN"),
        {
          retries: 3,
          delay: 1000,
        }
      );

      return !!refreshToken;
    },
    signUp: async (props) => {
      const command = new SignUpCommand({
        ClientId: config.clientId,
        Username: props.username,
        Password: props.password,
        UserAttributes: [
          {
            Name: "phone_number",
            Value: props.phoneNumber,
          },
        ],
      });
      console.info(`Sending SignUpCommand`);
      const response = await retry(() => client.send(command), {
        retries: 3,
        delay: 1000,
      });

      return {
        id: response.UserSub,
      };
    },
    signIn: async (props) => {
      // If set then  sign in and return challenge
      const command = new InitiateAuthCommand({
        ClientId: config.clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: props.username,
          PASSWORD: props.password,
        },
      });

      console.info(`Sending SignInCommand (USER_ID_FOR_SRP)`);
      const response = await retry(() => client.send(command), {
        retries: 3,
        delay: 1000,
      });

      if (response.ChallengeName) {
        return {
          challenge: true,
          username: response.ChallengeParameters!.USER_ID_FOR_SRP,
          session: response.Session,
        };
      }

      const refreshToken = response.AuthenticationResult!.RefreshToken;
      if (refreshToken) {
        try {
          await localStorage.setItem("REFRESH_TOKEN", refreshToken);
          await localStorage.setItem("AUTH_ID", AUTH_ID);
        } catch (error) {
          console.error(error);
          throw error;
        }
      }

      return {
        challenge: false,
        success: {
          accessToken: response.AuthenticationResult?.AccessToken!,
          identityToken: response.AuthenticationResult?.IdToken!,
          providerId: PROVIDER_ID,
        },
      };
    },
    refresh: async () => {
      const refreshToken = await localStorage.getItem("REFRESH_TOKEN");

      if (!refreshToken) {
        throw new NotAuthenticatedError("No refresh token.");
      }

      try {
        const command = new InitiateAuthCommand({
          ClientId: config.clientId,
          AuthFlow: "REFRESH_TOKEN_AUTH",
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        });

        console.info(`Sending InitiateAuth (REFRESH_TOKEN_AUTH)`);
        const response = await retry(() => client.send(command), {
          retries: 3,
          delay: 1000,
        });

        return {
          challenge: false,
          success: {
            accessToken: response.AuthenticationResult?.AccessToken!,
            identityToken: response.AuthenticationResult?.IdToken!,
            providerId: PROVIDER_ID,
          },
        };
      } catch (err) {
        throw new NotAuthenticatedError("Cognito authenication failed");
      }
    },
    verifySignup: async (props) => {
      const command = new ConfirmSignUpCommand({
        ClientId: config.clientId,
        Username: props.username,
        ConfirmationCode: props.code,
      });

      console.info(`Sending ConfirmSignUpCommand`);
      await retry(() => client.send(command), {
        retries: 3,
        delay: 1000,
      });

      await localStorage.setItem("AUTH_ID", AUTH_ID);
      
    },
    verifySignin: async (props) => {
      const command = new RespondToAuthChallengeCommand({
        ClientId: config.clientId,
        ChallengeName: "SMS_MFA",
        Session: props.session,
        ChallengeResponses: {
          SMS_MFA_CODE: props.code,
          USERNAME: props.username!,
        },
      });

      console.info(`Sending RespondToAuthChallengeCommand`);
      const resp = await retry(() => client.send(command), {
        retries: 3,
        delay: 1000,
      });

      if (resp.AuthenticationResult?.RefreshToken) {
        await localStorage.setItem(
          "REFRESH_TOKEN",
          resp.AuthenticationResult?.RefreshToken
        );
        await localStorage.setItem("AUTH_ID", AUTH_ID);
      }

      return {
        challenge: false,
        success: {
          accessToken: resp.AuthenticationResult?.AccessToken!,
          identityToken: resp.AuthenticationResult?.IdToken!,
          providerId: PROVIDER_ID,
        },
      };
    },
    signOut: async () => {
      console.log("Use authentication manager instead for this");
    },
    resendCode: async (props) => {
      const command = new ResendConfirmationCodeCommand({
        Username: props.username,
        ClientId: config.clientId,
      });

      console.info(`Sending ResendConfirmationCodeCommand`);
      await retry(() => client.send(command), {
        retries: 3,
        delay: 1000,
      });
    },
  } as Authenticator;
};
