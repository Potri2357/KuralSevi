export interface TradeDemandItem {
  name: string;
  count: number;
  fill: string;
}

export interface EmploymentSplitItem {
  name: string;
  value: number;
  fill: string;
}

export interface SkillGapItem {
  skill: string;
  count: number;
}

export interface MonthlyTrendItem {
  month: string;
  cases: number;
  completed: number;
}

export interface PlanningInsight {
  icon: string;
  title: string;
  body: string;
  urgency: 'indigo' | 'emerald' | 'amber';
}

export interface PlanningMetricsData {
  totalBeneficiaries: number;
  completedProfiles: number;
  mobilityConstraints: number;
  midInterviewDropoffs: number;
  topTrades: TradeDemandItem[];
  employmentSplit: EmploymentSplitItem[];
  skillGaps: SkillGapItem[];
  monthlyTrend: MonthlyTrendItem[];
  insights: PlanningInsight[];
}
