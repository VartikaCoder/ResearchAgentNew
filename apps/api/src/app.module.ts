import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResearchModule } from './research/research.module';

@Module({
  imports: [HttpModule, ResearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
