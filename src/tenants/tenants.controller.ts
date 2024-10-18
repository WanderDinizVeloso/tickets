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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  TENANT_CREATED_SUCCESSFULLY_RESPONSE,
  TENANT_DELETED_SUCCESSFULLY_RESPONSE,
  TENANT_EDITED_SUCCESSFULLY_RESPONSE,
} from '../constants.util';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantQueryDto } from './dto/tenant-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ITenantsResponse } from './interfaces/tenants.interface';
import { TenantsService } from './tenants.service';
import { Tenant, TenantDocument } from './schema/tenant.schema';
import { TenantsControllerSwagger } from './swagger/tenants-controller.swagger';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(TenantsControllerSwagger.post.apiOperation)
  @ApiCreatedResponse(TenantsControllerSwagger.post.apiCreatedResponse)
  @ApiBadRequestResponse(TenantsControllerSwagger.post.apiBadRequestResponse)
  @ApiUnauthorizedResponse(TenantsControllerSwagger.post.apiUnauthorizedResponse)
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
  @ApiOperation(TenantsControllerSwagger.get.apiOperation)
  @ApiOkResponse(TenantsControllerSwagger.get.apiOkResponse)
  @ApiUnauthorizedResponse(TenantsControllerSwagger.get.apiUnauthorizedResponse)
  async findAll(@Query() query?: TenantQueryDto): Promise<Tenant[]> {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(TenantsControllerSwagger.getId.apiOperation)
  @ApiOkResponse(TenantsControllerSwagger.getId.apiOkResponse)
  @ApiBadRequestResponse(TenantsControllerSwagger.getId.apiBadRequestResponse)
  @ApiUnauthorizedResponse(TenantsControllerSwagger.getId.apiUnauthorizedResponse)
  async findOne(@Param('id') id: string): Promise<TenantDocument> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(TenantsControllerSwagger.patch.apiOperation)
  @ApiOkResponse(TenantsControllerSwagger.patch.apiOkResponse)
  @ApiBadRequestResponse(TenantsControllerSwagger.patch.apiBadRequestResponse)
  @ApiUnauthorizedResponse(TenantsControllerSwagger.patch.apiUnauthorizedResponse)
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
  @ApiOperation(TenantsControllerSwagger.delete.apiOperation)
  @ApiOkResponse(TenantsControllerSwagger.delete.apiOkResponse)
  @ApiBadRequestResponse(TenantsControllerSwagger.delete.apiBadRequestResponse)
  @ApiUnauthorizedResponse(TenantsControllerSwagger.delete.apiUnauthorizedResponse)
  async remove(@Param('id') id: string): Promise<ITenantsResponse> {
    await this.tenantsService.remove(id);

    return {
      id,
      message: TENANT_DELETED_SUCCESSFULLY_RESPONSE,
      statusCode: HttpStatus.OK,
    };
  }
}
