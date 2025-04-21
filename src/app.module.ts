import {WatcherModule} from "./app/watcher/watcher.module";
import {ClassSerializerInterceptor, Module, ValidationPipe} from "@nestjs/common";
import {AppConfigModule} from "./configuration/app.config.module";
import {DatabaseModule} from "./database/database.module";
import {WalletModule} from "./app/wallet/wallet.module";
import {TransactionModule} from "./app/transaction/transaction.module";
import {AuthModule} from "./app/auth/auth.module";
import {JwtService} from "@nestjs/jwt";
import {APP_GUARD, APP_PIPE, APP_INTERCEPTOR} from "@nestjs/core";
import {AuthGuard} from "./app/auth/guard/auth.guard";
import {VALIDATION_PIPE_OPTIONS} from "./common/querying/util/common.constants";
import {LiquidationModule} from "./app/liquidation/liquidation.module";
import {BlockCheckerModule} from "./app/block-checker/block-checker.module";
import {WatcherReferralModule} from "./app/watcher-referral/watcher-referral.module";
import {UpdateLeaderboardModule} from "./app/update-leaderboard/update-leaderboard.module";
import {AppController} from "./app.controller";
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    WatcherModule,
    LiquidationModule,
    BlockCheckerModule,
    WatcherReferralModule,
    UpdateLeaderboardModule
  ],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe(VALIDATION_PIPE_OPTIONS)
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor
    }
  ],
  controllers: [AppController]
})
export class AppModule {}
