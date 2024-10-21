import { Controller, Post, Body, HttpStatus, HttpCode, Req, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { IResponse } from '../common/interfaces/common.interface';
import {
  FORGOT_PASSWORD_RESPONSE,
  USER_CREATED_SUCCESSFULLY_RESPONSE,
  USER_EDITED_SUCCESSFULLY_RESPONSE,
} from '../common/constants.util';
import { Public } from '../decorators-custom/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';
import {
  IForgotAndResetPasswordResponse,
  ITicketsRequest,
  IUserTokensResponse,
} from './interfaces/auth.interface';
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
  async signUp(@Body() signUpDto: SignUpDto): Promise<IResponse> {
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
    return this.authService.refreshTokens(refreshTokenDto, req.userId);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<IForgotAndResetPasswordResponse> {
    await this.authService.forgotPassword(forgotPasswordDto);

    return {
      message: FORGOT_PASSWORD_RESPONSE,
      statusCode: HttpStatus.ACCEPTED,
    };
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: ITicketsRequest,
  ): Promise<IResponse> {
    await this.authService.changePassword(changePasswordDto, req.userId);

    return {
      id: req.userId,
      message: USER_EDITED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }

  @Public()
  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<IForgotAndResetPasswordResponse> {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      message: USER_EDITED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
