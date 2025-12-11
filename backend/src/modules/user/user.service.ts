import { CreateUserDto } from '@/common/dto/User/create-user-dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUserInfoResponse, selectGetUserInfo } from '@/types/user.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      },
    });

    return user;
  }

  async getUserInfo(userId: string): Promise<GetUserInfoResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: selectGetUserInfo,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
