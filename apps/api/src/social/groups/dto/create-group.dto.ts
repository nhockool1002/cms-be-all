import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum GroupVisibilityDto {
  PUBLIC = 'PUBLIC',
  MODERATED = 'MODERATED',
  INVITE_ONLY = 'INVITE_ONLY',
}

export class CreateGroupDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(GroupVisibilityDto)
  visibility?: GroupVisibilityDto;
}
