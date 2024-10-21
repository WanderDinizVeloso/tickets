import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { ObjectId } from 'mongodb';
import { Connection, Model } from 'mongoose';

import {
  REFRESH_TOKEN_INVALID_RESPONSE,
  WRONG_CREDENTIALS_RESPONSE,
} from '../common/constants.util';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { EncryptService } from '../encrypt/encrypt.service';
import { IUserTokensResponse } from './interfaces/auth.interface';
import { MailService } from '../mail/mail.service';
import { RefreshToken, RefreshTokenDocument } from './schema/refresh-token.schema';
import { ResetToken, ResetTokenDocument } from './schema/reset-token.schema';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(ResetToken.name) private readonly resetTokenModel: Model<ResetTokenDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly encryptService: EncryptService,
    private readonly mailService: MailService,
  ) {}

  async changePassword(changePasswordDto: ChangePasswordDto, userId: string): Promise<void> {
    const userObjectId = ObjectId.createFromHexString(userId);

    const { password } = await this.userModel.findById(userObjectId);

    const passwordMatch = this.encryptService.hashCompare(password, changePasswordDto.oldPassword);

    if (!passwordMatch) {
      throw new UnauthorizedException(WRONG_CREDENTIALS_RESPONSE);
    }

    await this.userModel.findOneAndUpdate(
      { _id: userObjectId },
      { password: this.encryptService.hashCreate(changePasswordDto.newPassword) },
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email });

    if (!user) {
      return;
    }

    const resetToken = randomUUID();

    await this.storeResetToken(resetToken, user._id.toString());

    await this.mailService.sendPasswordResetEmail(forgotPasswordDto.email, resetToken);
  }

  private async generateUserTokens(userId: string): Promise<IUserTokensResponse> {
    const refreshToken = randomUUID();

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

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
    userId: string,
  ): Promise<IUserTokensResponse> {
    const token = await this.refreshTokenModel.findOneAndDelete({
      refreshToken: refreshTokenDto.refreshToken,
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

  private async storeRefreshToken(refreshToken: string, userId: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { userId },
      { expiryDate: this.setTokenExpiryDate(), refreshToken },
      { upsert: true },
    );
  }

  private async storeResetToken(resetToken: string, userId: string): Promise<void> {
    await this.resetTokenModel.updateOne(
      { userId },
      { expiryDate: this.setTokenExpiryDate(), resetToken },
      { upsert: true },
    );
  }
}
