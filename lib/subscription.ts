import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const usageMap = new Map<string, number>();

/**
 * Simple freemium check allowing two free requests per user.
 * Users can send a header "x-subscription" with value "monthly" or "yearly"
 * to bypass the limit.
 */
export function checkFreemium(req: NextApiRequest, res: NextApiResponse): boolean {
  const id = (req.headers['x-user'] as string) || req.socket.remoteAddress || 'anonymous';
  const count = usageMap.get(id) ?? 0;
  const subscription = req.headers['x-subscription'] as string | undefined;

  if (subscription === 'monthly' || subscription === 'yearly') {
    return true; // paid user, unlimited access
  }

  if (count >= 2) {
    res.status(402).json({
      error: 'Freemium limit reached. Subscribe for unlimited scans: $5/month or $45/year.'
    });
    return false;
  }

  usageMap.set(id, count + 1);
  return true;
}

export function checkFreemiumApp(req: Request): NextResponse | null {
  const id =
    req.headers.get('x-user') ||
    req.headers.get('x-forwarded-for') ||
    'anonymous';
  const subscription = req.headers.get('x-subscription');
  const count = usageMap.get(id) ?? 0;

  if (subscription === 'monthly' || subscription === 'yearly') {
    return null;
  }

  if (count >= 2) {
    return NextResponse.json(
      {
        error:
          'Freemium limit reached. Subscribe for unlimited scans: $5/month or $45/year.'
      },
      { status: 402 }
    );
  }

  usageMap.set(id, count + 1);
  return null;
}