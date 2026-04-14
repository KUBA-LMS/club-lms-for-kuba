import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_USERS_KEY = 'blocked_users_v1';
const PENDING_REPORTS_KEY = 'pending_reports_v1';

export interface BlockedUser {
  userId: string;
  username: string;
  blockedAt: number;
}

export type ReportTargetType = 'message' | 'user' | 'event' | 'club';
export type ReportReason =
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'violence'
  | 'spam'
  | 'impersonation'
  | 'illegal'
  | 'other';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string;
  reason: ReportReason;
  note?: string;
  submittedAt: number;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech or discrimination',
  sexual_content: 'Sexual or explicit content',
  violence: 'Violence or threats',
  spam: 'Spam or scam',
  impersonation: 'Impersonation',
  illegal: 'Illegal activity',
  other: 'Other',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op: moderation storage is best-effort
  }
}

export const moderation = {
  async getBlockedUsers(): Promise<BlockedUser[]> {
    return readJson<BlockedUser[]>(BLOCKED_USERS_KEY, []);
  },

  async isBlocked(userId: string): Promise<boolean> {
    const list = await moderation.getBlockedUsers();
    return list.some((u) => u.userId === userId);
  },

  async blockUser(userId: string, username: string): Promise<BlockedUser[]> {
    const list = await moderation.getBlockedUsers();
    if (list.some((u) => u.userId === userId)) return list;
    const updated: BlockedUser[] = [
      { userId, username, blockedAt: Date.now() },
      ...list,
    ];
    await writeJson(BLOCKED_USERS_KEY, updated);
    return updated;
  },

  async unblockUser(userId: string): Promise<BlockedUser[]> {
    const list = await moderation.getBlockedUsers();
    const updated = list.filter((u) => u.userId !== userId);
    await writeJson(BLOCKED_USERS_KEY, updated);
    return updated;
  },

  async submitReport(input: Omit<Report, 'id' | 'submittedAt'>): Promise<Report> {
    const report: Report = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: Date.now(),
      ...input,
    };
    const pending = await readJson<Report[]>(PENDING_REPORTS_KEY, []);
    await writeJson(PENDING_REPORTS_KEY, [report, ...pending].slice(0, 100));
    return report;
  },

  async getPendingReports(): Promise<Report[]> {
    return readJson<Report[]>(PENDING_REPORTS_KEY, []);
  },
};

export default moderation;
