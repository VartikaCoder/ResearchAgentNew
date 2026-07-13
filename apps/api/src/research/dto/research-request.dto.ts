import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResearchRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  goal!: string;
}
