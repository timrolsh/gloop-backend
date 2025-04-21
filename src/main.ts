import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {corsConfig} from "./common/cors/cors.config";
import {ConfigService} from "@nestjs/config";
import {Logger, ValidationPipe} from "@nestjs/common";
import {setupSwagger} from "./common/swagger/swagger.config";
import {SeedingService} from "./database/seeding/seeding.service";
import dataSource from "./database/typeorm-migration";
import {ResponseTransformInterceptor} from "./common/interceptors/response-transform.interceptor";
import {AllExceptionsFilter} from "./common/filters/http-exception.filter";
import {QueryFailedExceptionFilter} from "./common/filters/query-failed-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
  });
  // Get the ConfigService and Logger instances from the application context
  const configService = app.get(ConfigService);
  const isProduction = configService.get<boolean>("app.isProduction");
  const logger = new Logger(bootstrap.name);

  // Set global configurations
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Register global exception filters
  app.useGlobalFilters(new QueryFailedExceptionFilter(), new AllExceptionsFilter());

  app.setGlobalPrefix("api");
  app.enableCors(corsConfig);

  // Setup Swagger documentation
  if (!isProduction) {
    setupSwagger(app, configService);
  }

  // Initialize and run database migrations
  await dataSource.initialize();
  await dataSource.runMigrations();

  // Seed initial data
  const seedingService = app.get(SeedingService);
  await seedingService.seed();

  // Start the application
  const port = configService.get<number>("app.port");
  await app.listen(port);

  // Log the success message
  logger.log(
    `${configService.get<number>("app.name")} Backend started. Listening on port: ${port}`
  );

  const url = await app.getUrl();
  logger.log(`Swagger is running on: ${url}/docs`);
}
bootstrap();
