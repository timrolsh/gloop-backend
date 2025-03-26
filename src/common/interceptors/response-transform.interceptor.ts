import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseMessage, ResultDto } from "src/common/dto/result.dto";

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ResultDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ResultDto<T>> {
        return next.handle().pipe(
            map((data) => {
                const response = context.switchToHttp().getResponse();

                const statusCode = response.statusCode;

                const result: ResultDto<T> = {
                    data: data?.data || data,
                    paging: data?.paging || null,
                    message: data?.message || new ResponseMessage("", ""),
                    statusCode: statusCode,
                    hasData: !!data,
                };

                if (Array.isArray(result.data)) {
                    result.hasData = result.data.length > 0;
                }

                return result;
            })
        );
    }
}
