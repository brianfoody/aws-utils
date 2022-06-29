import { HttpRequest } from "@aws-sdk/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Authoriser } from "../ports";
import { DataApi } from "../ports/api";
import fetch from "cross-fetch";

type ProviderConfig = {
  apiUrl: string;
  region: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  authoriser: Authoriser;
};

export const makeAppSyncApi = ({
  authoriser,
  config,
}: ProviderPorts): DataApi => {
  const url = new URL(config.apiUrl);

  const execRequest = async (req: { query: string; variables?: any }) => {
    const request = new HttpRequest({
      hostname: url.hostname,
      path: url.pathname,
      body: JSON.stringify(req as any),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: url.hostname,
      },
    });

    const signer = new SignatureV4({
      credentials: authoriser.authorise,
      service: "appsync",
      region: config.region,
      sha256: Sha256,
    });

    const { headers, body, method } = await signer.sign(request);

    return await fetch(config.apiUrl, {
      headers,
      body,
      method,
    }).then((res) => res.json());
  };

  return {
    addTrack: async (track) => {
      const response = await execRequest({
        query: `
            mutation PostATrack($input: TrackInput!) {
                addTrack(input: $input) {
                    trackId
                }
            } 
        `,
        variables: {
          input: track,
        },
      });

      return response.data.addTrack;
    },
    addNote: async (_note) => {
      return {
        nid: "",
      };
    },
    addFeedback: async (_feedback) => {
      return {
        u: "",
        on: +new Date(),
      };
    },
    addHealthRecords: async (_record) => {
      return {} as any;
    },
    updateSettings: async (_settings) => {
      return { u: "" };
    },
    updateUser: async (_user) => {
      return { id: "" };
    },
    load: async () => {
      const response = await execRequest({
        query: `
                query MyQuery {
                    getTracks {
                        userId
                        trackedOn
                        trackId
                        responses {
                            emotion
                            score
                        }
                    }
                }
            `,
      });

      return response.data.getTracks;
    },
  };
};
