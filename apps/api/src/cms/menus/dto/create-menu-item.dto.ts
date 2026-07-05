import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsString()
  @MaxLength(255)
  url!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
