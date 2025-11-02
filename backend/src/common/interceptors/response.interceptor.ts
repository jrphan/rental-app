import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/interfaces/Response/response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: any): ApiResponse<T> => {
        // Nếu response đã được wrap rồi thì không wrap lại
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Nếu là DELETE request và không có data, trả về response đặc biệt
        if (request.method === 'DELETE' && !data) {
          return {
            success: true,
            message: 'Xóa thành công',
            data: null as T,
            timestamp: new Date().toISOString(),
            path: request.url,
            statusCode: response.statusCode,
          };
        }

        // Wrap response thông thường
        return {
          success: true,
          message: this.getMessageByMethod(request.method),
          data: data as T,
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode: response.statusCode,
        };
      }),
    );
  }

  private getMessageByMethod(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Lấy dữ liệu thành công',
      POST: 'Tạo thành công',
      PUT: 'Cập nhật thành công',
      PATCH: 'Cập nhật thành công',
      DELETE: 'Xóa thành công',
    };
    return messages[method] || 'Thành công';
  }
}
