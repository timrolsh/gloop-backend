import {Controller, Get} from "@nestjs/common";
import {Public} from "src/common/Auth/public-action.decorator";

@Controller() // Handles the root path
export class AppController {
  @Public() // Mark this route as public so AuthGuard bypasses it
  @Get() // Handles GET requests to "/"
  getHello(): string {
    return "Hello, world!";
  }
}
