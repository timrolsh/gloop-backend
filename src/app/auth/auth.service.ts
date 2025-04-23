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
import {Contract, JsonRpcProvider, toUtf8Bytes} from "ethers";

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
    // 1. Recreate the SIWE object
    const siweMessage = new SiweMessage(JSON.parse(message));
    const signerAddress = siweMessage.address;

    // 2. Set up your JSON-RPC provider (ethers v6 style)
    const rpcUrl = this.configService.get<string>("CHAIN_RPC_URL");
    if (!rpcUrl) {
      throw new Error("CHAIN_RPC_URL is not defined");
    }
    const provider = new JsonRpcProvider(rpcUrl);

    // 3. Is this a contract account?
    const code = await provider.getCode(signerAddress);
    const isContract = code !== "0x";

    if (isContract) {
      // 4a. ERC-1271 contract-wallet verification
      const ERC1271_ABI = [
        "function isValidSignature(bytes _msg, bytes _sig) view returns (bytes4)"
      ];
      const ERC1271_MAGIC = "0x1626ba7e";
      const contract = new Contract(signerAddress, ERC1271_ABI, provider);

      // Prepare exactly the same message you asked the user to sign
      const msgBytes = toUtf8Bytes(siweMessage.prepareMessage());
      const result = await contract.isValidSignature(msgBytes, signature);

      if (result !== ERC1271_MAGIC) {
        throwCustomHttpException("Invalid signature", "Invalid signature", HttpStatus.FORBIDDEN);
      }
    } else {
      // 4b. Standard EOA SIWE verification
      try {
        await siweMessage.verify({signature, nonce: siweMessage.nonce});
      } catch {
        throwCustomHttpException("Invalid signature", "Invalid signature", HttpStatus.FORBIDDEN);
      }
    }

    // 5. All checks passed
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
