import {Injectable, Logger} from "@nestjs/common";
import {CreateBlockDto} from "./dto/create-block.dto";
import {plainToInstance} from "class-transformer";
import {Block} from "./entities/block.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Between, Repository} from "typeorm";
import {Cron} from "@nestjs/schedule";

@Injectable()
export class BlockService {
  private logger = new Logger(BlockService.name);

  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>
  ) {}

  async createBlocks(blockDtos: CreateBlockDto[]): Promise<void> {
    if (blockDtos.length === 0) return;

    const blocks = blockDtos.map((dto) => {
      const block = new Block(dto.blockNumber, dto.blockHash);
      return block;
    });

    try {
      await this.blockRepository.save(blocks, {chunk: 500});
    } catch (error) {
      throw new Error(`Failed to insert blocks: ${error.message}`);
    }
  }

  async create(createBlockDto: CreateBlockDto) {
    const block = plainToInstance(Block, createBlockDto);
    const createdBlock = await this.blockRepository.save(block);

    return createdBlock;
  }

  async findMissingBlocks(latestOnlineBlock: number): Promise<number[]> {
    try {
      const latestCheckedBlock = await this.findLatestCheckedBlock();

      if (!latestCheckedBlock) {
        this.logger.error("No checked block found.");
        return [];
      }

      this.logger.log(
        `Finding missed blocks between ${latestCheckedBlock.blockNumber + 1} and ${latestOnlineBlock - 1} count: ${latestOnlineBlock - latestCheckedBlock.blockNumber}`
      );

      const existingBlocks = await this.blockRepository.find({
        where: {
          blockNumber: Between(latestCheckedBlock.blockNumber + 1, latestOnlineBlock - 1)
        },
        select: ["blockNumber"]
      });

      const existingBlockNumbers = new Set(existingBlocks.map((block) => block.blockNumber));

      const missedBlockNumbers = Array.from(
        {length: latestOnlineBlock - latestCheckedBlock.blockNumber - 1},
        (_, i) => i + latestCheckedBlock.blockNumber + 1
      ).filter((blockNumber) => !existingBlockNumbers.has(blockNumber));

      if (missedBlockNumbers.length > 0) {
        this.logger.warn(`Missed blocks detected: ${missedBlockNumbers.length}}`);
      } else {
        this.logger.log("No missed blocks detected.");
      }

      return missedBlockNumbers;
    } catch (error) {
      this.logger.error("Error finding missed blocks:", error);
      throw new Error("Failed to find missed blocks");
    }
  }

  async findByBlockNumber(blockNumber: number): Promise<Block | undefined> {
    return await this.blockRepository.findOneBy({blockNumber});
  }

  async findLatestCheckedBlock(): Promise<Block | undefined> {
    const latestCheckedBlock = await this.blockRepository.findOne({
      where: {checkedTillHere: true},
      order: {blockNumber: "DESC"}
    });

    if (!latestCheckedBlock) {
      this.logger.log("No block with checkedTillHere found, using the first available block.");

      const firstBlock = await this.blockRepository.find({
        order: {blockNumber: "ASC"},
        take: 1
      });

      return firstBlock.length ? firstBlock[0] : new Block(43666680, "");
    }

    return latestCheckedBlock;
  }

  async markLatestBlockAsChecked(blockNumber: number): Promise<void> {
    await this.blockRepository.update({checkedTillHere: true}, {checkedTillHere: false});

    await this.blockRepository.update({blockNumber}, {checkedTillHere: true});
  }

  @Cron("0 0 * * *")
  async removeOldBlocks(): Promise<void> {
    try {
      const result = await this.blockRepository.delete({checkedTillHere: false});
      this.logger.log(`Removed ${result.affected} old blocks with checkedTillHere = false.`);
    } catch (error) {
      this.logger.error("Error removing old blocks:", error);
      throw new Error("Failed to remove old blocks");
    }
  }
}
