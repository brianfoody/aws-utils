import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import fetch from "cross-fetch";
import { Authoriser } from "../ports";
import { DataApi } from "../ports/api";

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

    const result = await fetch(config.apiUrl, {
      headers,
      body,
      method,
    }).then((res) => res.json());

    if (result.errors) {
      const errString = JSON.stringify(result.errors, null, 2);
      console.log(errString);
      throw new Error(`AppSync Errors ${errString}`);
    }

    return result;
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
    addOrUpdateNote: async (note) => {
      const response = await execRequest({
        query: `
            mutation PostANote($input: NoteInput!) {
                addOrUpdateNote(input: $input) {
                    nid
                }
            }
        `,
        variables: {
          input: note,
        },
      });

      return response.data.addNote;
    },
    addFeedback: async (feedback) => {
      const response = await execRequest({
        query: `
            mutation PostFeedback($input: FeedbackInput!) {
                addFeedback(input: $input) {
                    u
                    createdOn
                }
            }
        `,
        variables: {
          input: feedback,
        },
      });

      return response.data.addFeedback;
    },
    addHealthRecords: async (_records) => {},
    addOrUpdateSettings: async (settings) => {
      const response = await execRequest({
        query: `
            mutation UpdateSettings($input: SettingsInput!) {
                addOrUpdateSettings(input: $input) {
                    u
                }
            }
        `,
        variables: {
          input: settings,
        },
      });

      return response.data.updateSettings;
    },
    addOrUpdateUser: async (user) => {
      const response = await execRequest({
        query: `
            mutation UpdateUser($input: UserInput!) {
                addOrUpdateUser(input: $input) {
                    id
                }
            }
        `,
        variables: {
          input: user,
        },
      });

      return response.data.updateUser;
    },
    load: async () => {
      const response = await execRequest({
        query: `
          query LoadData {
              load {
                user {
                  id
                  phoneNumber
                  sub
                  givenName
                  familyName
                  nickname
                  email
                }
                feedback {
                  createdOn
                  f
                  t
                  c
                }
                settings {
                  disableSounds
                  autoJournalDisabled
                  hints
                  remind
                  remindTime
                  rndm
                  rndm_min
                  rndm_max
                  num_e
                  v
                  tz
                }
                tracks {
                  trackId
                  userId
                  trackedOn
                  responses {
                    emotion
                    score
                  }
                }
                notes {
                  createdOn
                  nid
                  hint
                  n
                  intention
                  t
                  tid
                  images
                  i {
                    period1
                    period2
                    duration
                    type
                  }
                }
                trends {
                  weekly {
                    score {
                      period1
                      period2
                      delta
                    }
                    tension {
                      period1
                      period2
                      delta
                    }
                    depression {
                      period1
                      period2
                      delta
                    }
                    anger {
                      period1
                      period2
                      delta
                    }
                    fatigue {
                      period1
                      period2
                      delta
                    }
                    confusion {
                      period1
                      period2
                      delta
                    }
                    vigour {
                      period1
                      period2
                      delta
                    }
                  }
                  monthly {
                    score {
                      period1
                      period2
                      delta
                    }
                    tension {
                      period1
                      period2
                      delta
                    }
                    depression {
                      period1
                      period2
                      delta
                    }
                    anger {
                      period1
                      period2
                      delta
                    }
                    fatigue {
                      period1
                      period2
                      delta
                    }
                    confusion {
                      period1
                      period2
                      delta
                    }
                    vigour {
                      period1
                      period2
                      delta
                    }
                  }
                }
              }
          }
        `,
      });

      return response.data.load;
    },
  };
};
