import { Credentials } from "aws-sdk/clients/cognitoidentity";
import sigV4Client from "./sigvClient";

/**
 *
 * @param credentials
 * @param req
 {
  endpoint: "https://sapi.sensive.xyz",
  method: "GET",
  path: "/datav2",
}
 */
export const signRequest = (
  credentials: Credentials,
  req: {
    method: "GET" | "PUT" | "POST";
    body?: any;
    headers?: Headers;
    endpoint: string;
    path: string;
    queryParams: any;
  }
) => {
  const client = sigV4Client.newClient({
    // Your AWS temporary access key
    accessKey: credentials.AccessKeyId!,
    // Your AWS temporary secret key
    secretKey: credentials.SecretKey!,
    // Your AWS temporary session token
    sessionToken: credentials.SessionToken,
    // API Gateway region
    region: "eu-central-1",
    // API Gateway URL
    endpoint: "https://sapi.sensive.xyz",
  });

  const signedRequest = client.signRequest({
    method: req.method,
    path: req.path,
    headers: req.headers,
    queryParams: req.queryParams || {},
    body: req.body,
  });

  return {
    body: signedRequest.body as string,
    url: signedRequest.url as string,
    headers: signedRequest.headers as Headers,
  };
};
