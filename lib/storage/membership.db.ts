import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type {
  MembershipApplication,
  CreateApplicationInput,
  UpdateApplicationInput,
  StatusTimelineEvent,
  AdminMessage,
  ApplicationDocument,
} from "../models/membership";

const KEY = STORAGE_KEYS.MEMBERSHIP_APPLICATIONS;
const now = () => new Date().toISOString();

function pushTimeline(
  current: MembershipApplication | null,
  event: StatusTimelineEvent
): StatusTimelineEvent[] {
  const history = current?.statusHistory ?? [];
  return [...history, event];
}

export const membershipDB = {
  getAll: (): MembershipApplication[] => getAll<MembershipApplication>(KEY),

  getById: (id: string): MembershipApplication | null =>
    getById<MembershipApplication>(KEY, id),

  getByStatus: (status: MembershipApplication["status"]): MembershipApplication[] =>
    getWhere<MembershipApplication>(KEY, (a) => a.status === status),

  getByEmail: (email: string): MembershipApplication | null =>
    getWhere<MembershipApplication>(
      KEY,
      (a) => a.email.toLowerCase() === email.toLowerCase(),
    )[0] ?? null,

  getByUserId: (userId: string): MembershipApplication | null =>
    getWhere<MembershipApplication>(KEY, (a) => a.userId === userId)[0] ?? null,

  create: (input: CreateApplicationInput): MembershipApplication => {
    const app = createRecord<MembershipApplication>(KEY, {
      id: nanoid(),
      status: "pending",
      appliedAt: now(),
      statusHistory: [{ status: "pending", date: now(), message: "Application submitted." }],
      ...input,
    });
    return app;
  },

  update: (id: string, patch: UpdateApplicationInput): MembershipApplication | null =>
    updateRecord<MembershipApplication>(KEY, id, patch),

  setUnderReview: (id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    return updateRecord<MembershipApplication>(KEY, id, {
      status: "under-review",
      reviewedAt: now(),
      reviewedBy,
      reviewNotes: notes,
      statusHistory: pushTimeline(current, {
        status: "under-review",
        date: now(),
        message: notes ?? "Application is now under review.",
      }),
    });
  },

  setInterview: (id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    return updateRecord<MembershipApplication>(KEY, id, {
      status: "interview",
      reviewedAt: now(),
      reviewedBy,
      reviewNotes: notes,
      statusHistory: pushTimeline(current, {
        status: "interview",
        date: now(),
        message: notes ?? "You have been invited for an interview. Check your email for details.",
      }),
    });
  },

  approve: (id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    return updateRecord<MembershipApplication>(KEY, id, {
      status: "approved",
      reviewedAt: now(),
      reviewedBy,
      reviewNotes: notes,
      statusHistory: pushTimeline(current, {
        status: "approved",
        date: now(),
        message: notes ?? "Congratulations! Your membership application has been approved.",
      }),
    });
  },

  reject: (id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    return updateRecord<MembershipApplication>(KEY, id, {
      status: "rejected",
      reviewedAt: now(),
      reviewedBy,
      reviewNotes: notes,
      statusHistory: pushTimeline(current, {
        status: "rejected",
        date: now(),
        message: notes ?? "We regret to inform you that your application was not successful at this time.",
      }),
    });
  },

  addAdminMessage: (id: string, fromName: string, content: string): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    if (!current) return null;
    const message: AdminMessage = {
      id: nanoid(),
      fromName,
      content,
      sentAt: now(),
      isRead: false,
    };
    return updateRecord<MembershipApplication>(KEY, id, {
      adminMessages: [...(current.adminMessages ?? []), message],
    });
  },

  addDocument: (id: string, doc: Omit<ApplicationDocument, "id" | "uploadedAt">): MembershipApplication | null => {
    const current = getById<MembershipApplication>(KEY, id);
    if (!current) return null;
    const newDoc: ApplicationDocument = {
      id: nanoid(),
      uploadedAt: now(),
      ...doc,
    };
    return updateRecord<MembershipApplication>(KEY, id, {
      documents: [...(current.documents ?? []), newDoc],
    });
  },

  delete: (id: string): boolean => deleteRecord<MembershipApplication>(KEY, id),
};
