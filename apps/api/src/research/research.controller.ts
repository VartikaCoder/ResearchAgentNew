import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';

@Controller()
export class ResearchController {
  private readonly PYTHON_AGENT_URL = 'https://researchagentnew-3.onrender.com';

  @Get('health')
  health() {
    return { status: 'ok', service: 'nestjs-api' };
  }

  @Post('research')
  @HttpCode(200)
  async research(@Body('goal') goal: string) {
    if (!goal?.trim()) {
      return { error: 'Goal is required' };
    }

    try {
      // Live LangGraph research can take a while (plan + search + summarize).
      const response = await fetch(`${this.PYTHON_AGENT_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
        signal: AbortSignal.timeout(180_000),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const payload = isJson
        ? ((await response.json()) as Record<string, unknown>)
        : { detail: await response.text() };

      if (!response.ok) {
        const detail = payload.detail ?? payload;
        return {
          error:
            response.status === 502
              ? 'Python agent is down (502). Check Render logs for researchagentnew-3 and wake https://researchagentnew-3.onrender.com/health'
              : 'Failed to call agent',
          status: response.status,
          detail,
          goal,
        };
      }

      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const timedOut = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted');
      return {
        error: timedOut
          ? 'Python agent timed out (research took too long)'
          : 'Failed to reach Python agent',
        message,
        goal,
      };
    }
  }
}
