import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ITenantsResponse } from './interfaces/tenants.interface';
import { TenantsService } from './tenants.service';
import { Tenant, TenantDocument } from './schema/tenant.schema';
import {
  TENANT_CREATED_SUCCESSFULLY_RESPONSE,
  TENANT_DELETED_SUCCESSFULLY_RESPONSE,
  TENANT_EDITED_SUCCESSFULLY_RESPONSE,
} from './utils/tenants-string-literals.util';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTenantDto: CreateTenantDto): Promise<ITenantsResponse> {
    const id = await this.tenantsService.create(createTenantDto);

    return {
      id,
      message: TENANT_CREATED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query?: TenantQueryDto): Promise<Tenant[]> {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse()
  async findOne(@Param('id') id: string): Promise<TenantDocument> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse()
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<ITenantsResponse> {
    await this.tenantsService.update(id, updateTenantDto);

    return {
      id,
      message: TENANT_EDITED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ITenantsResponse> {
    await this.tenantsService.remove(id);

    return {
      id,
      message: TENANT_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
