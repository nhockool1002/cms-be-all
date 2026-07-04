import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './forum/boards/boards.module';
import { ThreadsModule } from './forum/threads/threads.module';
import { PostsModule } from './forum/posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    ThreadsModule,
    PostsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
