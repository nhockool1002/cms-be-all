import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageStatus } from '@prisma/client';

export class CreatePageDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  bodyMarkdown!: string;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;
}
