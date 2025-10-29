import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, throwError } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse && event.body) {
          // Nếu response đã được wrap trong format { success, message, data }
          if (this.isApiResponse(event.body)) {
            // Unwrap: đưa data ra ngoài để service sử dụng
            return event.clone({
              body: event.body.data || event.body,
            });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        // Xử lý error response
        if (error.error && this.isApiResponse(error.error)) {
          // Nếu error đã đúng format, giữ nguyên
          return throwError(() => error);
        }
        return throwError(() => error);
      }),
    );
  }

  private isApiResponse(obj: any): obj is ApiResponse<any> {
    return (
      obj &&
      typeof obj === 'object' &&
      'success' in obj &&
      'message' in obj &&
      'timestamp' in obj &&
      'path' in obj &&
      'statusCode' in obj
    );
  }
}
