import { Controller, Post, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';

@Controller('research')
export class ResearchController {
  private readonly PYTHON_AGENT_URL = 'https://researchagentnew-3.onrender.com';

  @Post()
  @Sse()
  async research(@Body('goal') goal: string): Promise<Observable<MessageEvent>> {
    return new Observable((observer) => {
      fetch(`${this.PYTHON_AGENT_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
        .then(async (response) => {
          const reader = response.body?.getReader();
          if (!reader) {
            observer.error(new Error('No response body from Python agent'));
            return;
          }
          const decoder = new TextDecoder();

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            observer.next({ data: chunk } as MessageEvent);
          }
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
