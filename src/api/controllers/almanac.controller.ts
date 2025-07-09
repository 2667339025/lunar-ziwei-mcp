import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AlmanacService } from '../../core/almanac/almanac.service';
import { GetAlmanacDto } from '../../api/dto/almanac.dto';
import { 
  AlmanacResult, 
  LuckyDayResult, 
  SolarTermResult 
} from '../../shared/types/almanac.types';
import { ApiSuccessResponse } from '../../shared/decorators/api-success-response.decorator';

/**
 * 黄历查询控制器
 * 处理与黄历、节气相关的API请求
 */
@ApiTags('almanac')
@Controller('api/almanac')
export class AlmanacController {
  constructor(private readonly almanacService: AlmanacService) {}

  /**
   * 获取指定日期的黄历信息
   * @param dto 包含日期信息的请求数据
   * @returns 黄历查询结果
   */
  @Post('daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取指定日期黄历信息',
    description: '根据日期查询当天的黄历信息，包括宜忌、干支、神煞等'
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '输入参数错误' })
  @ApiSuccessResponse(AlmanacResult, '黄历信息查询成功')
  async getDailyAlmanac(
    @Body() dto: GetAlmanacDto
  ): Promise<AlmanacResult> {
    return this.almanacService.getDailyAlmanac(dto.date);
  }

  /**
   * 获取指定月份的黄道吉日
   * @param year 年份
   * @param month 月份
   * @returns 黄道吉日查询结果
   */
  @Get('lucky-days')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取指定月份黄道吉日',
    description: '查询指定月份的黄道吉日及其适宜事项'
  })
  @ApiSuccessResponse(LuckyDayResult, '黄道吉日查询成功')
  async getLuckyDays(
    @Query('year') year: number,
    @Query('month') month: number
  ): Promise<LuckyDayResult> {
    return this.almanacService.getLuckyDays(year, month);
  }

  /**
   * 获取指定年份的节气信息
   * @param year 年份
   * @returns 节气信息查询结果
   */
  @Get('solar-terms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取指定年份节气信息',
    description: '查询指定年份的所有节气日期和时间'
  })
  @ApiSuccessResponse(SolarTermResult, '节气信息查询成功')
  async getSolarTerms(
    @Query('year') year: number
  ): Promise<SolarTermResult> {
    return this.almanacService.getSolarTerms(year);
  }

  /**
   * 获取指定日期的宜忌事项
   * @param date 日期 (YYYY-MM-DD)
   * @returns 宜忌事项查询结果
   */
  @Get('suitable-avoid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取指定日期宜忌事项',
    description: '查询指定日期的适宜和避免事项'
  })
  @ApiSuccessResponse(Object, '宜忌事项查询成功')
  async getSuitableAvoid(
    @Query('date') date: string
  ): Promise<{
    suitable: string[];
    avoid: string[];
    date: string;
  }> {
    return this.almanacService.getSuitableAvoid(date);
  }
}