import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpStatus,
  Logger,
  Post,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { finalize } from 'rxjs';
import { ResearchRequestDto } from './dto/research-request.dto';
import { ResearchService } from './research.service';
import type { ResearchAgentEvent } from './types/research-events';

@Controller()
export class ResearchController {
  private readonly logger = new Logger(ResearchController.name);

  constructor(private readonly researchService: ResearchService) {}

  /**
   * POST /research — preferred for longer goals (JSON body).
   */
  @Post('research')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  streamResearchPost(
    @Body() body: ResearchRequestDto,
    @Res() res: Response,
  ): void {
    this.openResearchStream(body.goal, res);
  }

  /**
   * GET /research?goal=... — native EventSource-compatible SSE endpoint.
   */
  @Get('research')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  streamResearchGet(
    @Query('goal') goal: string | undefined,
    @Res() res: Response,
  ): void {
    this.openResearchStream(goal ?? '', res);
  }

  private openResearchStream(rawGoal: string, res: Response): void {
    const goal = rawGoal?.trim();
    if (!goal || goal.length < 3) {
      throw new BadRequestException(
        'goal is required and must be at least 3 characters',
      );
    }
    if (goal.length > 2000) {
      throw new BadRequestException('goal must be at most 2000 characters');
    }

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (event: ResearchAgentEvent | { type: 'done' }) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const subscription = this.researchService
      .streamResearch(goal)
      .pipe(
        finalize(() => {
          if (!res.writableEnded) {
            writeEvent({ type: 'done' });
            res.end();
          }
        }),
      )
      .subscribe({
        next: (event) => {
          writeEvent(event);
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'Unexpected research stream error';
          this.logger.error(message);
          if (!res.writableEnded) {
            writeEvent({ type: 'error', message });
            res.end();
          }
        },
      });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
