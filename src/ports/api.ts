import {
  AppData,
  FeedbackModel,
  HealthRecordModel,
  NoteModel,
  SettingsModel,
  TrackModel,
  UserModel,
} from "../domain/models";

export interface DataApi {
  addTrack: (
    track: Pick<TrackModel, "trackId" | "responses">
  ) => Promise<Pick<TrackModel, "trackId">>;
  addOrUpdateNote: (
    note: Partial<Omit<NoteModel, "u" | "on">>
  ) => Promise<Pick<NoteModel, "nid">>;
  addFeedback: (
    feedback: Omit<FeedbackModel, "u" | "on">
  ) => Promise<Pick<FeedbackModel, "u" | "on">>;
  addHealthRecords: (
    record: Omit<HealthRecordModel, "u">
  ) => Promise<Pick<HealthRecordModel, "u" | "id">>;
  addOrUpdateSettings: (
    settings: Partial<Omit<SettingsModel, "u" | "on">>
  ) => Promise<Pick<SettingsModel, "u">>;
  addOrUpdateUser: (
    user: Partial<Omit<UserModel, "id" | "updatedAt">>
  ) => Promise<Pick<UserModel, "id">>;
  load: () => Promise<AppData>;
}
