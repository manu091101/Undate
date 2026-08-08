import { getD1, mapUser, mapWaitlist } from '../../lib/d1';
import { AdminBoard, type PendingUser, type WaitlistRow } from './AdminBoard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Curation desk' };

export default async function AdminPage() {
  const db = await getD1();

  const entriesRes = await db
    .prepare(
      `SELECT * FROM waitlist WHERE status IN ('WAITING', 'INVITED') ORDER BY created_at ASC LIMIT 200`,
    )
    .all();
  const pendingRes = await db
    .prepare(
      `SELECT * FROM users WHERE status = 'PENDING_REVIEW' OR status = 'WAITLIST' ORDER BY created_at ASC LIMIT 200`,
    )
    .all();

  const waiting: WaitlistRow[] = (entriesRes.results ?? []).map((raw: Record<string, unknown>) => {
    const e = mapWaitlist(raw)!;
    return {
      id: e.id,
      email: e.email,
      city: e.city,
      region: e.region,
      status: e.status,
      invitedAt: null,
      createdAt: e.createdAt ?? new Date().toISOString(),
      answers: null,
    };
  });

  const pending: PendingUser[] = (pendingRes.results ?? []).map((raw: Record<string, unknown>) => {
    const u = mapUser(raw)!;
    return {
      id: u.id,
      email: u.email,
      createdAt: new Date().toISOString(),
      displayName: u.displayName,
      city: u.city,
      relationshipGoal: u.relationshipGoal,
      attachmentStyle: u.attachment,
      communicationStyle: u.communicationStyle,
      mbtiType: u.mbti,
    };
  });

  return <AdminBoard waiting={waiting} pending={pending} />;
}
