/**
 * Economics and Finance Types
 * For economic analysis, portfolio management, and financial data
 */

import { BaseEntity, TimestampedEntity, TaggableEntity } from '../common/base.js';

/**
 * Asset types and classifications
 */
export type AssetClass = 
  | 'stocks'
  | 'bonds'
  | 'commodities'
  | 'crypto'
  | 'real_estate'
  | 'derivatives'
  | 'cash'
  | 'alternative';

export type AssetType = 
  | 'equity'
  | 'fixed_income'
  | 'commodity'
  | 'cryptocurrency'
  | 'reit'
  | 'etf'
  | 'mutual_fund'
  | 'option'
  | 'future'
  | 'forex';

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export type InvestmentObjective = 
  | 'growth'
  | 'income'
  | 'capital_preservation'
  | 'speculation'
  | 'hedging'
  | 'diversification';

/**
 * Financial Asset Information
 */
export interface Asset extends BaseEntity, TaggableEntity {
  symbol: string;
  name: string;
  description?: string;
  assetClass: AssetClass;
  assetType: AssetType;
  sector?: string;
  industry?: string;
  exchange: string;
  currency: string;
  country?: string;
  marketCap?: number;
  volume?: number;
  riskLevel: RiskLevel;
  dividendYield?: number;
  peRatio?: number;
  betaCoefficient?: number;
  metadata?: Record<string, any>;
  active: boolean;
}

/**
 * Market Data and Pricing
 */
export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  bidPrice?: number;
  askPrice?: number;
  spread?: number;
}

export interface PriceHistory {
  symbol: string;
  timeframe: Timeframe;
  data: MarketData[];
  lastUpdated: Date;
}

export type Timeframe = 
  | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M' | '1y';

/**
 * Portfolio Management
 */
export interface Portfolio extends BaseEntity, TimestampedEntity {
  name: string;
  description?: string;
  userId: string;
  currency: string;
  initialValue: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn?: number;
  dailyReturnPercent?: number;
  positions: Position[];
  cash: number;
  benchmark?: string;
  objective: InvestmentObjective;
  riskProfile: RiskProfile;
  rebalanceFrequency?: RebalanceFrequency;
  lastRebalanced?: Date;
  active: boolean;
}

export interface Position {
  id: string;
  portfolioId: string;
  assetId: string;
  asset: Asset;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  realizedGainLoss?: number;
  allocation: number; // Percentage of portfolio
  targetAllocation?: number;
  openDate: Date;
  lastUpdated: Date;
  transactions: Transaction[];
}

export interface Transaction extends BaseEntity {
  portfolioId: string;
  positionId?: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  amount: number;
  fees?: number;
  taxes?: number;
  netAmount: number;
  currency: string;
  executedAt: Date;
  settledAt?: Date;
  notes?: string;
  brokerage?: string;
  orderId?: string;
}

export type TransactionType = 
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'deposit'
  | 'withdrawal'
  | 'fee'
  | 'split'
  | 'merger';

export type RebalanceFrequency = 
  | 'never'
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually'
  | 'when_threshold_exceeded';

/**
 * Risk Management
 */
export interface RiskProfile {
  tolerance: RiskLevel;
  capacity: RiskLevel;
  timeHorizon: TimeHorizon;
  liquidityNeeds: LiquidityLevel;
  experienceLevel: ExperienceLevel;
  objectives: InvestmentObjective[];
  constraints?: string[];
}

export type TimeHorizon = 
  | 'short_term'    // < 2 years
  | 'medium_term'   // 2-10 years
  | 'long_term';    // > 10 years

export type LiquidityLevel = 'high' | 'medium' | 'low';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface RiskMetrics {
  portfolioId: string;
  period: string;
  volatility: number;
  sharpeRatio: number;
  sortino_ratio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  var95: number; // Value at Risk 95%
  cvar95: number; // Conditional Value at Risk 95%
  calmarRatio: number;
  informationRatio?: number;
  trackingError?: number;
  calculatedAt: Date;
}

/**
 * Economic Indicators
 */
export interface EconomicIndicator extends BaseEntity {
  name: string;
  symbol: string;
  description: string;
  category: IndicatorCategory;
  country: string;
  frequency: DataFrequency;
  unit: string;
  seasonal_adjusted: boolean;
  sourceAgency: string;
  releaseSchedule?: string;
  importance: IndicatorImportance;
  currentValue?: number;
  previousValue?: number;
  forecast?: number;
  historicalData: IndicatorData[];
}

export interface IndicatorData {
  date: string;
  value: number;
  isRevised?: boolean;
  isPreliminary?: boolean;
}

export type IndicatorCategory = 
  | 'gdp'
  | 'inflation'
  | 'employment'
  | 'interest_rates'
  | 'trade'
  | 'monetary'
  | 'fiscal'
  | 'sentiment'
  | 'housing'
  | 'manufacturing'
  | 'services';

