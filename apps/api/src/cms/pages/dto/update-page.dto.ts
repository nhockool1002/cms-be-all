import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageStatus } from '@prisma/client';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  bodyMarkdown?: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}
