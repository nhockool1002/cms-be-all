import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BoardsModule } from './forum/boards/boards.module';
import { ThreadsModule } from './forum/threads/threads.module';
import { PostsModule } from './forum/posts/posts.module';
import { PmModule } from './social/pm/pm.module';
import { GroupsModule } from './social/groups/groups.module';
import { ProfileCommentsModule } from './social/profile-comments/profile-comments.module';
import { FollowsModule } from './social/follows/follows.module';
import { PagesModule } from './cms/pages/pages.module';
import { WidgetsModule } from './cms/widgets/widgets.module';
import { MenusModule } from './cms/menus/menus.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    ThreadsModule,
    PostsModule,
    PmModule,
    GroupsModule,
    ProfileCommentsModule,
    FollowsModule,
    PagesModule,
    WidgetsModule,
    MenusModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
