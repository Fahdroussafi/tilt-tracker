import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'Mood at the start of session (1-10)', example: 7 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  moodStart: number;
}
