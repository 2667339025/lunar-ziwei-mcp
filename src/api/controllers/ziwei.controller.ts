import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZiweiService } from '../../core/ziwei/ziwei.service';
import { CalculateZiweiDto } from '../../api/dto/ziwei.dto';
import { ZiweiChartResult } from '../../shared/types/ziwei.types';
import { ApiSuccessResponse } from '../../shared/decorators/api-success-response.decorator';

/**
 * 紫微斗数控制器
 * 处理与紫微斗数相关的API请求
 */
@ApiTags('ziwei')
@Controller('api/ziwei')
export class ZiweiController {
  constructor(private readonly ziweiService: ZiweiService) {}

  /**
   * 计算紫微斗数星盘
   * @param dto 包含出生信息的请求数据
   * @returns 紫微斗数星盘计算结果
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '计算紫微斗数星盘',
    description: '根据出生信息计算完整的紫微斗数12宫星盘数据、运限信息和星耀分析'
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '输入参数错误' })
  @ApiSuccessResponse(ZiweiChartResult, '紫微斗数星盘计算成功')
  async calculateZiweiChart(
    @Body() dto: CalculateZiweiDto
  ): Promise<ZiweiChartResult> {
    return this.ziweiService.calculateZiweiChart(dto);
  }

  /**
   * 获取指定宫位的三方四正宫位
   * @param palaceName 宫位名称
   * @returns 三方四正宫位信息
   */
  @Post('triple-square-palaces')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取指定宫位的三方四正',
    description: '根据宫位名称查询其三方四正宫位信息'
  })
  @ApiSuccessResponse(Object, '三方四正宫位查询成功')
  async getTripleSquarePalaces(
    @Body('palaceName') palaceName: string
  ): Promise<{
    originalPalace: string;
    triplePalaces: string[];
    squarePalaces: string[];
    allRelatedPalaces: string[];
  }> {
    return this.ziweiService.getTripleSquarePalaces(palaceName);
  }

  /**
   * 判断指定宫位是否存在四化
   * @param params 包含宫位名称和四化类型的参数
   * @returns 判断结果
   */
  @Post('check-transformation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '判断宫位是否存在四化',
    description: '检查指定宫位三方四正是否存在指定类型的四化星'
  })
  @ApiSuccessResponse(Object, '四化判断成功')
  async checkPalaceTransformation(
    @Body() params: {
      palaceName: string;
      transformationType: 'huaquan' | 'huake' | 'huaxing' | 'huaji';
    }
  ): Promise<{
    exists: boolean;
    details: Array<{
      palace: string;
      star: string;
      transformation: string;
    }>;
  }> {
    return this.ziweiService.checkPalaceTransformation(
      params.palaceName,
      params.transformationType
    );
  }
}