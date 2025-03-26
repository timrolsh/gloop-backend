import { HttpException, HttpStatus } from "@nestjs/common";
import { IResponseMessage } from "../dto/result.dto";

/**
 * Throws an HttpException with a structured error response.
 *
 * @param devMessage Developer-friendly error message.
 * @param userMessage User-friendly error message.
 * @param status HTTP status code for the exception.
 */
export function throwCustomHttpException(devMessage: string, userMessage: string, status: HttpStatus = HttpStatus.BAD_REQUEST): never {
    const errorResponse: IResponseMessage = {
        dev: devMessage,
        user: userMessage,
    };

    throw new HttpException(errorResponse, status);
}
