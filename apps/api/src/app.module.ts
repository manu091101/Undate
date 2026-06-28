import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'node:path';
import { validateEnv } from './config/env';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 120 },
      { name: 'long', ttl: 3_600_000, limit: 3_000 },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Generated to /tmp so the container FS can stay read-only in prod.
      autoSchemaFile: join(process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd(), 'schema.gql'),
      // Hard rule: introspection + playground require an EXPLICIT opt-in via env.
      // NODE_ENV alone is too weak — a single misconfigured deploy leaks the schema.
      playground: process.env.GRAPHQL_INTROSPECTION_ENABLED === 'true',
      introspection: process.env.GRAPHQL_INTROSPECTION_ENABLED === 'true',
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    AuthModule,
    UsersModule,
    ProfilesModule,
    OnboardingModule,
    MatchesModule,
    ConversationsModule,
    SubscriptionsModule,
    ModerationModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [
    // Bind ThrottlerGuard globally so the @nestjs/throttler buckets actually
    // enforce. Without this APP_GUARD wiring the ThrottlerModule config is
    // ornamental. Individual endpoints can layer @Throttle() overrides.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