export type DataFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export type IndicatorImportance = 'low' | 'medium' | 'high' | 'critical';

/**
 * Market Analysis
 */
export interface MarketAnalysis extends BaseEntity {
  title: string;
  summary: string;
  content: string;
  author: string;
  analysisType: AnalysisType;
  assets: string[]; // Asset symbols
  sectors?: string[];
  timeHorizon: TimeHorizon;
  rating?: AnalysisRating;
  priceTargets?: PriceTarget[];
  keyPoints: string[];
  riskFactors: string[];
  confidence: number; // 0-100
  methodology?: string;
  sources?: string[];
  publishedAt: Date;
  validUntil?: Date;
  featured: boolean;
}

export type AnalysisType = 
  | 'fundamental'
  | 'technical'
  | 'quantitative'
  | 'macro'
  | 'sector'
  | 'thematic'
  | 'event_driven';

export type AnalysisRating = 
  | 'strong_buy'
  | 'buy'
  | 'hold'
  | 'sell'
  | 'strong_sell';

export interface PriceTarget {
  type: 'target' | 'support' | 'resistance';
  price: number;
  timeframe: string;
  probability?: number;
}

/**
 * Trading and Orders
 */
export interface Order extends BaseEntity {
  portfolioId: string;
  assetId: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopPrice?: number;
  limitPrice?: number;
  timeInForce: TimeInForce;
  status: OrderStatus;
  filledQuantity: number;
  averageFillPrice?: number;
  fees?: number;
  placedAt: Date;
  filledAt?: Date;
  cancelledAt?: Date;
  expiresAt?: Date;
  brokerOrderId?: string;
  notes?: string;
}

export type OrderType = 
  | 'market'
  | 'limit'
  | 'stop'
  | 'stop_limit'
  | 'trailing_stop'
  | 'iceberg';

export type OrderSide = 'buy' | 'sell';

export type TimeInForce = 
  | 'day'
  | 'gtc'     // Good Till Cancelled
  | 'ioc'     // Immediate or Cancel
  | 'fok'     // Fill or Kill
  | 'gtd';    // Good Till Date

export type OrderStatus = 
  | 'pending'
  | 'open'
  | 'partial_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

/**
 * Financial Planning
 */
export interface FinancialGoal extends BaseEntity {
  name: string;
  description: string;
  userId: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: GoalPriority;
  riskTolerance: RiskLevel;
  timeHorizon: TimeHorizon;
  monthlyContribution?: number;
  expectedReturn: number;
  inflationRate: number;
  status: GoalStatus;
  milestones: GoalMilestone[];
  linkedPortfolios: string[];
  progress: number; // 0-100
}

export type GoalType = 
  | 'retirement'
  | 'emergency_fund'
  | 'home_purchase'
  | 'education'
  | 'vacation'
  | 'debt_payoff'
  | 'wealth_building'
  | 'income_replacement'
  | 'legacy';

export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export type GoalStatus = 
  | 'not_started'
  | 'in_progress'
  | 'on_track'
  | 'behind'
  | 'ahead'
  | 'achieved'
  | 'abandoned';

export interface GoalMilestone {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date;
  achieved: boolean;
  achievedAt?: Date;
}

/**
 * Economic Events and Calendar
 */
export interface EconomicEvent extends BaseEntity {
  name: string;
  description: string;
  country: string;
  category: IndicatorCategory;
  importance: IndicatorImportance;
  currency: string;
  scheduledAt: Date;
  actualValue?: number;
  forecastValue?: number;
  previousValue?: number;
  unit?: string;
  impact: MarketImpact;
  volatilityExpected: boolean;
  affectedAssets: string[];
  sourceUrl?: string;
}

export type MarketImpact = 'bearish' | 'somewhat_bearish' | 'neutral' | 'somewhat_bullish' | 'bullish';

/**
 * Financial News and Sentiment
 */
export interface FinancialNews extends BaseEntity, TaggableEntity {
  headline: string;
  summary: string;
  content?: string;
  source: string;
  author?: string;
  publishedAt: Date;
  category: NewsCategory;
  sentiment: NewsSentiment;
  sentimentScore: number; // -1 to 1
  relevanceScore: number; // 0 to 1
  affectedSymbols: string[];
  affectedSectors: string[];
  url?: string;
  imageUrl?: string;
  featured: boolean;
}

export type NewsCategory = 
  | 'breaking'
  | 'earnings'
  | 'ipo'
  | 'merger'
  | 'regulation'
  | 'economic_data'
  | 'central_bank'
  | 'geopolitical'
  | 'technology'
  | 'commodity'
  | 'crypto'
  | 'opinion';

export type NewsSentiment = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

/**
 * Watchlists and Alerts
 */
