import { Controller, Post, Body, HttpStatus, HttpCode, Req } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { IAuthResponse, ITicketsRequest, IUserTokensResponse } from './interfaces/auth.interface';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators-custom/public.decorator';
import { USER_CREATED_SUCCESSFULLY_RESPONSE } from '../constants.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto): Promise<IAuthResponse> {
    const id = await this.authService.signUp(signUpDto);

    return {
      id,
      message: USER_CREATED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<IUserTokensResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: ITicketsRequest,
  ): Promise<IUserTokensResponse> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, req.userId);
  }
}
