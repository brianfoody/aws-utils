import { Credentials } from "aws-sdk/clients/cognitoidentity";
import makeSig4Client from "./sigvClient";

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

type Response = {
  body: string;
  url: string;
  headers: Headers;
};

export const signRequest = (
  credentials: Credentials,
  req: {
    method: "GET" | "PUT" | "POST";
    body?: any;
    headers?: Headers;
    region?: string;
    endpoint: string;
    path: string;
    queryParams: any;
  }
): Response | undefined => {
  const client = makeSig4Client({
    // Your AWS temporary access key
    accessKey: credentials.AccessKeyId!,
    // Your AWS temporary secret key
    secretKey: credentials.SecretKey!,
    // Your AWS temporary session token
    sessionToken: credentials.SessionToken!,
    // API Gateway region
    region: req.region || "eu-central-1",
    // API Gateway URL
    endpoint: req.endpoint || "https://sapi.sensive.xyz",
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
