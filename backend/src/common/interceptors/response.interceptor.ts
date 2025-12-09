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
        return this.wrapResponse(data, request, response);
      }),
    );
  }

  /**
   * Wrap response data into ApiResponse format
   * Mobile and Web expect: { success: true, message, data, timestamp, path, statusCode }
   * Note: Success response does not have 'error' field
   */
  private wrapResponse(
    data: any,
    request: Request,
    response: Response,
  ): ApiResponse<T> {
    // If response is already wrapped, return as is
    if (this.isAlreadyWrapped(data)) {
      return data;
    }

    // Special case: DELETE request with no data
    if (this.isDeleteRequestWithoutData(request.method, data)) {
      return this.createSuccessResponse(
        null as T,
        'Xóa thành công',
        request.url,
        response.statusCode,
      );
    }

    // Wrap normal response
    const message = this.getMessageByMethod(request.method);
    return this.createSuccessResponse(
      data as T,
      message,
      request.url,
      response.statusCode,
    );
  }

  /**
   * Check if response is already in ApiResponse format
   */
  private isAlreadyWrapped(data: unknown): data is ApiResponse<T> {
    return (
      data !== null &&
      typeof data === 'object' &&
      'success' in data &&
      typeof (data as Record<string, unknown>).success === 'boolean'
    );
  }

  /**
   * Check if this is a DELETE request with no data
   */
  private isDeleteRequestWithoutData(method: string, data: any): boolean {
    return method === 'DELETE' && !data;
  }

  /**
   * Create a standardized success response
   */
  private createSuccessResponse(
    data: T,
    message: string,
    path: string,
    statusCode: number,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      statusCode,
    };
  }

  /**
   * Get success message based on HTTP method
   */
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
