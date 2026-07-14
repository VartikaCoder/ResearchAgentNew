import { Module } from '@nestjs/common';
import { ResearchController } from './research/research.controller';

@Module({
  imports: [],
  controllers: [ResearchController],
  providers: [],
})
export class AppModule {}
