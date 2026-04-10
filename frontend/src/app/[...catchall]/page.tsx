import { notFound } from 'next/navigation';

export default function CatchAll() {
  // This will trigger the nearest not-found.tsx
  notFound();
}
