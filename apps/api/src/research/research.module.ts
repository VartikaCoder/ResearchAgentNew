import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResearchController } from './research.controller';

@Module({
  imports: [HttpModule],
  controllers: [ResearchController],
})
export class ResearchModule {}
