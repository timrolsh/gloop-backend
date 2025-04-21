import {createParamDecorator, ExecutionContext, HttpStatus} from "@nestjs/common";
import {throwCustomHttpException} from "src/common/utils/exception.util";

export function GetWalletFactory() {
  return createParamDecorator(async (data: unknown, ctx: ExecutionContext): Promise<string> => {
    const request = ctx.switchToHttp().getRequest();
    const wallet = request.user?.username as string;
    const walletId = request.user?.sub as string;

    if (!walletId) {
      const devMessage = "Unauthorized access - insufficient privileges.";
      const userMessage = "Access denied. Please log in with the appropriate credentials.";

      throwCustomHttpException(devMessage, userMessage, HttpStatus.UNAUTHORIZED);
    }

    return walletId;
  })();
}
