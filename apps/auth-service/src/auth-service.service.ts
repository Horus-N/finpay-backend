import { PrismaService } from '@app/database/prisma.service';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (userExists) {
      throw new ConflictException(
        'Email already <i class="fa fa-expeditedssl" aria-hidden="true"></i>',
      );
    }
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(dto.password, saltRounds);
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashPassword,
        fullName: dto.fullName,
      },
    });
    const { password, ...result } = newUser;
    return {
      success: true,
      message: 'Register successfully!',
      user: result,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password!');
    const isPasswordMath = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMath)
      throw new UnauthorizedException('Invalid email or password!');

    const tokens = await this.generateToken(user.id, user.email, 'user');

    await this.updateRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  private async generateToken(userId: string, email: string, role: string) {
    const jwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(dto: RefreshTokenDto) {
    const saltRounds = 10;
    const hashRefreshToken = await bcrypt.hash(dto.refreshToken, saltRounds);
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { refreshToken: hashRefreshToken },
    });
  }
}
