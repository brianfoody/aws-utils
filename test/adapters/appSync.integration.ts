import { retry } from "ts-retry-promise";
import { makeAppSyncApi } from "../../src/adapters/appSyncDataApi";
import { makeCognitoAuthoriser } from "../../src/adapters/cognitoFederatedAuthoriser";
import { makeCognitoAuthenticator } from "../../src/adapters/cognitoUserPoolAuthenticator";
import { DataApi } from "../../src/ports/api";
import { Authenticator } from "../../src/ports/authenticator";
import { Authoriser } from "../../src/ports/authoriser";
import { LocalStorage } from "../../src/ports/storageLocal";
import {
  adminVerifyUser,
  APP_SYNC_API_URL,
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
  let dataApi: DataApi;

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

    dataApi = makeAppSyncApi({
      config: {
        region: AWS_REGION!,
        apiUrl: APP_SYNC_API_URL,
      },
      authoriser,
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

    // const authorisation = await authoriser.authorise();
  });

  afterAll(async () => {
    // Sign out
    await authenticator.signOut();
  });

  test("a user can add an item through the AppSync API", async () => {
    const response = await dataApi.addTrack({
      trackId: Math.random() + "",
      responses: [
        {
          emotion: "Happy",
          score: 2,
        },
      ],
    });

    console.log("write response");
    console.log(response);
    await expect(response).toBeDefined();
    // await expect(response.trackId).toBeDefined();
  });

  test("a user can add a note through the AppSync API", async () => {
    const response = await dataApi.addNote({
      nid: Math.random() + "",
      n: "This is a note",
      t: "This is a title",
      hint: "This is a hint",
      images: ["myimage.jpeg"],
    });

    console.log("add note response");
    console.log(response);
    await expect(response).toBeDefined();
    // await expect(response.nid).toBeDefined();
  });

  test("a user can call the AppSync API", async () => {
    const response = await dataApi.load();

    console.log(response);

    await expect(response.tracks?.length).toBeGreaterThan(0);
  });
});
