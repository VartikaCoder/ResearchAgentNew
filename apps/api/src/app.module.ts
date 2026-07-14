import { Module } from '@nestjs/common';
import { ResearchController } from './research/research.controller';

@Module({
  controllers: [ResearchController],
})
export class AppModule {}
