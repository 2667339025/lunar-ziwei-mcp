import { Module } from '@nestjs/common';
import { ZiweiController } from './api/controllers/ziwei.controller';
import { AlmanacController } from './api/controllers/almanac.controller';
import { AiAnalysisController } from './api/controllers/ai-analysis.controller';
import { ZiweiService } from './core/ziwei/ziwei.service';
import { AlmanacService } from './core/almanac/almanac.service';
import { AiAnalysisService } from './core/ai/ai-analysis.service';
import { Tyme4tsService } from './services/tyme4ts/tyme4ts.service';
import { IztroService } from './services/iztro/iztro.service';
import { ConfigModule } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ZiweiController, AlmanacController, AiAnalysisController],
  providers: [ZiweiService, AlmanacService, AiAnalysisService, Tyme4tsService, IztroService],
})
export class AppModule {
  /**
   * 配置Swagger文档
   * @param app NestJS应用实例
   */
  static configureSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('智能紫微斗数助手API')
      .setDescription('紫微斗数、黄历查询及命理分析API接口文档')
      .setVersion('1.0')
      .addTag('ziwei', '紫微斗数相关接口')
      .addTag('almanac', '黄历查询相关接口')
      .addTag('ai-analysis', 'AI命理分析相关接口')
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
}