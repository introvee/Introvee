import { getBadgeCount as getBadgeCountRepository } from '../db/repository';

const devBypassUserId = '00000000-0000-4000-8000-000000000001';

export function getBadgeCount(userId: string) {
  if (userId === devBypassUserId) {
    return Promise.resolve(0);
  }

  return getBadgeCountRepository(userId);
}
