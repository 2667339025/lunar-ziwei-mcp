import { Injectable, Logger } from '@nestjs/common';
import { IztroService } from '../../services/iztro/iztro.service';
import { Tyme4tsService } from '../../services/tyme4ts/tyme4ts.service';
import { CalculateZiweiDto } from '../../api/dto/ziwei.dto';
import { 
  ZiweiChartResult, 
  Palace, 
  LuckPeriod, 
  FourPillars,
  StarInfo,
  TransformationInfo
} from '../../shared/types/ziwei.types';
import { Solar, Lunar } from 'tyme4ts';

@Injectable()
export class ZiweiService {
  private readonly logger = new Logger(ZiweiService.name);
  
  constructor(
    private readonly iztroService: IztroService,
    private readonly tyme4tsService: Tyme4tsService
  ) {}

  /**
   * 计算紫微斗数星盘
   * @param dto 包含出生信息的数据传输对象
   * @returns 完整的紫微斗数星盘结果
   */
  async calculateZiweiChart(dto: CalculateZiweiDto): Promise<ZiweiChartResult> {
    try {
      this.logger.log(`开始计算紫微斗数星盘: ${JSON.stringify(dto)}`);
      
      // 1. 将输入日期转换为农历
      const lunarDate = this.convertToLunarDate(dto.birthDate, dto.dateType);
      
      // 2. 计算四柱八字
      const fourPillars = this.calculateFourPillars(
        lunarDate, 
        dto.birthTime, 
        dto.birthPlace
      );
      
      // 3. 获取生肖和星座
      const zodiac = this.tyme4tsService.getChineseZodiac(lunarDate.getYear());
      const constellation = this.tyme4tsService.getConstellation(
        parseInt(dto.birthDate.split('-')[1]), 
        parseInt(dto.birthDate.split('-')[2])
      );
      
      // 4. 使用iztro计算紫微斗数星盘
      const ziweiData = this.iztroService.calculateZiweiChart({
        year: lunarDate.getYear(),
        month: lunarDate.getMonth(),
        day: lunarDate.getDay(),
        hour: parseInt(dto.birthTime.split(':')[0]),
        minute: parseInt(dto.birthTime.split(':')[1] || '0'),
        gender: dto.gender === 'male' ? 'man' : 'woman'
      });
      
      // 5. 计算运限数据（大限、小限、流年等）
      const luckPeriods = this.generateLuckPeriods(
        lunarDate, 
        dto.gender, 
        ziweiData.palaces
      );
      
      // 6. 整理星耀信息
      const starsInfo = this.organizeStarInfo(ziweiData.palaces);
      
      // 7. 计算四化信息
      const transformations = this.calculateTransformations(fourPillars, ziweiData.palaces);
      
      // 8. 整合结果并返回
      const result: ZiweiChartResult = {
        zodiac,
        constellation,
        fourPillars,
        palaces: ziweiData.palaces.map(palace => ({
          name: palace.name,
          position: palace.position,
          stars: palace.stars,
          isVoid: palace.stars.length === 0,
          // 添加宫位的其他属性
          direction: this.getPalaceDirection(palace.position),
          significance: this.getPalaceSignificance(palace.name)
        })),
        luckPeriods,
        starsInfo,
        transformations,
        calculationTime: new Date().toISOString()
      };
      
      this.logger.log('紫微斗数星盘计算完成');
      return result;
    } catch (error) {
      this.logger.error('紫微斗数星盘计算失败', error.stack);
      throw new Error(`星盘计算失败: ${error.message}`);
    }
  }
  
  /**
   * 将输入日期转换为农历日期
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @param dateType 日期类型 (solar/lunar)
   * @returns 农历日期对象
   */
  private convertToLunarDate(dateStr: string, dateType: string): Lunar {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (dateType === 'solar') {
      return Solar.fromYmd(year, month, day).getLunar();
    } else {
      return Lunar.fromYmd(year, month, day);
    }
  }
  
