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
}
