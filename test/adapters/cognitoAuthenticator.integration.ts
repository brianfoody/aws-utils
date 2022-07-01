import jwt_decode from "jwt-decode";
import { retry } from "ts-retry-promise";
import { makeCognitoAuthenticator } from "../../src/adapters/cognitoUserPoolAuthenticator";
import { Authenticator } from "../../src/ports/authenticator";
import { LocalStorage } from "../../src/ports/storageLocal";
import {
  adminVerifyUser,
  AWS_REGION,
  AWS_USER_POOL_ID,
  AWS_USER_POOL_WEB_CLIENT_ID,
  deleteUser,
  testLocalStorer,
} from "../testUtils";

describe("cognitoIdenticator", () => {
  let authenticator: Authenticator;
  let localStorer: LocalStorage;
  let username = "abcdefg";
  let password = "test!234SDs@@@swss";
  let phoneNumber = "+353830960910";

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
    const now = +new Date();
    const { id } = await authenticator.signUp({
      username,
      password,
      phoneNumber,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (authenticator.resendCode) {
      await authenticator.resendCode({
        username,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    await adminVerifyUser(username);

    const signedIn = await authenticator.signIn({
      username,
      password,
    });

    expect(signedIn.challenge).toEqual(false);
    expect(signedIn.success.accessToken).toBeDefined();
    expect(signedIn.session).not.toBeDefined();

    const decoded: any = jwt_decode(signedIn.success!.accessToken!);
    expect(decoded.sub).toEqual(id);
    expect(decoded.iss).toContain(AWS_USER_POOL_ID);
    expect(decoded.client_id).toEqual(AWS_USER_POOL_WEB_CLIENT_ID);

    const isLoggedIn1 = await authenticator.isLoggedIn();
    expect(isLoggedIn1).toBeTruthy();

    const expiryUnix = decoded.exp * 1000;
    expect(now - expiryUnix).toBeLessThan(10000);

    // Refresh
    const refreshed = await authenticator.refresh();
    const decodedRefresh: any = jwt_decode(refreshed.success!.accessToken!);
    const expiryUnixRefresh = decodedRefresh.exp * 1000;
    expect(now - expiryUnixRefresh).toBeLessThan(10000);

    // Sign out
    await authenticator.signOut();
    const isLoggedIn2 = await authenticator.isLoggedIn();
    expect(isLoggedIn2).not.toBeTruthy();

    // Verify that next sign in requires MFA
    const signedInAgain = await authenticator.signIn({
      username,
      password,
    });

    expect(signedInAgain.challenge).toEqual(true);
    expect(signedInAgain.session).toBeDefined();

    // TODO If you want to test with your own phone number yoh can uncommment this
    // and populate smsCode.txt
    // await new Promise((resolve) => setTimeout(resolve, 15000));

    // const code = await readFileContents("./test/adapters/smsCode.txt");

    // await authenticator.verifySignin({
    //   session: signedInAgain.session!,
    //   code: code,
    //   username: signedInAgain.username!,
    // });
  });
});
