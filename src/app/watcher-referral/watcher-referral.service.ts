import {Injectable, Logger} from "@nestjs/common";
import {ABI_REFERRAL} from "./data/abi-referral";
import {ethers} from "ethers";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class WatcherReferralService {
  private logger = new Logger(WatcherReferralService.name);
  private provider!: ethers.WebSocketProvider;
  private contract!: ethers.Contract;

  private ABI: Object[] = ABI_REFERRAL;

  constructor(private readonly configService: ConfigService) {}

  private initializeProviderAndContract() {
    this.provider = new ethers.WebSocketProvider(this.configService.get("crypto.rpcSocket"));
    this.contract = new ethers.Contract(
      this.configService.get("crypto.gmPointContactAddress"),
      this.ABI,
      this.provider
    );

    this.provider.on("error", (error) => this.handleProviderError(error));
  }

  private handleProviderError(error: any) {
    this.logger.error("WebSocket error:", error);
    this.reconnectProvider();
  }

  private async reconnectProvider(retries = 3, delay = 1000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      this.logger.log(`Reconnecting to WebSocket provider... (Attempt ${attempt} of ${retries})`);
      try {
        this.initializeProviderAndContract();
        this.checkNetworkConnection();
        this.logger.log("Reconnected successfully.");
        return;
      } catch (error) {
        this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          this.logger.error("All reconnection attempts failed.");
          throw new Error("Unable to reconnect to WebSocket provider.");
        }
      }
    }
  }

  private async checkNetworkConnection() {
    try {
      const network = await this.provider.getNetwork();
      this.logger.log(
        `Connected to network (${this.configService.get("crypto.network")}): ${network.name} (${network.chainId})`
      );
      // this.watchOnline();
    } catch (error) {
      this.logger.error("Failed to connect to network:", error);
    }
  }

  // private watchOnline() {
  //     try {
  //         this.contract.on("ReferrerAdded", (msg, _referrer) => {
  //             this.walletService.setReferralCode(msg, _referrer).catch((error) => {
  //                 this.logger.error("Error on set referral code:", error);
  //             });
  //         });
  //         this.logger.log("Started watching for referrer added...");
  //     } catch (error) {
  //         this.logger.error("Error watching for referrer added:", error);
  //     }
  // }

  async getReferrerCount(walletAddress: string): Promise<number> {
    this.initializeProviderAndContract();
    const referrer = await this.contract.getUserReferrals(walletAddress);
    return referrer.length ?? 0;
  }
}
