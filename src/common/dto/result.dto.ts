import { PaginationMeta } from "./../../common/querying/interfaces/pagination-meta.interface";
import { ApiProperty } from "@nestjs/swagger";
export interface IResponseMessage {
    dev: string;
    user?: string;
}

export class ResponseMessage implements IResponseMessage {
    @ApiProperty({
        description: "A message describing the result of the API call to developer.",
        example: "Data retrieve success",
    })
    dev: string;
    @ApiProperty({
        description: "A message describing the result of the API call as a user friendly message.",
        example: "Data retrieve success",
    })
    user?: string;
    constructor(dev: string, user: string) {
        this.dev = dev;
        this.user = user;
    }
}

export class PaginationMetaDto implements PaginationMeta {
    @ApiProperty({
        description: "The number of items per page.",
        example: 10,
    })
    itemsPerPage: number;

    @ApiProperty({
        description: "The total number of items.",
        example: 100,
    })
    totalItems: number;

    @ApiProperty({
        description: "The current page number.",
        example: 1,
    })
    currentPage: number;

    @ApiProperty({
        description: "The total number of pages.",
        example: 10,
    })
    totalPages: number;

    @ApiProperty({
        description: "A flag indicating whether there is a next page.",
        example: true,
    })
    hasNextPage: boolean;

    @ApiProperty({
        description: "A flag indicating whether there is a previous page.",
        example: false,
    })
    hasPreviousPage: boolean;
}

export class ResultDto<T> {
    @ApiProperty({
        description: "The actual data returned by the API.",
    })
    data: T | null;

    @ApiProperty({
        description: "Metadata about the pagination of the data.",
    })
    paging: PaginationMetaDto | null;

    @ApiProperty({
        description: "A message describing the result of the API call.",
        type: ResponseMessage,
        example: {
            dev: "Data retrieve success",
            user: "Data retrieve success",
        },
    })
    message: ResponseMessage;

    @ApiProperty({
        description: "The HTTP status code of the API call.",
    })
    statusCode: number;

    @ApiProperty({
        description: "A flag indicating whether the API call returned any data.",
        example: true,
    })
    hasData: boolean;

    constructor(data: T | null, message?: ResponseMessage) {
        this.data = data;
        this.message = message;
    }
}
