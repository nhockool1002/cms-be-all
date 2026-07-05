import { IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWidgetDto {
  @IsString()
  @MaxLength(50)
  type!: string;

  @IsString()
  @MaxLength(50)
  placement!: string;

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
