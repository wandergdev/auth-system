/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll(); //Payload del JWT
  }

  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @Get('me')
  getMe(@GetUser() email: string) {
    return { email };
  }
}
