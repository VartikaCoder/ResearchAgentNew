import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn, type ChildProcess } from 'node:child_process';
import { accessSync, constants as fsConstants } from 'node:fs';
import * as path from 'node:path';
import { Observable } from 'rxjs';
import {
  isResearchAgentEvent,
  type ResearchAgentEvent,
} from '../types/research-events';

@Injectable()
export class AgentClientService {
  private readonly logger = new Logger(AgentClientService.name);

  /**
   * Spawn the Python research agent and emit typed NDJSON events.
   */
  streamResearch(goal: string): Observable<ResearchAgentEvent> {
    return new Observable<ResearchAgentEvent>((subscriber) => {
      let child: ChildProcess;

      try {
        child = this.spawnAgent(goal);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to start research agent';
        subscriber.next({ type: 'error', message });
        subscriber.error(
          new ServiceUnavailableException(message),
        );
        return;
      }

      const stdout = child.stdout;
      const stderr = child.stderr;
      if (!stdout || !stderr) {
        subscriber.next({
          type: 'error',
          message: 'Research agent process is missing stdout/stderr pipes',
        });
        subscriber.complete();
        return;
      }

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let settled = false;

      const fail = (message: string, detail?: string) => {
        if (settled) {
          return;
        }
        settled = true;
        subscriber.next({ type: 'error', message, detail });
        subscriber.complete();
      };

      stdout.setEncoding('utf8');
      stderr.setEncoding('utf8');

      stdout.on('data', (chunk: string) => {
        stdoutBuffer += chunk;
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          try {
            const parsed: unknown = JSON.parse(trimmed);
            if (!isResearchAgentEvent(parsed)) {
              this.logger.warn(`Ignoring unexpected agent payload: ${trimmed}`);
              continue;
            }
            subscriber.next(parsed);
            if (parsed.type === 'error' || parsed.type === 'done') {
              settled = true;
              subscriber.complete();
              if (parsed.type === 'error') {
                child.kill('SIGTERM');
              }
            }
          } catch {
            this.logger.warn(`Non-JSON agent stdout line: ${trimmed}`);
          }
        }
      });

      stderr.on('data', (chunk: string) => {
        stderrBuffer += chunk;
        this.logger.debug(chunk.trimEnd());
      });

      child.on('error', (error) => {
        fail(`Failed to run research agent: ${error.message}`);
      });

      child.on('close', (code, signal) => {
        if (settled) {
          return;
        }

        if (stdoutBuffer.trim()) {
          try {
            const parsed: unknown = JSON.parse(stdoutBuffer.trim());
            if (isResearchAgentEvent(parsed)) {
              subscriber.next(parsed);
              if (parsed.type === 'error' || parsed.type === 'done') {
                settled = true;
                subscriber.complete();
                return;
              }
            }
          } catch {
            // fall through to exit-code handling
          }
        }

        if (code === 0) {
          settled = true;
          subscriber.complete();
          return;
        }

        const detail = stderrBuffer.trim() || undefined;
        fail(
          `Research agent exited with code ${code ?? 'null'}${signal ? ` (signal ${signal})` : ''}`,
          detail,
        );
      });

      return () => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      };
    });
  }

  private spawnAgent(goal: string): ChildProcess {
    const agentRoot = this.resolveAgentRoot();
    const pythonBin = this.resolvePythonBin(agentRoot);
    const scriptPath = path.join(agentRoot, 'stream_main.py');

    this.assertReadable(scriptPath, 'Agent stream entrypoint');
    this.assertExecutable(pythonBin, 'Python interpreter');

    this.logger.log(
      `Spawning agent via ${pythonBin}${process.env.AGENT_MOCK ? ' (AGENT_MOCK)' : ''}`,
    );

    return spawn(pythonBin, ['-u', scriptPath, '--goal', goal], {
      cwd: agentRoot,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        // Prefer explicit AGENT_MOCK from API env; default unset for live runs
        ...(process.env.AGENT_MOCK
          ? { AGENT_MOCK: process.env.AGENT_MOCK }
          : {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  private resolveAgentRoot(): string {
    if (process.env.AGENT_ROOT) {
      return path.resolve(process.env.AGENT_ROOT);
    }

    // Default: apps/api -> apps/agent when the API is started from apps/api
    return path.resolve(process.cwd(), '..', 'agent');
  }

  private resolvePythonBin(agentRoot: string): string {
    if (process.env.AGENT_PYTHON) {
      return process.env.AGENT_PYTHON;
    }

    const venvPython = path.join(
      agentRoot,
      '.venv',
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
    );

    try {
      accessSync(venvPython, fsConstants.X_OK);
      return venvPython;
    } catch {
      return process.platform === 'win32' ? 'python' : 'python3';
    }
  }

  private assertReadable(filePath: string, label: string): void {
    try {
      accessSync(filePath, fsConstants.R_OK);
    } catch {
      throw new Error(`${label} not found or unreadable at ${filePath}`);
    }
  }

  private assertExecutable(filePath: string, label: string): void {
    // PATH binaries (python3) may not be absolute — only check absolute paths
    if (!path.isAbsolute(filePath)) {
      return;
    }
    try {
      accessSync(filePath, fsConstants.X_OK);
    } catch {
      throw new Error(`${label} not found or not executable at ${filePath}`);
    }
  }
}
