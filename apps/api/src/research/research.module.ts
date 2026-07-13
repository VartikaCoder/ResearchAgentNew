import { Module } from '@nestjs/common';
import { AgentClientService } from './agent/agent-client.service';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';

@Module({
  controllers: [ResearchController],
  providers: [ResearchService, AgentClientService],
})
export class ResearchModule {}
