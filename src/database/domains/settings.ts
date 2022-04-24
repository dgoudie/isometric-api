import Settings from '../models/settings';

export function getSettings(userId: string) {
  return Settings.findOne({ userId });
}
