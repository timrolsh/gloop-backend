import { ValidationPipeOptions } from "@nestjs/common";

export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
    whitelist: false,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
        enableImplicitConversion: true,
    },
};

