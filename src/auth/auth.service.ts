import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { REFRESH_TOKEN_INVALID_RESPONSE, WRONG_CREDENTIALS_RESPONSE } from '../constants.util';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { EncryptService } from '../encrypt/encrypt.service';
import { IUserTokensResponse } from './interfaces/auth.interface';
import { RefreshToken, RefreshTokenDocument } from './schema/refresh-token.schema';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly encryptService: EncryptService,
  ) {}

  private async generateUserTokens(userId: string): Promise<IUserTokensResponse> {
    const refreshToken = this.encryptService.UUIDGenerate();

    await this.storeRefreshToken(refreshToken, userId);

    return {
      accessToken: this.jwtService.sign({ userId }),
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<IUserTokensResponse> {
    const user = await this.userModel.findOne({ email: loginDto.email });

    if (!user) {
      throw new UnauthorizedException(WRONG_CREDENTIALS_RESPONSE);
    }

    const passwordMatch = this.encryptService.hashCompare(user.password, loginDto.password);

    if (!passwordMatch) {
      throw new UnauthorizedException(WRONG_CREDENTIALS_RESPONSE);
    }

    return this.generateUserTokens(user._id.toString());
  }

  async refreshTokens(refreshToken: string, userId: string): Promise<IUserTokensResponse> {
    const token = await this.refreshTokenModel.findOneAndDelete({
      token: refreshToken,
      userId,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException(REFRESH_TOKEN_INVALID_RESPONSE);
    }

    return this.generateUserTokens(token.userId);
  }

  private setTokenExpiryDate(): Date {
    const expiryDate = new Date();

    expiryDate.setMinutes(
      expiryDate.getMinutes() + Number(process.env.TOKEN_EXPIRES_AFTER_MINUTES),
    );

    return expiryDate;
  }

  async signUp(signUpDto: SignUpDto): Promise<string> {
    await this.connection.syncIndexes();

    const { password, ...signUpDtoRest } = signUpDto;

    const response = await this.userModel.create({
      ...signUpDtoRest,
      password: this.encryptService.hashCreate(password),
    });

    return response?._id?.toString();
  }

  private async storeRefreshToken(token: string, userId: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { userId },
      { expiryDate: this.setTokenExpiryDate(), token },
      { upsert: true },
    );
  }
}
