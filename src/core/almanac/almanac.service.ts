import { Injectable, Logger } from '@nestjs/common';
import { Tyme4tsService } from '../../services/tyme4ts/tyme4ts.service';
import { 
  AlmanacResult, 
  LuckyDayResult, 
  SolarTermResult,
  SuitabilityItems,
  AlmanacDirection,
  ZodiacInfo
} from '../../shared/types/almanac.types';
import { Solar, Lunar, JieQi, LunarMonth, Term } from 'tyme4ts';

@Injectable()
export class AlmanacService {
  private readonly logger = new Logger(AlmanacService.name);
  private readonly SOLAR_TERMS = [
    '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
    '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
    '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
  ];
  
  constructor(private readonly tyme4tsService: Tyme4tsService) {}

  /**
   * 获取指定日期的黄历信息
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @returns 黄历查询结果
   */
  async getDailyAlmanac(dateStr: string): Promise<AlmanacResult> {
    try {
      this.logger.log(`查询黄历信息: ${dateStr}`);
      const [year, month, day] = dateStr.split('-').map(Number);
      const solar = Solar.fromYmd(year, month, day);
      const lunar = solar.getLunar();
      
      // 获取基础信息
      const ganzhiDate = this.tyme4tsService.getGanzhiDate(lunar);
      const zodiac = this.getZodiacInfo(lunar);
      const suitability = this.getSuitabilityItems(lunar);
      const directions = this.getAuspiciousDirections(lunar);
      const constellation = this.tyme4tsService.getConstellation(month, day);
      const festival = this.getFestivals(solar, lunar);
      const jieqi = this.getJieQi(solar);
      
      // 获取彭祖百忌
      const pengZuBaiJi = this.tyme4tsService.getPengZuBaiJi(ganzhiDate.dayGan, ganzhiDate.dayZhi);
      
      // 获取神煞信息
      const gods = this.tyme4tsService.getDayGods(lunar);
      
      return {
        date: {
          solar: {
            year: solar.getYear(),
            month: solar.getMonth(),
            day: solar.getDay(),
            week: solar.getWeek()
          },
          lunar: {
            year: lunar.getYear(),
            month: lunar.getMonth(),
            day: lunar.getDay(),
            leap: lunar.isLeap(),
            monthName: lunar.getMonthInChinese(),
            dayName: lunar.getDayInChinese()
          },
          ganzhi: ganzhiDate
        },
        zodiac,
        constellation,
        jieqi,
        festival,
        suitability,
        directions,
        pengZuBaiJi,
        gods,
        // 十二建除
        twelveBuildings: this.tyme4tsService.getTwelveBuildings(lunar),
        // 二十八星宿
        lunarMansion: this.tyme4tsService.getLunarMansion(lunar)
      };
    } catch (error) {
      this.logger.error('黄历信息查询失败', error.stack);
      throw new Error(`黄历查询失败: ${error.message}`);
    }
  }
  
  /**
   * 获取指定月份的黄道吉日
   * @param year 年份
   * @param month 月份
   * @returns 黄道吉日查询结果
   */
  async getLuckyDays(year: number, month: number): Promise<LuckyDayResult> {
    try {
      this.logger.log(`查询${year}年${month}月黄道吉日`);
      const luckyDays = [];
      const solarMonth = Solar.fromYmd(year, month, 1);
      const daysInMonth = solarMonth.getSolarMonth().length();
      
      // 遍历当月所有日期
      for (let day = 1; day <= daysInMonth; day++) {
        const solar = Solar.fromYmd(year, month, day);
        const lunar = solar.getLunar();
        
        // 判断是否为黄道吉日
        const isLuckyDay = this.isLuckyDay(lunar);
        if (isLuckyDay) {
          // 获取适宜事项
          const suitability = this.getSuitabilityItems(lunar);
          
          luckyDays.push({
            date: solar.toYmd(),
            lunarDate: `${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`,
            ganzhi: this.tyme4tsService.getGanzhiDate(lunar).dayGan + this.tyme4tsService.getGanzhiDate(lunar).dayZhi,
            suitable: suitability.suitable,
            // 黄道吉日类型
            luckyType: this.getLuckyDayType(lunar)
          });
        }
      }
      
      return {
        year,
        month,
        count: luckyDays.length,
        days: luckyDays
      };
    } catch (error) {
      this.logger.error('黄道吉日查询失败', error.stack);
      throw new Error(`黄道吉日查询失败: ${error.message}`);
    }
  }
  
