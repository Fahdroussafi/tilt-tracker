import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456',
    description: 'Reset token from the email link',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Password confirmation',
  })
  @IsString()
  passwordConfirm: string;
}
