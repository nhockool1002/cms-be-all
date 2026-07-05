import { IsString, MaxLength } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @MaxLength(50)
  name!: string;
}
