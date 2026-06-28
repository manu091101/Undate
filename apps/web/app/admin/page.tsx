import { prisma } from '@lumin/db';
import { AdminBoard, type PendingUser, type WaitlistRow } from './AdminBoard';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Curation desk' };

export default async function AdminPage() {
  const [entries, pendingUsers] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where: { status: { in: ['WAITING', 'INVITED'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        city: true,
        region: true,
        status: true,
        answers: true,
        invitedAt: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: { select: { displayName: true, city: true, relationshipGoal: true } },
        personality: { select: { attachmentStyle: true, communicationStyle: true, mbtiType: true } },
      },
    }),
  ]);

  const waiting: WaitlistRow[] = entries.map((e) => ({
    id: e.id,
    email: e.email,
    city: e.city,
    region: e.region,
    status: e.status,
    invitedAt: e.invitedAt ? e.invitedAt.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    answers: (e.answers as WaitlistRow['answers']) ?? null,
  }));

  const pending: PendingUser[] = pendingUsers.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    displayName: u.profile?.displayName ?? null,
    city: u.profile?.city ?? null,
    relationshipGoal: u.profile?.relationshipGoal ?? null,
    attachmentStyle: u.personality?.attachmentStyle ?? null,
    communicationStyle: u.personality?.communicationStyle ?? null,
    mbtiType: u.personality?.mbtiType ?? null,
  }));

  return <AdminBoard waiting={waiting} pending={pending} />;
}
