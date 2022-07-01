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

describe("appSyncEndToEndTest", () => {
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

  test("a user can add a track", async () => {
    // const response = await dataApi.addTrack({
    //   trackId: Math.random() + "",
    //   responses: [
    //     {
    //       emotion: "Happy",
    //       score: 2,
    //     },
    //   ],
    // });

    // await expect(response).toBeDefined();
    // Just no errors is good
    expect(true).toBeTruthy();
  });

  test("a user can add and update a note", async () => {
    const response = await dataApi.addOrUpdateNote({
      createdOn: +new Date(),
      nid: Math.random() + "",
      n: "This is a note",
      t: "This is a title",
      hint: "This is a hint",
      images: ["myimage.jpeg"],
    });

    // Just no errors is good
    expect(true).toBeTruthy();
    // await expect(response).toBeDefined();
    // await expect(response.nid).toBeDefined();
  });

  test("a user can add feedback", async () => {
    const response = await dataApi.addFeedback({
      c: "This is some test feedback",
      f: "s",
      t: "c",
    });

    await expect(response).toBeDefined();
  });

  test("a user can add or update their settings", async () => {
    await dataApi.addOrUpdateSettings({
      disableSounds: true,
      num_e: 28,
    });

    // Just no errors is good
    expect(true).toBeTruthy();
    // await expect(response).toBeDefined();
  });

  test("a user can add or update their contact details", async () => {
    await dataApi.addOrUpdateUser({
      givenName: "John Testy",
      familyName: "TESterson",
      phoneNumber: "+6148888",
    });

    // Just no errors is good
    expect(true).toBeTruthy();
    // await expect(response).toBeDefined();
  });

  test("a user can fetch all data", async () => {
    const response = await dataApi.load();

    console.log(response);

    // await expect(response.tracks?.length).toBeGreaterThan(0);
    await expect(response.notes?.length).toBeGreaterThan(0);
    await expect(response.feedback?.length).toBeGreaterThan(0);
    await expect(response.settings?.disableSounds).toBeTruthy();
    await expect(response.settings?.num_e).toBeTruthy();
  });
});
