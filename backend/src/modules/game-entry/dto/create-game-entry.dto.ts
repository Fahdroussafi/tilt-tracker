import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGameEntryDto {
  @ApiProperty({ description: 'Game result (win/loss/draw)', example: 'win' })
  @IsString()
  @IsNotEmpty()
  result: string;

  @ApiProperty({ description: 'Tilt level after this game (1-10)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(10)
  tiltLevel: number;

  @ApiProperty({
    required: false,
    description: 'Tags for this game',
    example: ['ranked', 'soloq'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