  /**
   * 计算四柱八字
   * @param lunarDate 农历日期
   * @param birthTime 出生时间 (HH:MM)
   * @param birthPlace 出生地点
   * @returns 四柱八字信息
   */
  private calculateFourPillars(lunarDate: Lunar, birthTime: string, birthPlace: string): FourPillars {
    // 使用tyme4ts计算四柱
    const hour = parseInt(birthTime.split(':')[0]);
    const minute = parseInt(birthTime.split(':')[1] || '0');
    
    return this.tyme4tsService.calculateFourPillars(
      lunarDate.getYear(),
      lunarDate.getMonth(),
      lunarDate.getDay(),
      hour,
      minute,
      birthPlace
    );
  }
  
  /**
   * 生成运限数据（大限、小限、流年等）
   * @param lunarDate 农历出生日期
   * @param gender 性别
   * @param palaces 宫位信息
   * @returns 运限数据对象
   */
  private generateLuckPeriods(lunarDate: Lunar, gender: string, palaces: Palace[]): {
    major: LuckPeriod[];
    minor: LuckPeriod;
    annual: LuckPeriod;
    monthly: LuckPeriod;
    daily: LuckPeriod;
    hourly: LuckPeriod;
  } {
    // 计算当前年份
    const currentYear = new Date().getFullYear();
    const birthYear = lunarDate.getYear();
    const age = currentYear - birthYear;
    
    // 计算大限
    const majorPeriods = this.iztroService.calculateMajorPeriods(
      lunarDate, 
      gender === 'male' ? 'man' : 'woman'
    );
    
    // 计算当前大限
    const currentMajor = majorPeriods.find(period => 
      age >= period.startAge && age < period.endAge
    ) || majorPeriods[0];
    
    // 计算小限
    const minorPeriod = this.iztroService.calculateMinorPeriod(
      lunarDate, 
      gender === 'male' ? 'man' : 'woman',
      currentYear
    );
    
    // 计算流年
    const annualPeriod = this.iztroService.calculateAnnualPeriod(
      lunarDate, 
      currentYear,
      palaces
    );
    
    // 计算流月
    const monthlyPeriod = this.iztroService.calculateMonthlyPeriod(
      lunarDate, 
      currentYear,
      new Date().getMonth() + 1,
      palaces
    );
    
    // 计算流日
    const dailyPeriod = this.iztroService.calculateDailyPeriod(
      lunarDate, 
      new Date(),
      palaces
    );
    
    // 计算流时
    const hourlyPeriod = this.iztroService.calculateHourlyPeriod(
      lunarDate, 
      new Date(),
      palaces
    );
    
    return {
      major: majorPeriods,
      minor: minorPeriod,
      annual: annualPeriod,
      monthly: monthlyPeriod,
      daily: dailyPeriod,
      hourly: hourlyPeriod
    };
  }
  
  /**
   * 组织星耀信息
   * @param palaces 宫位信息数组
   * @returns 星耀信息对象
   */
  private organizeStarInfo(palaces: Palace[]): StarInfo {
    const mainStars: Record<string, string[]> = {};
    const luckyStars: Record<string, string[]> = {};
    const evilStars: Record<string, string[]> = {};
    
    palaces.forEach(palace => {
      palace.stars.forEach(star => {
        // 分类主星、吉星、凶星
        if (this.iztroService.isMainStar(star)) {
          mainStars[palace.name] = [...(mainStars[palace.name] || []), star];
        } else if (this.iztroService.isLuckyStar(star)) {
          luckyStars[palace.name] = [...(luckyStars[palace.name] || []), star];
        } else if (this.iztroService.isEvilStar(star)) {
          evilStars[palace.name] = [...(evilStars[palace.name] || []), star];
        }
      });
    });
    
    return {
      mainStars,
      luckyStars,
      evilStars,
      // 获取关键星耀所在宫位
      keyStarsLocation: this.iztroService.getKeyStarsLocation(palaces)
    };
  }
  
