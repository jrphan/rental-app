import {
  Controller,
  All,
  Req,
  Res,
  Get,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    try {
      const services = await this.proxyService.healthCheck();
      const allHealthy = Object.values(services).every(
        (service: any) => service.status === 'healthy'
      );

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services,
      };
    } catch (error) {
      throw new HttpException(
        'Health check failed',
        HttpStatus.SERVICE_UNAVAILABLE
      );
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
      this.logger.error(`Auth proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Auth service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Vehicle proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Vehicle service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Booking proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Booking service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Payment proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Payment service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Notification proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Notification service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Location proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Location service unavailable',
        error: error.message,
      });
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
      this.logger.error(`Review proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'Review service unavailable',
        error: error.message,
      });
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
      this.logger.error(`File upload proxy error: ${error.message}`);
      res.status(error.response?.status || 500).json({
        message: 'File upload service unavailable',
        error: error.message,
      });
    }
  }
}
