import { applyDecorators, Type } from "@nestjs/common";
import { ApiBadRequestResponse, ApiExtraModels, ApiResponse, ApiUnauthorizedResponse, getSchemaPath } from "@nestjs/swagger";
import { ResultDto } from "src/common/dto/result.dto";

export function ApiResponseResult<TModel extends Type<any>>(model: TModel, isArray: boolean = false, status: number = 200) {
    let resultDtoSchema: any = { $ref: getSchemaPath(ResultDto) };

    if (!isArray) {
        resultDtoSchema = {
            allOf: [
                { $ref: getSchemaPath(ResultDto) },
                {
                    type: "object",
                    properties: {
                        paging: { type: "null" },
                    },
                },
            ],
        };
    }

    const schemaProperties: any = {
        allOf: [
            resultDtoSchema,
            {
                properties: {
                    data: isArray ? { type: "array", items: { $ref: getSchemaPath(model) } } : { $ref: getSchemaPath(model) },
                    statusCode: { type: "number", example: status },
                },
            },
        ],
    };

    return applyDecorators(
        ApiExtraModels(ResultDto, model),
        ApiResponse({
            status: status,
            description: "Successful message",
            schema: schemaProperties,
        })
    );
}

export function ApiErrorResult() {
    return applyDecorators(
        ApiUnauthorizedResponse({
            description: "Unauthorized access.",
            schema: {
                example: {
                    data: null,
                    paging: null,
                    message: {
                        dev: "Unauthorized access - insufficient privileges.",
                        user: "Access denied. Please log in with the appropriate credentials.",
                    },
                    statusCode: 401,
                    hasData: false,
                },
            },
        }),
        ApiBadRequestResponse({
            description: "Bad request.",
            schema: {
                example: {
                    data: null,
                    paging: null,
                    message: {
                        dev: "Database error",
                        user: "Database error",
                    },
                    statusCode: 400,
                    hasData: false,
                },
            },
        })
    );
}
