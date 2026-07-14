import { Controller, Post, Body } from '@nestjs/common';

@Controller('research')
export class ResearchController {
  private readonly PYTHON_AGENT_URL = 'https://researchagentnew-3.onrender.com';

  @Post()
  async research(@Body('goal') goal: string) {
    const response = await fetch(`${this.PYTHON_AGENT_URL}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
    });

    if (!response.ok) {
      return { error: 'Failed to call agent' };
    }

    // For now, just return the final result (we can add streaming later)
    return await response.json();
  }
}
