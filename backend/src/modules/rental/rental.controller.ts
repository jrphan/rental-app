import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { RentalService } from './rental.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { User, UserRole } from '@prisma/client';

@ApiTags('rentals')
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Renter tạo yêu cầu đặt xe' })
  async create(
    @GetUser() user: Omit<User, 'password'>,
    @Body()
    body: {
      vehicleId: string;
      startDate: string;
      endDate: string;
      pickupLocation?: string;
      returnLocation?: string;
      notes?: string;
    },
  ) {
    return this.rentalService.createRental(user.id, body);
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Owner xác nhận đơn' })
  async confirm(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.rentalService.ownerConfirm(user.id, id);
  }

  @Post(':id/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Owner chuyển trạng thái ACTIVE khi giao xe' })
  async setActive(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.rentalService.setActive(user.id, id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Owner hoàn tất đơn' })
  async complete(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.rentalService.complete(user.id, id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Renter hủy đơn' })
  async cancel(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.rentalService.cancelByRenter(user.id, id);
  }
}
