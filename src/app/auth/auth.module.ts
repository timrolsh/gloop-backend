import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { WalletModule } from "../wallet/wallet.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                global: true,
                secret: configService.get<string>("jwt.secret"),
                signOptions: { expiresIn: "2h" },
            }),
            inject: [ConfigService],
        }),
        WalletModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
