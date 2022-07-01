import { retry } from "ts-retry-promise";
import { makeCognitoAuthoriser } from "../..//src/adapters/cognitoFederatedAuthoriser";
import { Authoriser } from "../..//src/ports/authoriser";
import { makeCognitoAuthenticator } from "../../src/adapters/cognitoUserPoolAuthenticator";
import { Authenticator } from "../../src/ports/authenticator";
import { LocalStorage } from "../../src/ports/storageLocal";
import {
  adminVerifyUser,
  AWS_ACCOUNT_ID,
  AWS_IDENTITY_POOL_ID,
  AWS_REGION,
  AWS_USER_POOL_ID,
  AWS_USER_POOL_WEB_CLIENT_ID,
  deleteUser,
  testLocalStorer,
} from "../testUtils";

describe("cognitoIdenticator", () => {
  let authenticator: Authenticator;
  let localStorer: LocalStorage;
  let authoriser: Authoriser;

  let username = "aofneenjenjek";
  let password = "test!234SDs@@@swss";
  let phoneNumber = "+61285038000";

  beforeEach(async () => {
    jest.clearAllMocks();

    localStorer = testLocalStorer();

    authenticator = makeCognitoAuthenticator({
      config: {
        region: AWS_REGION!,
        userPoolId: AWS_USER_POOL_ID!,
        clientId: AWS_USER_POOL_WEB_CLIENT_ID!,
      },
      localStorage: localStorer,
    });

    authoriser = makeCognitoAuthoriser({
      config: {
        region: AWS_REGION!,
        identityPoolId: AWS_IDENTITY_POOL_ID!,
        accountId: AWS_ACCOUNT_ID!,
      },
      authenticationProvider: authenticator,
    });

    try {
      await retry(() => deleteUser(phoneNumber), {
        retries: 5,
        timeout: 5000,
      });
    } catch (err) {
      console.log(err);
    }
  });

  test("a user can be signed up by phone number", async () => {
    await authenticator.signUp({
      username,
      password,
      phoneNumber,
    });

    await adminVerifyUser(username);

    await authenticator.signIn({
      username,
      password,
    });

    const credentials = await authoriser.authorise();

    console.log(credentials);

    expect(credentials.identityId).toBeDefined();
    expect(credentials.accessKeyId).toBeDefined();
    expect(credentials.secretAccessKey).toBeDefined();
    expect(credentials.sessionToken).toBeDefined();

    // // Sign out
    // await authenticator.signOut();
  });
});