  /**
   * 获取指定年份的节气信息
   * @param year 年份
   * @returns 节气信息查询结果
   */
  async getSolarTerms(year: number): Promise<SolarTermResult> {
    try {
      this.logger.log(`查询${year}年节气信息`);
      const terms: Array<{
        name: string;
        date: string;
        time: string;
        description: string;
        customs: string[];
      }> = [];
      
      // 获取全年24节气
      for (let i = 0; i < 24; i++) {
        const jieqi = JieQi.fromYearTerm(year, i + 1);
        const solar = jieqi.getSolar();
        
        terms.push({
          name: this.SOLAR_TERMS[i],
          date: solar.toYmd(),
          time: solar.toHms(),
          description: this.getSolarTermDescription(this.SOLAR_TERMS[i]),
          customs: this.getSolarTermCustoms(this.SOLAR_TERMS[i])
        });
      }
      
      return {
        year,
        terms,
        springStart: terms.find(t => t.name === '立春')?.date,
        summerStart: terms.find(t => t.name === '立夏')?.date,
        autumnStart: terms.find(t => t.name === '立秋')?.date,
        winterStart: terms.find(t => t.name === '立冬')?.date
      };
    } catch (error) {
      this.logger.error('节气信息查询失败', error.stack);
      throw new Error(`节气查询失败: ${error.message}`);
    }
  }
  
  /**
   * 获取指定日期的宜忌事项
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   * @returns 宜忌事项查询结果
   */
  async getSuitableAvoid(dateStr: string): Promise<{
    suitable: string[];
    avoid: string[];
    date: string;
  }> {
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    const suitability = this.getSuitabilityItems(lunar);
    
    return {
      date: dateStr,
      ...suitability
    };
  }
  
  /**
   * 判断日期是否为黄道吉日
   * @param lunar 农历日期对象
   * @returns 是否为黄道吉日
   */
  private isLuckyDay(lunar: Lunar): boolean {
    const twelveBuildings = this.tyme4tsService.getTwelveBuildings(lunar);
    // 黄道吉日对应的十二建除为：除、危、定、执、成、开
    const luckyBuildings = ['除', '危', '定', '执', '成', '开'];
    return luckyBuildings.includes(twelveBuildings);
  }
  
  /**
   * 获取黄道吉日类型
   * @param lunar 农历日期对象
   * @returns 黄道吉日类型
   */
  private getLuckyDayType(lunar: Lunar): string {
    const twelveBuildings = this.tyme4tsService.getTwelveBuildings(lunar);
    const typeMap: Record<string, string> = {
      '除': '除日：为除旧布新之象，宜除服、疗病、出行、嫁娶',
      '危': '危日：为危险之意，宜祈福、安床、纳财，忌登高、行船',
      '定': '定日：为安定之意，宜订婚、嫁娶、开业、安葬',
      '执': '执日：为固执之意，宜捕捉、诉讼、嫁娶、纳财',
      '成': '成日：为成功之意，宜开业、结婚、入学、安葬',
      '开': '开日：为开始之意，宜开业、结婚、入学、旅行'
    };
    return typeMap[twelveBuildings] || '黄道吉日';
  }
  
  /**
   * 获取宜忌事项
   * @param lunar 农历日期对象
   * @returns 宜忌事项对象
   */
  private getSuitabilityItems(lunar: Lunar): SuitabilityItems {
    // 从农历对象获取宜忌信息
    const day = lunar.getDay();
    const month = lunar.getMonth();
    
    // 这里使用模拟数据，实际应用中应根据黄历规则计算
    // 真实实现需参考黄历宜忌算法
    const suitable = [
      '祭祀', '祈福', '求嗣', '开光', '出行', 
      '解除', '伐木', '入宅', '移徙', '安床'
    ];
    
    const avoid = [
      '嫁娶', '安葬', '破土', '修坟', '纳畜'
    ];
    
    // 根据月份和日期调整宜忌事项
    if (month === 1 && day === 1) {
      suitable.push('开业', '剪彩', '纳财');
    }
    
    return { suitable, avoid };
  }
  
  /**
   * 获取吉祥方位
   * @param lunar 农历日期对象
   * @returns 方位信息对象
   */
  private getAuspiciousDirections(lunar: Lunar): AlmanacDirection {
    // 模拟数据，实际应根据黄历规则计算
    const ganzhi = this.tyme4tsService.getGanzhiDate(lunar);
    const directions = {
      auspicious: ['东北', '正南'],
      inauspicious: ['西北', '正东'],
     财神: '正北',
     喜神: '东南',
     贵神: '西南'
    };
    
    return directions;
  }
  
