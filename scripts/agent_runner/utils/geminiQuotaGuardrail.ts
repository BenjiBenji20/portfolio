/**
 * Gemini Quota Guardrail & Sliding-Window Request Throttler
 * 
 * Enforces a strict sliding-window rate ceiling to prevent hitting Google AI Studio's
 * Free Tier 5 Requests Per Minute (5 RPM) limit, and handles HTTP 429 RetryInfo dynamically.
 */

export class GeminiQuotaGuardrail {
  private readonly maxRequestsPerWindow: number;
  private readonly windowMs: number;
  private readonly requestTimestamps: number[] = [];

  constructor(maxRequestsPerWindow = 4, windowSeconds = 60) {
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Cleans timestamps older than the sliding window
   */
  private pruneOldTimestamps(now: number): void {
    while (this.requestTimestamps.length > 0 && now - this.requestTimestamps[0] >= this.windowMs) {
      this.requestTimestamps.shift();
    }
  }

  /**
   * Proactively pauses execution if the request window is saturated,
   * guaranteeing the 5 RPM ceiling is never breached.
   */
  async waitForAvailableSlot(taskName = 'GeminiPrompt'): Promise<void> {
    const now = Date.now();
    this.pruneOldTimestamps(now);

    if (this.requestTimestamps.length >= this.maxRequestsPerWindow) {
      // Calculate how long until the oldest request exits the 60s window
      const oldestTimestamp = this.requestTimestamps[0];
      const waitMs = this.windowMs - (now - oldestTimestamp) + 1000; // +1s safety buffer

      console.warn(
        `[GeminiQuotaGuardrail] [${taskName}] Sliding window saturated (${this.requestTimestamps.length}/${this.maxRequestsPerWindow} requests in past 60s).`
      );
      console.warn(
        `[GeminiQuotaGuardrail] Throttling for ${(waitMs / 1000).toFixed(1)}s to respect Google AI Studio 5 RPM ceiling...`
      );

      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.pruneOldTimestamps(Date.now());
    }

    // Record timestamp of this approved request slot
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Parses Google AI Studio's 429 RetryInfo (e.g. "retryDelay": "53s" or retry-after)
   * and pauses for the exact duration required by Google's quota engine.
   */
  async handleRateLimitResponse(rawErrorText: string, defaultBackoffSeconds = 60): Promise<void> {
    let delayMs = defaultBackoffSeconds * 1000;

    try {
      const match = rawErrorText.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/i);
      if (match && match[1]) {
        const parsedSeconds = Math.ceil(parseFloat(match[1]));
        delayMs = (parsedSeconds + 2) * 1000; // +2s safety buffer
      } else {
        const textMatch = rawErrorText.match(/retry in (\d+(?:\.\d+)?)s/i);
        if (textMatch && textMatch[1]) {
          const parsedSeconds = Math.ceil(parseFloat(textMatch[1]));
          delayMs = (parsedSeconds + 2) * 1000;
        }
      }
    } catch {
      // Fallback to default
    }

    console.warn(
      `[GeminiQuotaGuardrail] HTTP 429 encountered. Google requested backoff of ${(delayMs / 1000).toFixed(1)}s. Pausing...`
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Reset window timestamps after full quota sleep
    this.requestTimestamps.length = 0;
  }

  /**
   * Rolls back the most recent request timestamp if the request failed
   * due to a server-side 503 high-demand error or network reset,
   * so transient server failures do not unnecessarily saturate the client rate limit.
   */
  rollbackSlot(): void {
    if (this.requestTimestamps.length > 0) {
      this.requestTimestamps.pop();
    }
  }
}

// Global Singleton Instance
export const geminiQuotaGuardrail = new GeminiQuotaGuardrail(4, 60);

