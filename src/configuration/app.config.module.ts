import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {configuration} from "./configuration";
import {validationSchema} from "./validation";

const envFilePath = `.${process.env.NODE_ENV || "development"}.env`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [envFilePath, ".env"], // Fallback to `.env` if specific environment file is not found
      load: [configuration],
      validationSchema
    })
  ],
  exports: [ConfigModule]
})
export class AppConfigModule {}
