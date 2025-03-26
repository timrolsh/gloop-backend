import { ConfigService } from "@nestjs/config";
import { ResultDto } from "src/common/dto/result.dto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WalletService } from "../wallet/wallet.service";
import { throwCustomHttpException } from "src/common/utils/exception.util";
import { CreateWalletDto } from "../wallet/dto/create-wallet.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { generateNonce, SiweMessage } from "siwe";
import { GreetingResponseDto } from "./dto/greeting.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import { Wallet } from "../wallet/entities/wallet.entity";
@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly walletService: WalletService,
        private readonly jwtService: JwtService
    ) {}

    async greetingMessage(): Promise<ResultDto<GreetingResponseDto>> {
        const message = this.configService.get("auth.greeting");
        const nonce = generateNonce();

        return new ResultDto(new GreetingResponseDto(message, nonce));
    }

    async loginUser(userLoginDto: UserLoginDto) {
        const encodedPublicKey = await this.verifySignature(userLoginDto.siweMessage, userLoginDto.encodedSignature);
        return this.getUserTokens(encodedPublicKey);
    }

    async verifySignature(message: string, signature: string): Promise<string> {
        const siweMessage = new SiweMessage(JSON.parse(message));

        try {
            await siweMessage.verify({
                signature: signature,
                nonce: siweMessage.nonce,
            });

            return siweMessage.address;
        } catch (e) {
            throwCustomHttpException("Invalid signature", "Invalid signature", HttpStatus.FORBIDDEN);
        }
    }

    async getUserTokens(walletAddress: string): Promise<ResultDto<AuthResponseDto>> {
        const wallet = await this.validateUser(walletAddress);
        return this.tokenForPayload(wallet);
    }

    async validateUser(walletAddress: string): Promise<Wallet> {
        let wallet = await this.walletService.findByAddress(walletAddress);

        if (!wallet) {
            wallet = await this.walletService.create(new CreateWalletDto(walletAddress));
        }

        return wallet;
    }

    async tokenForPayload(wallet: Wallet): Promise<ResultDto<AuthResponseDto>> {
        const payload = { username: wallet.address, sub: wallet.id };
        const accessToken = await this.jwtService.signAsync(payload);

        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: this.configService.get("jwt.refreshTokenTime"),
        });

        return new ResultDto(new AuthResponseDto(accessToken, refreshToken));
    }

    async refreshTokenUser(refreshToken: string): Promise<ResultDto<AuthResponseDto>> {
        const wallet = await this.verifyRefreshToken(refreshToken);
        if (!wallet) {
            throwCustomHttpException("INVALID_REFRESH_TOKEN", "INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED);
        }

        return this.tokenForPayload(wallet);
    }

    private async verifyRefreshToken(refreshToken: string): Promise<Wallet> {
        try {
            const decoded = this.jwtService.verify(refreshToken);
            return await this.walletService.findOne(decoded.sub);
        } catch (error) {
            return null;
        }
    }
}
