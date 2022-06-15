// @ts-ignore
// @ts-ignore
import encHex from "crypto-js/enc-hex";
// @ts-ignore
import HmacSHA256 from "crypto-js/hmac-sha256";
import SHA256 from "crypto-js/sha256";

type Config = {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  endpoint: string;
  region: string;
  serviceName?: string;
  defaultAcceptType?: string;
  defaultContentType?: string;
};

export const makeNewSigClient = (config: Config) => {
  const AWS_SHA_256 = "AWS4-HMAC-SHA256";
  const AWS4_REQUEST = "aws4_request";
  const AWS4 = "AWS4";
  const X_AMZ_DATE = "x-amz-date";
  const X_AMZ_SECURITY_TOKEN = "x-amz-security-token";
  const HOST = "host";
  const AUTHORIZATION = "Authorization";

  function hash(value: any) {
    return SHA256(value); // eslint-disable-line
  }

  function hexEncode(value: any) {
    return value.toString(encHex);
  }

  function hmac(secret: any, value: any) {
    // @ts-ignore
    return HmacSHA256(value, secret, { asBytes: true }); // eslint-disable-line
  }

  function buildCanonicalRequest(
    method: any,
    path: any,
    queryParams: any,
    headers: any,
    payload: any
  ) {
    return (
      method +
      "\n" +
      buildCanonicalUri(path) +
      "\n" +
      buildCanonicalQueryString(queryParams) +
      "\n" +
      buildCanonicalHeaders(headers) +
      "\n" +
      buildCanonicalSignedHeaders(headers) +
      "\n" +
      hexEncode(hash(payload))
    );
  }

  function hashCanonicalRequest(request: any) {
    return hexEncode(hash(request));
  }

  function buildCanonicalUri(uri: any) {
    return encodeURI(uri);
  }

  function buildCanonicalQueryString(queryParams: any) {
    if (Object.keys(queryParams).length < 1) {
      return "";
    }

    let sortedQueryParams = [];
    for (let property in queryParams) {
      if (queryParams.hasOwnProperty(property)) {
        sortedQueryParams.push(property);
      }
    }
    sortedQueryParams.sort();

    let canonicalQueryString = "";
    for (let i = 0; i < sortedQueryParams.length; i++) {
      canonicalQueryString +=
        sortedQueryParams[i] +
        "=" +
        encodeURIComponent(queryParams[sortedQueryParams[i]]) +
        "&";
    }
    return canonicalQueryString.substr(0, canonicalQueryString.length - 1);
  }

  function buildCanonicalHeaders(headers: any) {
    let canonicalHeaders = "";
    let sortedKeys = [];
    for (let property in headers) {
      if (headers.hasOwnProperty(property)) {
        sortedKeys.push(property);
      }
    }
    sortedKeys.sort();

    for (let i = 0; i < sortedKeys.length; i++) {
      canonicalHeaders +=
        sortedKeys[i].toLowerCase() + ":" + headers[sortedKeys[i]] + "\n";
    }
    return canonicalHeaders;
  }

  function buildCanonicalSignedHeaders(headers: any) {
    let sortedKeys = [];
    for (let property in headers) {
      if (headers.hasOwnProperty(property)) {
        sortedKeys.push(property.toLowerCase());
      }
    }
    sortedKeys.sort();

    return sortedKeys.join(";");
  }

  function buildStringToSign(
    datetime: any,
    credentialScope: any,
    hashedCanonicalRequest: any
  ) {
    return (
      AWS_SHA_256 +
      "\n" +
      datetime +
      "\n" +
      credentialScope +
      "\n" +
      hashedCanonicalRequest
    );
  }

  function buildCredentialScope(datetime: any, region: any, service: any) {
    return (
      datetime.substr(0, 8) + "/" + region + "/" + service + "/" + AWS4_REQUEST
    );
  }

  function calculateSigningKey(
    secretKey: any,
    datetime: any,
    region: any,
    service: any
  ) {
    return hmac(
      hmac(
        hmac(hmac(AWS4 + secretKey, datetime.substr(0, 8)), region),
        service
      ),
      AWS4_REQUEST
    );
  }

  function calculateSignature(key: any, stringToSign: any) {
    return hexEncode(hmac(key, stringToSign));
  }

  function extractHostname(url: any) {
    var hostname;

    if (url.indexOf("://") > -1) {
      hostname = url.split("/")[2];
    } else {
      hostname = url.split("/")[0];
    }

    hostname = hostname.split(":")[0];
    hostname = hostname.split("?")[0];

    console.log("hostname: " + hostname);

    return hostname;
  }

  function buildAuthorizationHeader(
    accessKey: any,
    credentialScope: any,
    headers: any,
    signature: any
  ) {
    return (
      AWS_SHA_256 +
      " Credential=" +
      accessKey +
      "/" +
      credentialScope +
      ", SignedHeaders=" +
      buildCanonicalSignedHeaders(headers) +
      ", Signature=" +
      signature
    );
  }

  let awsSigV4Client: any = {};
  if (config.accessKey === undefined || config.secretKey === undefined) {
    return awsSigV4Client;
  }
  awsSigV4Client.accessKey = config.accessKey;
  awsSigV4Client.secretKey = config.secretKey;
  awsSigV4Client.sessionToken = config.sessionToken;
  awsSigV4Client.serviceName = config.serviceName || "execute-api";
  awsSigV4Client.region = config.region || "us-east-1";
  awsSigV4Client.defaultAcceptType =
    config.defaultAcceptType || "application/json";
  awsSigV4Client.defaultContentType =
    config.defaultContentType || "application/json";

  const invokeUrl = config.endpoint;
  // @ts-ignore
  const endpoint = /(^https?:\/\/[^/]+)/g.exec(invokeUrl)[1];
  const pathComponent = invokeUrl.substring(endpoint.length);

  awsSigV4Client.endpoint = endpoint;
  awsSigV4Client.pathComponent = pathComponent;

  awsSigV4Client.signRequest = (request: any) => {
    const verb = request.method.toUpperCase();
    const path = awsSigV4Client.pathComponent + request.path;
    const queryParams = { ...request.queryParams };
    const headers = { ...request.headers };

    // If the user has not specified an override for Content type the use default
    if (headers["Content-Type"] === undefined) {
      headers["Content-Type"] = awsSigV4Client.defaultContentType;
    }

    // If the user has not specified an override for Accept type the use default
    if (headers.Accept === undefined) {
      headers.Accept = awsSigV4Client.defaultAcceptType;
    }

    let body = { ...request.body };
    // override request body and set to empty when signing GET requests
    if (request.body === undefined || verb === "GET") {
      body = "";
    } else {
      body = JSON.stringify(body);
    }

    // If there is no body remove the content-type header so it is not
    // included in SigV4 calculation
    if (body === "" || body === undefined || body === null) {
      delete headers["Content-Type"];
    }

    let datetime = new Date()
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z")
      .replace(/[:-]|\.\d{3}/g, "");
    headers[X_AMZ_DATE] = datetime;
    headers[HOST] = extractHostname(awsSigV4Client.endpoint);

    let canonicalRequest = buildCanonicalRequest(
      verb,
      path,
      queryParams,
      headers,
      body
    );
    let hashedCanonicalRequest = hashCanonicalRequest(canonicalRequest);
    let credentialScope = buildCredentialScope(
      datetime,
      awsSigV4Client.region,
      awsSigV4Client.serviceName
    );
    let stringToSign = buildStringToSign(
      datetime,
      credentialScope,
      hashedCanonicalRequest
    );
    let signingKey = calculateSigningKey(
      awsSigV4Client.secretKey,
      datetime,
      awsSigV4Client.region,
      awsSigV4Client.serviceName
    );
    let signature = calculateSignature(signingKey, stringToSign);
    headers[AUTHORIZATION] = buildAuthorizationHeader(
      awsSigV4Client.accessKey,
      credentialScope,
      headers,
      signature
    );
    if (
      awsSigV4Client.sessionToken !== undefined &&
      awsSigV4Client.sessionToken !== ""
    ) {
      headers[X_AMZ_SECURITY_TOKEN] = awsSigV4Client.sessionToken;
    }
    delete headers[HOST];

    let url = awsSigV4Client.endpoint + path;
    let queryString = buildCanonicalQueryString(queryParams);
    if (queryString !== "") {
      url += "?" + queryString;
    }

    // Need to re-attach Content-Type if it is not specified at this point
    if (headers["Content-Type"] === undefined) {
      headers["Content-Type"] = awsSigV4Client.defaultContentType;
    }

    return {
      body,
      headers,
      url,
    };
  };

  return awsSigV4Client;
};

export default makeNewSigClient;
