import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authServiceService.register(dto);
  }
  @Post('login')
  async login(@Res() res: Response, @Body() dto: RegisterDto) {
    const resResult = await this.authServiceService.login(dto);
    res.cookie('refreshToken', resResult.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return {
      success: true,
      message: 'Login successfully! ',
      accessToken: resResult?.accessToken,
    };
  }
}
