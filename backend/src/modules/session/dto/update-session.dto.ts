import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSessionDto {
  @ApiProperty({ required: false, description: 'Mood at end of session (1-10)', example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodEnd?: number;

  @ApiProperty({ required: false, description: 'Calculated tilt score', example: 6.5 })
  @IsOptional()
  @IsNumber()
  tiltScore?: number;
}
