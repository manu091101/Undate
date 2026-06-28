'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@lumin/ui';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={logout}>
      Sign out
    </Button>
  );
}
