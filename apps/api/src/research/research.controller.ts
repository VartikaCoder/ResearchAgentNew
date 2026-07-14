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
      const response = await fetch(`${this.PYTHON_AGENT_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        const detail = await response.text();
        return {
          error: 'Failed to call agent',
          status: response.status,
          detail,
          goal,
        };
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }

      const text = await response.text();
      return { goal, agentResponse: text };
    } catch (error) {
      return {
        error: 'Failed to call agent',
        message: error instanceof Error ? error.message : 'Unknown error',
        goal,
      };
    }
  }
}
