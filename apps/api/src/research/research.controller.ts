import { Controller, Get, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';

@Controller('research')
export class ResearchController {
  private readonly PYTHON_AGENT_URL = 'https://researchagentnew-3.onrender.com';

  @Get()
  @Sse()
  async research(@Query('goal') goal: string): Promise<Observable<any>> {
    if (!goal) {
      return new Observable((observer) => {
        observer.next({ data: 'Error: Goal is required' });
        observer.complete();
      });
    }

    return new Observable((observer) => {
      fetch(`${this.PYTHON_AGENT_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Agent error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body from Python agent');
          }
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            observer.next({ data: chunk });
          }
          observer.complete();
        })
        .catch((error) => {
          observer.next({ data: `Error: ${error.message}` });
          observer.complete();
        });
    });
  }
}
