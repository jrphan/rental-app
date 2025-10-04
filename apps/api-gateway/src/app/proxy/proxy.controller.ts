import {
  Controller,
  All,
  Req,
  Res,
  Get,
  Logger,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProxyService } from './proxy.service';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  RESPONSE_MESSAGES, 
  HTTP_STATUS 
} from '@rental-app/shared-utils';

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Handle proxy errors - return original service error
   */
  private handleProxyError(error: any, serviceName: string, res: Response, req: Request) {
    this.logger.error(`${serviceName} proxy error: ${error.message}`);
    
    // If the error has a response from the service, return it as-is
    if (error.response) {
      const status = error.response.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const data = error.response.data;
      res.status(status).json(data);
      return;
    }
    
    // If no response from service, create a generic service unavailable error
    const errorResponse = createErrorResponse(
      `${serviceName} service unavailable`,
      error.message || 'Service error',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      req.path
    );
    
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(errorResponse);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck(@Req() req: Request) {
    try {
      const services = await this.proxyService.healthCheck();
      const allHealthy = Object.values(services).every(
        (service: any) => service.status === 'healthy'
      );

      const healthData = {
        status: allHealthy ? 'healthy' : 'degraded',
        services,
      };

      return createSuccessResponse(
        allHealthy ? 'All services are healthy' : 'Some services are degraded',
        healthData,
        req.path
      );
    } catch (error) {
      const errorResponse = createErrorResponse(
        RESPONSE_MESSAGES.SERVICE_UNAVAILABLE,
        'Health check failed',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Proxy all Auth Service requests
   */
  @All('auth/*')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/auth', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToAuthService(method, `/api/auth${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Auth', res, req);
    }
  }

  /**
   * Proxy all Vehicle Service requests
   */
  @All('vehicles/*')
  async proxyVehicles(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/vehicles', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToVehicleService(method, `/api/vehicles${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Vehicle', res, req);
    }
  }

  /**
   * Proxy all Booking Service requests
   */
  @All('bookings/*')
  async proxyBookings(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/bookings', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToBookingService(method, `/api/bookings${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Booking', res, req);
    }
  }

  /**
   * Proxy all Payment Service requests
   */
  @All('payments/*')
  async proxyPayments(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/payments', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToPaymentService(method, `/api/payments${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Payment', res, req);
    }
  }

  /**
   * Proxy all Notification Service requests
   */
  @All('notifications/*')
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/notifications', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToNotificationService(method, `/api/notifications${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Notification', res, req);
    }
  }

  /**
   * Proxy all Location Service requests
   */
  @All('locations/*')
  async proxyLocations(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/locations', ''); 
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToLocationService(method, `/api/locations${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Location', res, req);
    }
  }

  /**
   * Proxy all Review Service requests
   */
  @All('reviews/*')
  async proxyReviews(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/reviews', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToReviewService(method, `/api/reviews${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {
      this.handleProxyError(error, 'Review', res, req);
    }
  }

  /**
   * Proxy all File Upload Service requests
   */
  @All('file-uploads/*')
  async proxyFileUploads(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.url.replace('/api/file-uploads', '');
      const method = req.method.toLowerCase();
      
      const response = await firstValueFrom(
        this.proxyService.proxyToFileUploadService(method, `/api/file-uploads${path}`, req.body, req.headers)
      );

      res.status(response.status).json(response.data);
    } catch (error: any) {  
      this.handleProxyError(error, 'File Upload', res, req);
    }
  }
}
