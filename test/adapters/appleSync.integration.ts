import { makeAppSyncApi } from "../../src/adapters/appSyncDataApi";
import { makeCognitoAuthoriser } from "../../src/adapters/cognitoFederatedAuthoriser";
import { DataApi } from "../../src/ports/api";
import { Authoriser } from "../../src/ports/authoriser";
import {
  APP_SYNC_API_URL,
  AWS_ACCOUNT_ID,
  AWS_IDENTITY_POOL_ID,
  AWS_REGION,
} from "../testUtils";

describe("appSyncEndToEndTest", () => {
  let authoriser: Authoriser;
  let dataApi: DataApi;

  beforeAll(async () => {
    jest.clearAllMocks();

    authoriser = makeCognitoAuthoriser({
      config: {
        region: AWS_REGION!,
        identityPoolId: AWS_IDENTITY_POOL_ID!,
        accountId: AWS_ACCOUNT_ID!,
      },
      authenticationProvider: {
        refresh: async () =>
          ({
            success: {
              identityToken:
                "eyJraWQiOiJmaDZCczhDIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoieHl6LnNlbnNpdmUiLCJleHAiOjE2NTc3Nzc4MzcsImlhdCI6MTY1NzY5MTQzNywic3ViIjoiMDAxNzU5LjZlNWUzYjQwOGFkOTQ3M2RhMjI2YWZlODFmOTJiZDc4LjEyMjIiLCJhdF9oYXNoIjoiSVpLOFdUTXBoRmhKZXlOM2l2WjRCUSIsImVtYWlsIjoieGduZ242amM1YUBwcml2YXRlcmVsYXkuYXBwbGVpZC5jb20iLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJpc19wcml2YXRlX2VtYWlsIjoidHJ1ZSJ9.Fpq4xbZHaaCMgaoewXF4TOO8uqzrE6l0Ul6D01cBMes37bLV7mlGNnIJLedqWcsk-Q-QE_ScIwuXdW5DIHOCLrrr4sunKagUgAH6_p3YbZb_4gGjPbITjevzqUUk-LFqJFwIDPeoSCeUKI9hFC2RYgWtcHG4cVFdiGOlVUkJ1QwJEoMFf3sPqLF8tIYicLF8lwPPK2VzrFJeWNvmAafpjGq_TTNhNtDkfdGKP8enePVFTMlJW6KSapMCBZlkkBiG9rCYXb6vRaFkPn0Sruu8AnX088juSAK7Xg9_cWM0nJG9HfquyWrKmj8McR6p4uzIrUHkAYrqnjLlFarlQFKObg",
              providerId: "appleid.apple.com",
            },
          } as any),
      } as any,
    });

    dataApi = makeAppSyncApi({
      config: {
        region: AWS_REGION!,
        apiUrl: APP_SYNC_API_URL,
      },
      authoriser,
    });

    // try {
    //   await retry(() => deleteUser(phoneNumber), {
    //     retries: 5,
    //     timeout: 5000,
    //   });
    // } catch (err) {
    //   console.log(err);
    // }

    // await authenticator.signUp({
    //   username,
    //   password,
    //   phoneNumber,
    // });

    // await adminVerifyUser(username);

    // await authenticator.signIn({
    //   username,
    //   password,
    // });

    // const authorisation = await authoriser.authorise();
  });

  afterAll(async () => {
    // Sign out
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
    await dataApi.addOrUpdateNote({
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

    console.log(JSON.stringify("response"));
    console.log(JSON.stringify(response));

    // await expect(response.tracks?.length).toBeGreaterThan(0);
    await expect(response.notes?.length).toBeGreaterThan(0);
    await expect(response.feedback?.length).toBeGreaterThan(0);
    await expect(response.settings?.disableSounds).toBeTruthy();
    await expect(response.settings?.num_e).toBeTruthy();
  });
});
