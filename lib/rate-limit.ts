import { headers } from 'next/headers';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let callsSinceCleanup = 0;
const CLEANUP_EVERY_CALLS = 100;

const sweepExpired = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const checkRateLimit = (key: string, max: number, windowMs: number): boolean => {
  const now = Date.now();

  callsSinceCleanup += 1;
  if (callsSinceCleanup >= CLEANUP_EVERY_CALLS) {
    callsSinceCleanup = 0;
    sweepExpired(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
};

export const getClientIp = async (): Promise<string> => {
  const h = await headers();
  const forwardedFor = h.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = h.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
};
