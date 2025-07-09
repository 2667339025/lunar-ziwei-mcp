import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAnalysisService } from '../../core/ai/ai-analysis.service';
import { CalculateZiweiDto } from '../../api/dto/ziwei.dto';
import { 
  AiAnalysisResult,
  BasicInfo,
  PersonalityAnalysis,
  CareerAnalysis,
  RelationshipAnalysis,
  HealthAnalysis,
  FortuneTrend
} from '../../shared/types/ai-analysis.types';
import { ApiSuccessResponse } from '../../shared/decorators/api-success-response.decorator';

/**
 * AI命理分析控制器
 * 处理与AI命理分析相关的API请求
 */
@ApiTags('ai-analysis')
@Controller('api/ai-analysis')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  /**
   * 生成完整的命理分析报告
   * @param dto 包含出生信息的请求数据
   * @returns AI命理分析结果
   */
  @Post('complete-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '生成完整命理分析报告',
    description: '根据出生信息生成包含性格、事业、感情、健康和运势走势的完整命理分析报告，供AI解读'
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '输入参数错误' })
  @ApiSuccessResponse(AiAnalysisResult, '命理分析报告生成成功')
  async generateCompleteAnalysis(
    @Body() dto: CalculateZiweiDto
  ): Promise<AiAnalysisResult> {
    return this.aiAnalysisService.generateCompleteAnalysis(dto);
  }

  /**
   * 获取性格分析
   * @param dto 包含出生信息的请求数据
   * @returns 性格分析结果
   */
  @Post('personality')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取性格分析',
    description: '根据出生信息分析个人性格特点和天赋潜能'
  })
  @ApiSuccessResponse(PersonalityAnalysis, '性格分析生成成功')
  async getPersonalityAnalysis(
    @Body() dto: CalculateZiweiDto
  ): Promise<PersonalityAnalysis> {
    return this.aiAnalysisService.getPersonalityAnalysis(dto);
  }

  /**
   * 获取事业财运分析
   * @param dto 包含出生信息的请求数据
   * @returns 事业财运分析结果
   */
  @Post('career')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取事业财运分析',
    description: '分析个人事业发展趋势和财运状况'
  })
  @ApiSuccessResponse(CareerAnalysis, '事业财运分析生成成功')
  async getCareerAnalysis(
    @Body() dto: CalculateZiweiDto
  ): Promise<CareerAnalysis> {
    return this.aiAnalysisService.getCareerAnalysis(dto);
  }

  /**
   * 获取感情婚姻分析
   * @param dto 包含出生信息的请求数据
   * @returns 感情婚姻分析结果
   */
  @Post('relationship')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取感情婚姻分析',
    description: '分析个人感情运势和婚姻状况'
  })
  @ApiSuccessResponse(RelationshipAnalysis, '感情婚姻分析生成成功')
  async getRelationshipAnalysis(
    @Body() dto: CalculateZiweiDto
  ): Promise<RelationshipAnalysis> {
    return this.aiAnalysisService.getRelationshipAnalysis(dto);
  }

  /**
   * 获取健康状况分析
   * @param dto 包含出生信息的请求数据
   * @returns 健康状况分析结果
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取健康状况分析',
    description: '分析个人健康状况和注意事项'
  })
  @ApiSuccessResponse(HealthAnalysis, '健康状况分析生成成功')
  async getHealthAnalysis(
    @Body() dto: CalculateZiweiDto
  ): Promise<HealthAnalysis> {
    return this.aiAnalysisService.getHealthAnalysis(dto);
  }

  /**
   * 获取运势走势分析
   * @param dto 包含出生信息的请求数据
   * @returns 运势走势分析结果
   */
  @Post('fortune-trend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '获取运势走势分析',
    description: '分析未来几年的运势走势和关键节点'
  })
  @ApiSuccessResponse(FortuneTrend, '运势走势分析生成成功')
  async getFortuneTrend(
    @Body() dto: CalculateZiweiDto
  ): Promise<FortuneTrend> {
    return this.aiAnalysisService.getFortuneTrend(dto);
  }
}