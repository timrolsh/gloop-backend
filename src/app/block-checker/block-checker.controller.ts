import { Controller, Get } from "@nestjs/common";
import { BlockCheckerService } from "./block-checker.service";
import { Public } from "src/common/Auth/public-action.decorator";

@Controller("block-checker")
export class BlockCheckerController {
    constructor(private readonly blockCheckerService: BlockCheckerService) {}

    @Get()
    @Public()
    async checkMissingBlocks() {
        return this.blockCheckerService.checkMissingBlocks();
    }

    @Get("update-health")
    @Public()
    async updateHealthFactor() {
        return this.blockCheckerService.updateHealthFactor();
    }

    @Get("update-usdc-debt")
    @Public()
    async updateUsdcDebt() {
        return this.blockCheckerService.updateUsdcDebtByTransaction();
    }
}
