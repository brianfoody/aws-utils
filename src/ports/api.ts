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
    track: Pick<TrackModel, "responses">
  ) => Promise<Pick<TrackModel, "trackId">>;
  addNote: (
    note: Omit<NoteModel, "u" | "nid" | "on">
  ) => Promise<Pick<NoteModel, "nid">>;
  addFeedback: (
    note: Omit<FeedbackModel, "u" | "on">
  ) => Promise<Pick<FeedbackModel, "u" | "on">>;
  addHealthRecords: (
    record: Omit<HealthRecordModel, "u">
  ) => Promise<Pick<HealthRecordModel, "u" | "id">>;
  updateSettings: (
    settings: Partial<Omit<SettingsModel, "u" | "on">>
  ) => Promise<Pick<SettingsModel, "u">>;
  updateUser: (
    settings: Omit<UserModel, "id" | "updatedAt">
  ) => Promise<Pick<UserModel, "id">>;
  load: () => Promise<AppData>;
}
