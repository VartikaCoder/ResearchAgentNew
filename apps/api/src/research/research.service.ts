import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AgentClientService } from './agent/agent-client.service';
import type { ResearchAgentEvent } from './types/research-events';

@Injectable()
export class ResearchService {
  constructor(private readonly agentClient: AgentClientService) {}

  streamResearch(goal: string): Observable<ResearchAgentEvent> {
    return this.agentClient.streamResearch(goal);
  }
}
