import { redirect } from 'next/navigation';

/**
 * Public member signup is retired — Undate is pitch + waitlist only.
 * Keep the route so old links / invite URLs don't 404; send them to the waitlist.
 */
export default function SignupPage() {
  redirect('/waitlist');
}
