import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
