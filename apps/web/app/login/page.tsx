import { redirect } from 'next/navigation';

/**
 * Public sign-in is retired — Undate is pitch + waitlist only.
 * Keep the route so old links don't 404; send them to the waitlist.
 */
export default function LoginPage() {
  redirect('/waitlist');
}
