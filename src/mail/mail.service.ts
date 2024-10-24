import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

import { NODEMAILER_PORT_WITH_SECURITY, PASSWORD_RESET_REQUEST } from '../common/constants.util';

@Injectable()
export class MailService {
  private transporter: Transporter;

  private port: number = Number(process.env.NODEMAILER_PORT);
  private user: string = process.env.NODEMAILER_USER;

  constructor() {
    this.transporter = createTransport({
      host: process.env.NODEMAILER_HOST,
      port: this.port,
      secure: this.port === NODEMAILER_PORT_WITH_SECURITY,
      auth: {
        user: this.user,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const html = `
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${process.env.FRONT_END_RESET_PASSWORD_URL_MORE_QUERY_NAME_FOR_RESET_TOKEN}=${resetToken}">Reset Password</a></p>
    <p>For security, this link will expire in ${process.env.TOKEN_EXPIRES_AFTER_MINUTES} minutes.</p>
    <p>If you haven't forgotten your password, please, ignore this message.</p>
    `;

    this.transporter.sendMail({
      from: this.user,
      to,
      subject: PASSWORD_RESET_REQUEST,
      html,
    });
  }
}
