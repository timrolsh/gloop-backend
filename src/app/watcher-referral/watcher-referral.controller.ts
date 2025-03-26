import { Controller } from '@nestjs/common';
import { WatcherReferralService } from './watcher-referral.service';

@Controller('watcher-referral')
export class WatcherReferralController {
  constructor(private readonly watcherReferralService: WatcherReferralService) {}
}
