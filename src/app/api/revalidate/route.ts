import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

interface SanityWebhookPayload {
  _type?: string;
  _id?: string;
  slug?:
    | {
        current?: string;
      }
    | string;
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret) {
      console.error(
        '[Sanity Revalidate] SANITY_REVALIDATE_SECRET is missing in environment.'
      );
      return NextResponse.json(
        {
          success: false,
          message:
            'Server configuration error: missing SANITY_REVALIDATE_SECRET',
        },
        { status: 500 }
      );
    }

    const { isValidSignature, body } = await parseBody<SanityWebhookPayload>(
      req,
      secret,
      false
    );

    if (!isValidSignature) {
      console.warn('[Sanity Revalidate] Unauthorized request: Invalid signature.');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!body?._type) {
      console.warn('[Sanity Revalidate] Invalid payload: Missing _type field.');
      return NextResponse.json(
        { success: false, message: 'Bad request: Missing _type in payload body' },
        { status: 400 }
      );
    }

    const docType = body._type;
    console.info(
      `[Sanity Revalidate] Processing webhook revalidation for _type: "${docType}"`
    );

    // Invalidate tagged cache entries across the application
    try {
      revalidateTag(`sanity:${docType}`, 'max');
      revalidateTag('sanity', 'max');
    } catch (tagError) {
      console.warn(
        `[Sanity Revalidate] revalidateTag notice for ${docType}:`,
        tagError
      );
    }

    // Invalidate route paths according to schema type
    // Invalidate the entire layout tree so shared header/sidebar and page caches refresh
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');

    if (docType === 'project') {
      revalidatePath('/projects', 'page');
      const slugVal =
        typeof body.slug === 'string' ? body.slug : body.slug?.current;
      if (slugVal) {
        revalidatePath(`/projects/${slugVal}`, 'page');
      }
    }

    if (docType === 'blog') {
      revalidatePath('/blog', 'page');
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      now: Date.now(),
      type: docType,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error(
      '[Sanity Revalidate] Error handling revalidation webhook:',
      error
    );
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message:
      'Sanity Revalidate Webhook endpoint is active. Dispatch POST requests with valid HMAC signature.',
    timestamp: new Date().toISOString(),
  });
}