  /**
   * 计算四化信息
   * @param fourPillars 四柱八字
   * @param palaces 宫位信息
   * @returns 四化信息对象
   */
  private calculateTransformations(fourPillars: FourPillars, palaces: Palace[]): TransformationInfo {
    // 根据年干计算四化
    const yearStemTransformations = this.iztroService.getTransformationsByStem(fourPillars.year.stem);
    
    // 根据日干计算四化
    const dayStemTransformations = this.iztroService.getTransformationsByStem(fourPillars.day.stem);
    
    // 找出四化星所在宫位
    const transformationPalaces = this.iztroService.findTransformationPalaces(
      [...yearStemTransformations, ...dayStemTransformations],
      palaces
    );
    
    return {
      yearStem: {
        stem: fourPillars.year.stem,
        transformations: yearStemTransformations
      },
      dayStem: {
        stem: fourPillars.day.stem,
        transformations: dayStemTransformations
      },
      palaces: transformationPalaces
    };
  }
  
  /**
   * 获取指定宫位的三方四正宫位
   * @param palaceName 宫位名称
   * @returns 三方四正宫位信息
   */
  async getTripleSquarePalaces(palaceName: string): Promise<{
    originalPalace: string;
    triplePalaces: string[];
    squarePalaces: string[];
    allRelatedPalaces: string[];
  }> {
    return this.iztroService.getTripleSquarePalaces(palaceName);
  }
  
  /**
   * 判断指定宫位是否存在四化
   * @param palaceName 宫位名称
   * @param transformationType 四化类型
   * @returns 判断结果
   */
  async checkPalaceTransformation(
    palaceName: string,
    transformationType: 'huaquan' | 'huake' | 'huaxing' | 'huaji'
  ): Promise<{
    exists: boolean;
    details: Array<{
      palace: string;
      star: string;
      transformation: string;
    }>;
  }> {
    // 获取宫位三方四正
    const { allRelatedPalaces } = await this.getTripleSquarePalaces(palaceName);
    
    // 模拟获取当前星盘数据（实际应用中应从缓存或重新计算获取）
    // 这里简化处理，实际应传入具体的星盘数据
    const mockPalaces = [
      { name: '命宫', stars: ['紫微', '天府'] },
      { name: '兄弟宫', stars: ['天机'] },
      { name: '夫妻宫', stars: ['太阳', '太阴'] },
      // ...其他宫位
    ];
    
    // 检查这些宫位中是否存在指定类型的四化
    const details = [];
    for (const palace of mockPalaces) {
      if (allRelatedPalaces.includes(palace.name)) {
        for (const star of palace.stars) {
          const transformation = this.iztroService.getStarTransformation(star);
          if (transformation && transformation.type === transformationType) {
            details.push({
              palace: palace.name,
              star,
              transformation: transformation.name
            });
          }
        }
      }
    }
    
    return {
      exists: details.length > 0,
      details
    };
  }
  
  /**
   * 获取宫位方位
   * @param position 宫位位置（1-12）
   * @returns 方位描述
   */
  private getPalaceDirection(position: number): string {
    const directions = ['正北', '东北', '正东', '东南', '正南', '西南', '正西', '西北'];
    return directions[(position - 1) % 8] || '未知';
  }
  
  /**
   * 获取宫位意义
   * @param palaceName 宫位名称
   * @returns 宫位意义描述
   */
  private getPalaceSignificance(palaceName: string): string {
    const significanceMap: Record<string, string> = {
      '命宫': '代表个人性格、先天运势、整体命运',
      '兄弟宫': '代表兄弟姐妹、朋友、合作伙伴关系',
      '夫妻宫': '代表婚姻、配偶、感情关系',
      '子女宫': '代表子女、晚辈、创造力',
      '财帛宫': '代表财富、收入、理财能力',
      '疾厄宫': '代表健康、疾病、体质',
      '迁移宫': '代表外出、旅行、人际关系',
      '交友宫': '代表朋友、同事、社交圈',
      '官禄宫': '代表事业、工作、职业发展',
      '田宅宫': '代表房产、家庭、祖业',
      '福德宫': '代表福气、精神生活、兴趣爱好',
      '父母宫': '代表父母、长辈、上司'
    };
    
    return significanceMap[palaceName] || '未知宫位';
  }
}