import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { QueryFailedError } from "typeorm";
import { ResultDto } from "../dto/result.dto";

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        console.error(exception.message);

        const status = HttpStatus.BAD_REQUEST;
        let message = "A database error occurred";

        if (exception.message.includes("duplicate key value")) {
            message = "A record with the given value already exists";
        }
        // const errorResponse: ErrorResponseDto = {
        //     statusCode: status,
        //     message,
        //     error: exception.message,
        //     timestamp: new Date().toISOString(),
        //     path: ctx.getRequest().url,
        // };

        const errorResponse: ResultDto<any> = {
            data: null,
            paging: null,
            message: {
                dev: exception.message,
                user: "",
            },
            statusCode: status,
            hasData: false,
        };

        response.status(status).json(errorResponse);
    }
}
