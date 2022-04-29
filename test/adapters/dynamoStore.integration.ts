import { retry } from "ts-retry-promise";
import { makeCognitoAuthoriser } from "../../src/adapters/cognitoFederatedAuthoriser";
import { makeCognitoAuthenticator } from "../../src/adapters/cognitoUserPoolAuthenticator";
import { makeDynamoStore } from "../../src/adapters/dynamoStore";
import { Authenticator } from "../../src/ports/authenticator";
import { Authoriser } from "../../src/ports/authoriser";
import { Database } from "../../src/ports/database";
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

describe("dynamoStore", () => {
  let authenticator: Authenticator;
  let localStorer: LocalStorage;
  let authoriser: Authoriser;
  let database: Database<any, any>;
  let identityId: string = "";

  let username = "sdaasssda";
  let password = "test!234SDs@@@swss";
  let phoneNumber = "+61285038000";

  beforeAll(async () => {
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

    database = makeDynamoStore({
      config: {
        region: AWS_REGION!,
        tableName: "Tracking",
      },
      authoriser: authoriser,
    });

    try {
      await retry(() => deleteUser(phoneNumber), {
        retries: 5,
        timeout: 5000,
      });
    } catch (err) {
      console.log(err);
    }

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

    const authorisation = await authoriser.authorise();

    identityId = authorisation.identityId!;
  });

  afterAll(async () => {
    // Sign out
    await authenticator.signOut();
  });

  test("a user cannot post a track session for themselves", async () => {
    const track = {
      userId: "a-random-user",
      trackedOn: +new Date(),
    };

    await expect(database.put(track)).rejects.toThrow();
  });

  test("a user can post a track session for themselves", async () => {
    const track = {
      userId: identityId,
      trackedOn: +new Date(),
    };

    const item = await database.put(track);

    expect(item).toEqual(track);
  });
});
