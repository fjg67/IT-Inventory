export interface DashboardSummary {
  totalArticles: number;
  lowStockArticles: number;
  movementsToday: number;
  recentMovements: RecentMovement[];
}

export interface RecentMovement {
  id: string;
  type: string;
  articleName: string;
  quantity: number;
  siteName: string;
  userName: string;
  occurredAt: string;
}

export interface ArticleListItem {
  id: string;
  reference: string;
  name: string;
  family: string | null;
  quantity: number;
  minimumStock: number;
  unit: string;
  location: string | null;
  barcode: string | null;
  imageUrl?: string | null;
}

export interface ArticlePage {
  items: ArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovementListItem {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  articleName: string;
  articleReference: string;
  userName: string;
  fromSiteName: string | null;
  toSiteName: string | null;
  occurredAt: string;
}

export interface MovementPage {
  items: MovementListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type PCState =
  | 'a_chaud'
  | 'a_reusiner'
  | 'en_usinage'
  | 'disponible'
  | 'en_panne'
  | 'envoye';

export interface ComputerListItem {
  id: string;
  name: string;
  hostname: string;
  reference: string;
  barcode: string | null;
  brand: string | null;
  model: string | null;
  allocation: string;
  location: string | null;
  state: PCState;
  quantity: number;
  updatedAt: string;
}

export interface ComputerCounts {
  total: number;
  a_chaud: number;
  a_reusiner: number;
  en_usinage: number;
  disponible: number;
  en_panne: number;
  envoye: number;
}

export interface ComputerPage {
  items: ComputerListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: ComputerCounts;
}

export interface StockMapItem {
  reference: string;
  quantity: number;
}

export interface StockMapData {
  items: StockMapItem[];
}

export type AnalyticsPeriod = '7days' | '30days' | '90days';

export interface AnalyticsDay {
  date: string;
  entries: number;
  exits: number;
  adjustments: number;
  transfers: number;
}

export interface AnalyticsTopArticle {
  id: string;
  name: string;
  reference: string;
  movements: number;
  quantity: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totalMovements: number;
  inboundQuantity: number;
  outboundQuantity: number;
  adjustments: number;
  transfers: number;
  trend: AnalyticsDay[];
  topArticles: AnalyticsTopArticle[];
  partial: boolean;
}
