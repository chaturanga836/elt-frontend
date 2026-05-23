import { redirect } from 'next/navigation';

/** Pipeline list is at /pipe; this route preserves /pipe/list links. */
export default function PipeListRedirectPage() {
  redirect('/pipe');
}
