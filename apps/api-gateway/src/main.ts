import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from '@app/common/filters/all-exceptions.filter';
async function bootstrap() {
  const logger = new Logger('API_GATEWAY_BOOTSTRAP');
  const app = await NestFactory.create(ApiGatewayModule);
  // 1. Bảo mật HTTP Headers chống tấn công XSS, Clickjacking bằng Helmet
  app.use(helmet());
  // 2. Cấu hình CORS nghiêm ngặt cho Fintech
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Toàn bộ Request gửi lên phải qua bộ lọc dữ liệu chặt chẽ (ValidationPipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field không được định nghĩa trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu client gửi field lạ lên
      transform: true, // Tự động convert kiểu dữ liệu (vd: string sang number)
    }),
  );
  // 4. Áp dụng bộ bắt lỗi tập trung toàn cục
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 API Gateway is running on: http://localhost:${port}`);
}
bootstrap();
