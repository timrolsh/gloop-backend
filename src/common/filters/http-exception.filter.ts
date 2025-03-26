import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from "@nestjs/common";
import { Request, Response } from "express";
import { ResponseMessage, ResultDto } from "src/common/dto/result.dto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorResponse: ResponseMessage = {
            dev: "Internal server error",
            user: "An unexpected error occurred. Please try again later.",
        };

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // Handle BadRequestException to show all validation messages
            if (exception instanceof BadRequestException) {
                const res = exception.getResponse() as any;
                let messageList: string[] = [];

                if (typeof res === "object" && res.message) {
                    messageList = Array.isArray(res.message) ? res.message : [res.message];
                }

                // Join the messages into a single string for developer message
                errorResponse.dev = messageList.join(", ") || "Validation failed";
                // Show a generic message to the user
                errorResponse.user = "Invalid request data. Please check your input.";
            } else {
                // For other HttpExceptions
                const responseMessage = exceptionResponse as ResponseMessage;
                errorResponse.dev = responseMessage.dev || errorResponse.dev;
                errorResponse.user = responseMessage.user || errorResponse.user;
            }
        } else {
            // For non-HttpException errors
            errorResponse.dev = exception.message || errorResponse.dev;
        }

        const result: ResultDto<any> = {
            data: null,
            paging: null,
            message: errorResponse,
            statusCode: status,
            hasData: false,
        };

        // Log detailed error information for debugging
        console.error({
            timestamp: new Date().toISOString(),
            path: request.url,
            statusCode: status,
            errorMessage: exception.message,
            error: exception,
        });

        response.status(status).json(result);
    }
}