export interface Watchlist extends BaseEntity {
  name: string;
  description?: string;
  userId: string;
  symbols: string[];
  isPublic: boolean;
  category?: string;
  alerts: PriceAlert[];
  performance?: WatchlistPerformance;
}

export interface PriceAlert extends BaseEntity {
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice?: number;
  message?: string;
  active: boolean;
  triggered: boolean;
  triggeredAt?: Date;
  expiresAt?: Date;
  notificationChannels: string[];
}

export type AlertCondition = 
  | 'price_above'
  | 'price_below'
  | 'price_change_percent'
  | 'volume_spike'
  | 'technical_indicator';

export interface WatchlistPerformance {
  watchlistId: string;
  period: string;
  totalReturn: number;
  totalReturnPercent: number;
  bestPerformer: string;
  worstPerformer: string;
  avgReturn: number;
  volatility: number;
  calculatedAt: Date;
}

/**
 * Research and Screening
 */
export interface ScreeningCriteria {
  assetClasses: AssetClass[];
  sectors?: string[];
  countries?: string[];
  marketCapRange?: [number, number];
  priceRange?: [number, number];
  volumeMin?: number;
  peRatioRange?: [number, number];
  dividendYieldMin?: number;
  betaRange?: [number, number];
  riskLevels?: RiskLevel[];
  customFilters?: ScreeningFilter[];
}

export interface ScreeningFilter {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  value2?: any; // For 'between' operator
}

export interface ScreeningResult {
  criteria: ScreeningCriteria;
  results: Asset[];
  totalResults: number;
  executedAt: Date;
  executionTimeMs: number;
}

/**
 * Backtesting and Strategy
 */
export interface TradingStrategy extends BaseEntity {
  name: string;
  description: string;
  type: StrategyType;
  parameters: Record<string, any>;
  rules: TradingRule[];
  riskManagement: RiskManagementRules;
  universe: string[]; // Asset symbols or criteria
  benchmark: string;
  active: boolean;
  backtests: BacktestResult[];
}

export type StrategyType = 
  | 'trend_following'
  | 'mean_reversion'
  | 'momentum'
  | 'value'
  | 'growth'
  | 'arbitrage'
  | 'pairs_trading'
  | 'market_neutral'
  | 'custom';

export interface TradingRule {
  id: string;
  type: 'entry' | 'exit' | 'position_sizing' | 'filter';
  condition: string;
  action: string;
  parameters?: Record<string, any>;
  active: boolean;
}

export interface RiskManagementRules {
  maxPositionSize: number; // Percentage
  maxDailyLoss: number;
  maxDrawdown: number;
  stopLoss?: number;
  takeProfit?: number;
  positionTimeout?: number; // Days
}

export interface BacktestResult extends BaseEntity {
  strategyId: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  trades: BacktestTrade[];
  performance: PerformanceMetrics;
  executedAt: Date;
}

export interface BacktestTrade {
  symbol: string;
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  duration: number; // Days
  fees: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  avgTradeDuration: number;
  calmarRatio: number;
  sortinoRatio: number;
  beta: number;
  alpha: number;
}

/**
 * Economic Calendar Events
 */
export interface EconomicCalendar {
  date: string;
  events: EconomicEvent[];
  marketHours: MarketHours[];
  holidays: MarketHoliday[];
}

export interface MarketHours {
  exchange: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  isOpen: boolean;
  extendedHours?: {
    preMarket?: { start: string; end: string };
    afterMarket?: { start: string; end: string };
  };
}

export interface MarketHoliday {
  name: string;
  date: string;
  exchanges: string[];
  type: 'full_day' | 'early_close';
  earlyCloseTime?: string;
}

/**
 * Search and filtering interfaces
 */
export interface EconomicsSearchFilters {
  assetClasses?: AssetClass[];
  sectors?: string[];
  riskLevels?: RiskLevel[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  marketCapRange?: {
    min?: number;
    max?: number;
  };
  dividendYieldMin?: number;
  peRatioRange?: {
    min?: number;
    max?: number;
  };
  countries?: string[];
  exchanges?: string[];
}

/**
 * Utility types for economics
 */
export type EconomicsMetric = keyof MarketData;
export type FinancialRatio = 'pe_ratio' | 'pb_ratio' | 'debt_equity' | 'roe' | 'roa' | 'current_ratio';

/**
 * Constants for economics
 */
export const MAJOR_EXCHANGES = [
  'NYSE', 'NASDAQ', 'LSE', 'TSE', 'HKEX', 'SSE', 'BSE', 'NSE', 'TSX', 'ASX'
] as const;

export const MAJOR_CURRENCIES = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD'
] as const;

export const TRADING_SESSIONS = {
  'US': { open: '09:30', close: '16:00', timezone: 'America/New_York' },
  'EU': { open: '08:00', close: '16:30', timezone: 'Europe/London' },
  'ASIA': { open: '09:00', close: '15:00', timezone: 'Asia/Tokyo' },
} as const;