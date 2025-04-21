import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {INestApplication} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

export function setupSwagger(app: INestApplication, configService: ConfigService) {
  const appTitle = configService.get<string>("app.name");
  const appDescription = configService.get<string>("app.description");
  const appVersion = configService.get<string>("app.version");

  const options = new DocumentBuilder()
    .setTitle(appTitle)
    .setDescription(appDescription)
    .setVersion(appVersion)
    .addBearerAuth({type: "http", scheme: "bearer", bearerFormat: "JWT"}, "JWT")
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
}
