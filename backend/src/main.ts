import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { AUTH_COOKIE } from './auth/auth.cookie';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  // Explicit allowlist: '*' is invalid together with credentials, and the
  // session cookie must only ever be readable by our own frontend.
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Tenantly API')
    .setDescription('Multi-tenant mini project management with tenant isolation & RBAC')
    .setVersion('1.0')
    .addCookieAuth(AUTH_COOKIE)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Tenantly API running on http://localhost:${port}`);
  console.log(`📚 Swagger Documentation on http://localhost:${port}/api/docs`);
}
bootstrap();
