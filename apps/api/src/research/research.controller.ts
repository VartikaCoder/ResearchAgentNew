import { Controller, Post, Body, Sse } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('research')
export class ResearchController {
  constructor(private readonly httpService: HttpService) {}

  private readonly PYTHON_URL = 'https://researchagentnew-3.onrender.com';

  @Post()
  @Sse()
  research(@Body('goal') goal: string): Observable<any> {
    return this.httpService.post(`${this.PYTHON_URL}/research`, { goal }).pipe(
      map((response) => ({
        data: response.data,
      })),
    );
  }
}