  /**
   * 获取生肖信息
   * @param lunar 农历日期对象
   * @returns 生肖信息对象
   */
  private getZodiacInfo(lunar: Lunar): ZodiacInfo {
    const yearZodiac = this.tyme4tsService.getChineseZodiac(lunar.getYear());
    const dayZodiac = this.tyme4tsService.getDayZodiac(lunar);
    
    return {
      year: yearZodiac,
      day: dayZodiac,
      yearGanzhi: `${lunar.getYearInGanzhi()}年`,
      yearShengxiao: `${yearZodiac}年`
    };
  }
  
  /**
   * 获取节气信息
   * @param solar 公历日期对象
   * @returns 节气信息或null
   */
  private getJieQi(solar: Solar): {name: string, date: string} | null {
    const jieqi = JieQi.fromSolar(solar);
    if (jieqi) {
      return {
        name: jieqi.getName(),
        date: jieqi.getSolar().toYmd()
      };
    }
    return null;
  }
  
  /**
   * 获取节日信息
   * @param solar 公历日期对象
   * @param lunar 农历日期对象
   * @returns 节日名称数组
   */
  private getFestivals(solar: Solar, lunar: Lunar): string[] {
    const festivals = [];
    
    // 公历节日
    const solarFestivals = this.tyme4tsService.getSolarFestivals(solar);
    if (solarFestivals.length > 0) {
      festivals.push(...solarFestivals);
    }
    
    // 农历节日
    const lunarFestivals = this.tyme4tsService.getLunarFestivals(lunar);
    if (lunarFestivals.length > 0) {
      festivals.push(...lunarFestivals);
    }
    
    return festivals;
  }
  
  /**
   * 获取节气描述
   * @param termName 节气名称
   * @returns 节气描述
   */
  private getSolarTermDescription(termName: string): string {
    const descriptions: Record<string, string> = {
      '立春': '立春是二十四节气之首，标志着万物复苏的春季开始。',
      '雨水': '雨水节气意味着降雨开始，雨量渐增。',
      '惊蛰': '惊蛰时节，春雷始鸣，惊醒蛰伏于地下越冬的蛰虫。',
      '春分': '春分这天昼夜平分，此后北半球白天渐长，夜晚渐短。',
      '清明': '清明既是节气又是节日，有扫墓祭祖、踏青郊游的习俗。',
      '谷雨': '谷雨是春季最后一个节气，此时降水明显增加，有利于谷物生长。',
      '立夏': '立夏标志着夏季的开始，万物进入生长旺季。',
      '小满': '小满时节，夏熟作物的籽粒开始灌浆饱满，但尚未成熟。',
      '芒种': '芒种是夏季的第三个节气，此时正是南方种稻与北方收麦之时。',
      '夏至': '夏至是北半球白昼最长、黑夜最短的一天。',
      '小暑': '小暑表示夏季炎热天气的开始，但还未达到最热。',
      '大暑': '大暑是一年中最热的节气，高温酷热，雷暴频繁。',
      '立秋': '立秋标志着秋季的开始，暑去凉来。',
      '处暑': '处暑意味着炎热即将过去，暑气逐渐消退。',
      '白露': '白露时节，昼夜温差加大，空气中的水汽凝结成白露。',
      '秋分': '秋分这天昼夜平分，此后北半球白天渐短，夜晚渐长。',
      '寒露': '寒露时节，气温比白露时更低，地面的露水更冷，快要凝结成霜了。',
      '霜降': '霜降是秋季的最后一个节气，意味着天气渐冷，开始有霜。',
      '立冬': '立冬标志着冬季的开始，万物收藏，规避寒冷。',
      '小雪': '小雪时节，气温下降，开始降雪，但雪量较小。',
      '大雪': '大雪时节，雪量增大，气温显著下降。',
      '冬至': '冬至是北半球白昼最短、黑夜最长的一天，此后白昼渐长。',
      '小寒': '小寒是天气寒冷但还没有到极点的意思。',
      '大寒': '大寒是一年中最冷的节气，寒潮南下频繁，气温极低。'
    };
    
    return descriptions[termName] || `${termName}是二十四节气之一。`;
  }
  
  /**
   * 获取节气习俗
   * @param termName 节气名称
   * @returns 习俗数组
   */
  private getSolarTermCustoms(termName: string): string[] {
    const customs: Record<string, string[]> = {
      '立春': ['迎春', '打春', '咬春'],
      '清明': ['扫墓祭祖', '踏青', '插柳', '放风筝'],
      '冬至': ['吃饺子', '吃汤圆', '祭祖'],
      '腊八': ['喝腊八粥', '腌腊八蒜'],
      '小年': ['扫尘', '祭灶']
    };
    
    return customs[termName] || [];
  }
}