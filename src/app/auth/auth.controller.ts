import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Headers,
  HttpStatus
} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";

import {ApiResponseResult} from "src/common/swagger/decorators/api-response-result.decorator";
import {ResultDto} from "src/common/dto/result.dto";
import {AuthResponseDto} from "./dto/auth-response.dto";
import {GreetingResponseDto} from "./dto/greeting.dto";
import {UserLoginDto} from "./dto/user-login.dto";
import {AuthGuard} from "./guard/auth.guard";
import {throwCustomHttpException} from "src/common/utils/exception.util";
import {Public} from "src/common/Auth/public-action.decorator";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponseResult(GreetingResponseDto)
  @Public()
  @Get("greeting")
  greeting(): Promise<ResultDto<GreetingResponseDto>> {
    return this.authService.greetingMessage();
  }

  @ApiResponseResult(AuthResponseDto, false, 201)
  @Public()
  @Post("user/login")
  async loginUser(@Body() login: UserLoginDto): Promise<ResultDto<AuthResponseDto>> {
    return this.authService.loginUser(login);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT")
  @ApiResponseResult(AuthResponseDto)
  @Post("user/refresh-token")
  async refreshTokenUser(
    @Headers("authorization") authorization: string
  ): Promise<ResultDto<AuthResponseDto>> {
    if (!authorization) {
      throwCustomHttpException(
        "Authorization header missing",
        "sdfsdfsdf",
        HttpStatus.UNAUTHORIZED
      );
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Invalid authorization token");
    }

    return this.authService.refreshTokenUser(token);
  }

  // @Post("test-access")
  // @Public()
  // testAccess() {
  //     const wallet = new Wallet("dgdfdfg");

  //     wallet.id = "sdfdgdfgdfg";
  //     wallet.createdAt = new Date();
  //     wallet.updatedAt = new Date();
  //     wallet.transactions = [];

  //     return this.authService.tokenForPayload(wallet);
  // }
}
