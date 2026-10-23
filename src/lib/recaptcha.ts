export interface RecaptchaVerifyResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  errorCodes?: string[];
  error?: string;
}

/**
 * Validates a Google reCAPTCHA v3 token against Google's siteverify endpoint.
 *
 * @param token - The token received from the client-side grecaptcha.execute call.
 * @param expectedAction - The semantic action name (e.g. 'contact_submit').
 * @param minScore - Minimum acceptable human score threshold (default: 0.5).
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string = 'contact_submit',
  minScore: number = 0.5
): Promise<RecaptchaVerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('[reCAPTCHA] RECAPTCHA_SECRET_KEY is not defined in environment variables.');
    return {
      success: false,
      error: 'reCAPTCHA secret key configuration missing.',
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'Missing reCAPTCHA token.',
    };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error(`[reCAPTCHA] Google siteverify returned HTTP status ${response.status}`);
      return {
        success: false,
        error: `Verification service returned status ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        errorCodes: data['error-codes'],
        error: 'Google reCAPTCHA verification failed.',
      };
    }

    // Action validation
    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(`[reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${data.action}"`);
      return {
        success: false,
        score: data.score,
        action: data.action,
        error: 'reCAPTCHA action mismatch.',
      };
    }

    // Score validation
    const score = typeof data.score === 'number' ? data.score : 0;
    if (score < minScore) {
      console.warn(`[reCAPTCHA] Low confidence score detected: ${score} (minimum required: ${minScore})`);
      return {
        success: false,
        score,
        action: data.action,
        error: 'Confidence score below human threshold.',
      };
    }

    return {
      success: true,
      score,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (err) {
    console.error('[reCAPTCHA] Verification exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown reCAPTCHA verification error.',
    };
  }
}
