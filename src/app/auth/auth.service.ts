import {ConfigService} from "@nestjs/config";
import {ResultDto} from "src/common/dto/result.dto";
import {HttpStatus, Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {WalletService} from "../wallet/wallet.service";
import {throwCustomHttpException} from "src/common/utils/exception.util";
import {CreateWalletDto} from "../wallet/dto/create-wallet.dto";
import {AuthResponseDto} from "./dto/auth-response.dto";
import {generateNonce, SiweMessage} from "siwe";
import {GreetingResponseDto} from "./dto/greeting.dto";
import {UserLoginDto} from "./dto/user-login.dto";
import {Wallet} from "../wallet/entities/wallet.entity";
import {Contract, JsonRpcProvider, hashMessage} from "ethers";

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
    const encodedPublicKey = await this.verifySignature(
      userLoginDto.siweMessage,
      userLoginDto.encodedSignature
    );
    return this.getUserTokens(encodedPublicKey);
  }

  async verifySignature(message: string, signature: string): Promise<string> {
    const siweMessage = new SiweMessage(JSON.parse(message));
    const signerAddress = siweMessage.address;

    // get your URL from env
    const rpcUrl = this.configService.get<string>("MAINNET_RPC_URL");
    const provider = new JsonRpcProvider(rpcUrl);

    // EOA vs contract check
    const code = await provider.getCode(signerAddress);
    const isContract = code !== "0x";

    if (isContract) {
      // 1) Hash the SIWE message per EIP-191
      const msgHash = hashMessage(siweMessage.prepareMessage());

      // 2) Use the bytes32 overload
      const ERC1271_ABI = [
        "function isValidSignature(bytes32 _hash, bytes memory _signature) view returns (bytes4)"
      ];
      const EIP1271_MAGIC = "0x1626ba7e";
      const safe = new Contract(signerAddress, ERC1271_ABI, provider);

      let result: string;
      try {
        result = await safe.isValidSignature(msgHash, signature);
      } catch (e: any) {
        // If you still see GS025 (“Hash not approved”) or GS026 here,
        // it means the Safe tx to approveHash never executed.
        throwCustomHttpException(
          "Safe signature not approved on-chain",
          e.reason || e.message,
          HttpStatus.FORBIDDEN
        );
      }

      if (result !== EIP1271_MAGIC) {
        throwCustomHttpException(
          "Invalid Safe signature",
          "EIP-1271 check failed",
          HttpStatus.FORBIDDEN
        );
      }
    } else {
      // Standard EOA SIWE
      try {
        await siweMessage.verify({
          signature,
          nonce: siweMessage.nonce
        });
      } catch {
        throwCustomHttpException(
          "Invalid signature",
          "SIWE ecrecover check failed",
          HttpStatus.FORBIDDEN
        );
      }
    }

    return signerAddress;
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
    const payload = {username: wallet.address, sub: wallet.id};
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get("jwt.refreshTokenTime")
    });

    return new ResultDto(new AuthResponseDto(accessToken, refreshToken));
  }

  async refreshTokenUser(refreshToken: string): Promise<ResultDto<AuthResponseDto>> {
    const wallet = await this.verifyRefreshToken(refreshToken);
    if (!wallet) {
      throwCustomHttpException(
        "INVALID_REFRESH_TOKEN",
        "INVALID_REFRESH_TOKEN",
        HttpStatus.UNAUTHORIZED
      );
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
