import { Controller, Post, Body, HttpStatus, HttpCode, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { USER_CREATED_SUCCESSFULLY_RESPONSE } from '../constants.util';
import { AuthService } from './auth.service';
import { Public } from '../decorators-custom/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { IAuthResponse, ITicketsRequest, IUserTokensResponse } from './interfaces/auth.interface';
import { AuthControllerSwagger } from './swagger/auth-controller.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(AuthControllerSwagger.postSignUp.apiOperation)
  @ApiCreatedResponse(AuthControllerSwagger.postSignUp.apiCreatedResponse)
  @ApiBadRequestResponse(AuthControllerSwagger.postSignUp.apiBadRequestResponse)
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
  @ApiOperation(AuthControllerSwagger.postLogin.apiOperation)
  @ApiOkResponse(AuthControllerSwagger.postLogin.apiOkResponse)
  @ApiBadRequestResponse(AuthControllerSwagger.postLogin.apiBadRequestResponse)
  @ApiUnauthorizedResponse(AuthControllerSwagger.postLogin.apiUnauthorizedResponse)
  async login(@Body() loginDto: LoginDto): Promise<IUserTokensResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(AuthControllerSwagger.postRefreshToken.apiOperation)
  @ApiOkResponse(AuthControllerSwagger.postRefreshToken.apiOKResponse)
  @ApiBadRequestResponse(AuthControllerSwagger.postRefreshToken.apiBadRequestResponse)
  @ApiUnauthorizedResponse(AuthControllerSwagger.postRefreshToken.apiUnauthorizedResponse)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: ITicketsRequest,
  ): Promise<IUserTokensResponse> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, req.userId);
  }
}
