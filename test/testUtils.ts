import {
  CognitoIdentityProviderClient,
  AdminDisableUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { LocalStorage } from "../src/ports/storageLocal";

export const AWS_REGION = "eu-central-1";
export const AWS_ACCOUNT_ID = "897386833887";
export const AWS_USER_POOL_ID = "eu-central-1_YL8wQOsyc";
export const AWS_USER_POOL_WEB_CLIENT_ID = "7doggdlvsibjbqgfinnq4ukopu";
export const APP_SYNC_API_URL =
  "https://5cb4dclunjesldrlaw5dg4nt7m.appsync-api.eu-central-1.amazonaws.com/graphql";
export const AWS_IDENTITY_POOL_ID =
  "eu-central-1:39736276-2ef6-48b7-bc9b-5599735b2d77";

export const testLocalStorer = (): LocalStorage => {
  const storage: { [key: string]: any } = {};
  return {
    setItem: async (key, value) => {
      storage[key] = value;
    },
    getItem: async (key) => {
      return storage[key] || null;
    },
    deleteItem: async (key) => {
      storage[key] = null;
    },
    removeItem: async (key) => {
      storage[key] = null;
    },
  };
};

export const deleteUser = async (phoneNumber: string) => {
  const client = new CognitoIdentityProviderClient({ region: AWS_REGION });

  const user = await client.send(
    new ListUsersCommand({
      UserPoolId: AWS_USER_POOL_ID,
      Filter: `phone_number = "${phoneNumber}"`,
    })
  );

  if (!user.Users?.length) return;

  await client.send(
    new AdminDisableUserCommand({
      UserPoolId: AWS_USER_POOL_ID,
      Username: user.Users![0].Username!,
    })
  );

  await client.send(
    new AdminDeleteUserCommand({
      UserPoolId: AWS_USER_POOL_ID,
      Username: user.Users![0].Username!,
    })
  );
};

export const adminVerifyUser = async (username: string) => {
  const client = new CognitoIdentityProviderClient({ region: AWS_REGION });

  await client.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: AWS_USER_POOL_ID,
      Username: username,
    })
  );
};
