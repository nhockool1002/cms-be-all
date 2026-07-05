import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDiscussionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  body!: string;
}
