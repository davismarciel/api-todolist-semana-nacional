import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModule } from '../modules/user/user.module';
import { TaskModule } from '../modules/task/task.module';
import { AuthModule } from '../modules/auth/auth.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: [
        '/api*',
        '/auth*',
        '/task*',
        '/user*',
      ],
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    UserModule,
    TaskModule,
    AuthModule,
  ],
})
export class AppModule {}
