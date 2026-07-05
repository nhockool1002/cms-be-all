import { IsString, MinLength } from 'class-validator';

export class CreateProfileCommentDto {
  @IsString()
  @MinLength(1)
  body!: string;
}
