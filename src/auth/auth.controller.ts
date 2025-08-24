/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  //Get Hello World!
  @Get('get')
  getHello(): string {
    return 'Hello World!';
  }
  //Register
  @Public()
  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.register(email, password);
  }

  //Login
  @Public()
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.login(email, password);
  }

  //Refresh Token
  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  //Private root
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  //Logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const user = req.user as any;
    return this.auth.logout(user.sub);
  }
}
