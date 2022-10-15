export type WriteRequest = {
  table:
    | "feedback"
    | "note"
    | "track"
    | "user"
    | "settings"
    | "userMigration"
    | "health";
  operation: "put" | "update";
  key?: any;
  Body?: any;
};

export interface UserModel {
  id: string;
  phoneNumber?: string;
  createdAt?: number;
  updatedAt?: number;
  namePrefix?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  nameSuffix?: string;
  nickname?: string;
  email?: string;
}

export type TrackResponse = {
  emotion: string;
  score: number;
};

export interface TrackModel {
  userId: string;
  trackedOn: number;
  trackId: string;
  responses: TrackResponse[];
}

export type AugmentedTrack = TrackModel & {
  score: number;
  type: "Detailed" | "Simple";
};

export interface LoggerModel {
  u: string;
  on: number;
  [key: string]: any;
}

export interface Insight {
  period1: number;
  period2: number;
  duration: "weekly" | "monthly" | "yearly";
  type: keyof MoodTrend;
}
export interface NoteModel {
  u: string;
  on: number;
  createdOn: number;
  nid: string;
  hint: string;
  intention?: boolean;
  n: string;
  html?: string;
  t: string; // title
  tid?: string;
  images?: string[];
  i?: Insight;
}

export interface MachineModel {
  name: string;
  idAndStep: string;
  [key: string]: any;
}

export interface HealthRecordModel {
  u: string;
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  sourceId: string;
  sourceName: string;
  metadata?: any;
  value: number;
}

export interface UserMigrationModel {
  u: string;
  sub: string;
  migrated?: boolean;
}

export interface FeedbackModel {
  u: string;
  on: number;
  createdOn: number;
  f: "c" | "s"; // from customer or sensive
  t: "c" | "s"; // to customer or sensive
  c: string; // comment
}

export type AugmentedNote = NoteModel & {
  score?: number;
  timestampMoment: string;
};

export interface SettingsModel {
  u: string;
  on?: number;
  disableSounds?: boolean;
  autoJournalDisabled?: boolean;
  hints?: boolean;
  remind?: boolean;
  remindTime?: string;
  rndm?: boolean;
  rndm_min?: number;
  rndm_max?: number;
  reviewRequestedAt?: number;
  num_e?: number;
  v?: string; // app version
  pnKey?: string; // push notification key
  tz?: string;
}

type Trend = {
  period1: number;
  period2: number;
  delta: number;
};
export type MoodTrend = {
  score: Trend;
  tension: Trend;
  depression: Trend;
  anger: Trend;
  fatigue: Trend;
  confusion: Trend;
  vigour: Trend;
};

type MovingAverage = {
  score: number | null;
  tension: number | null;
  depression: number | null;
  anger: number | null;
  fatigue: number | null;
  confusion: number | null;
  vigour: number | null;
  score_ma7: number | null;
  score_ma30: number | null;
  anger_ma7: number | null;
  anger_ma30: number | null;
  tension_ma7: number | null;
  tension_ma30: number | null;
  depression_ma7: number | null;
  depression_ma30: number | null;
  confusion_ma7: number | null;
  confusion_ma30: number | null;
  vigour_ma7: number | null;
  vigour_ma30: number | null;
  fatigue_ma7: number | null;
  fatigue_ma30: number | null;
};
export interface AppData {
  user?: UserModel;
  feedback?: FeedbackModel[];
  settings?: Omit<SettingsModel, "u" | "on">;
  tracks?: TrackModel[];
  notes?: NoteModel[];
  movingAverages?: MovingAverage[];
  trends?: {
    weekly?: MoodTrend;
    monthly?: MoodTrend;
  };
}

export type AppleAuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
};
