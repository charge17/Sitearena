import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const articleStatusEnum = pgEnum('article_status', ['draft', 'pending', 'generating', 'published', 'archived']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'running', 'completed', 'failed']);
export const adTypeEnum = pgEnum('ad_type', ['banner', 'popup', 'inline', 'sidebar', 'native']);
export const scriptPositionEnum = pgEnum('script_position', ['head', 'body_start', 'body_end', 'after_content']);

// Niches Table
export const niches = pgTable('niches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  keywords: jsonb('keywords').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  articleCount: integer('article_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories Table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nicheId: integer('niche_id').references(() => niches.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Articles Table
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  nicheId: integer('niche_id').references(() => niches.id),
  categoryId: integer('category_id').references(() => categories.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  excerpt: text('excerpt'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  featuredImage: text('featured_image'),
  status: articleStatusEnum('status').default('draft'),
  faqSchema: jsonb('faq_schema').$type<{ question: string; answer: string }[]>(),
  howToSchema: jsonb('how_to_schema').$type<{ name: string; steps: { name: string; text: string; image?: string }[] }>(),
  breadcrumbSchema: jsonb('breadcrumb_schema').$type<{ name: string; url: string }[]>(),
  internalLinks: jsonb('internal_links').$type<{ text: string; url: string }[]>(),
  externalLinks: jsonb('external_links').$type<{ text: string; url: string }[]>(),
  ctaBlocks: jsonb('cta_blocks').$type<{ title: string; text: string; buttonText: string; buttonUrl: string }[]>(),
  tables: jsonb('tables').$type<{ title: string; headers: string[]; rows: string[][] }[]>(),
  bulletPoints: jsonb('bullet_points').$type<string[]>(),
  relatedArticles: jsonb('related_articles').$type<number[]>(),
  keywords: jsonb('keywords').$type<string[]>(),
  wordCount: integer('word_count').default(0),
  views: integer('views').default(0),
  isIndexed: boolean('is_indexed').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Article Headlines Queue
export const headlinesQueue = pgTable('headlines_queue', {
  id: serial('id').primaryKey(),
  nicheId: integer('niche_id').references(() => niches.id),
  headline: text('headline').notNull(),
  subHeadlines: jsonb('sub_headlines').$type<string[]>(),
  faqQuestions: jsonb('faq_questions').$type<string[]>(),
  status: taskStatusEnum('status').default('pending'),
  priority: integer('priority').default(0),
  articleId: integer('article_id').references(() => articles.id),
  sourceType: text('source_type').default('generated'), // generated, faq, manual
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

// AI Models Configuration
export const aiModels = pgTable('ai_models', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  modelId: text('model_id').notNull(),
  provider: text('provider').default('openrouter'),
  isActive: boolean('is_active').default(true),
  isFree: boolean('is_free').default(true),
  priority: integer('priority').default(0),
  failureCount: integer('failure_count').default(0),
  lastUsed: timestamp('last_used'),
  lastError: text('last_error'),
  totalRequests: integer('total_requests').default(0),
  successfulRequests: integer('successful_requests').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Ads Management
export const ads = pgTable('ads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: adTypeEnum('type').default('banner'),
  code: text('code').notNull(),
  position: text('position'),
  isActive: boolean('is_active').default(true),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  targetNiches: jsonb('target_niches').$type<number[]>(),
  targetCategories: jsonb('target_categories').$type<number[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Scripts Management
export const scripts = pgTable('scripts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  position: scriptPositionEnum('position').default('head'),
  isActive: boolean('is_active').default(true),
  loadAsync: boolean('load_async').default(false),
  loadDefer: boolean('load_defer').default(false),
  targetPages: jsonb('target_pages').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Images Management
export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name'),
  url: text('url').notNull(),
  altText: text('alt_text'),
  title: text('title'),
  size: integer('size'),
  width: integer('width'),
  height: integer('height'),
  mimeType: text('mime_type'),
  folder: text('folder').default('general'),
  isOptimized: boolean('is_optimized').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// SEO Settings
export const seoSettings = pgTable('seo_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type').default('text'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Static Pages
export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  isActive: boolean('is_active').default(true),
  template: text('template').default('default'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Scheduled Tasks (Cron Jobs)
export const scheduledTasks = pgTable('scheduled_tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  taskType: text('task_type').notNull(),
  cronExpression: text('cron_expression').notNull(),
  isActive: boolean('is_active').default(true),
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  status: taskStatusEnum('status').default('pending'),
  config: jsonb('config'),
  lastResult: text('last_result'),
  runCount: integer('run_count').default(0),
  failureCount: integer('failure_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Article Generation Tasks
export const generationTasks = pgTable('generation_tasks', {
  id: serial('id').primaryKey(),
  headlineId: integer('headline_id').references(() => headlinesQueue.id),
  articleId: integer('article_id').references(() => articles.id),
  step: integer('step').default(1), // 1-4 for each AI call
  status: taskStatusEnum('status').default('pending'),
  aiModelId: integer('ai_model_id').references(() => aiModels.id),
  prompt: text('prompt'),
  response: text('response'),
  error: text('error'),
  retryCount: integer('retry_count').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Plugins Management
export const plugins = pgTable('plugins', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  version: text('version').default('1.0.0'),
  isActive: boolean('is_active').default(false),
  config: jsonb('config'),
  hooks: jsonb('hooks').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Statistics & Analytics
export const statistics = pgTable('statistics', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  articlesGenerated: integer('articles_generated').default(0),
  articlesPublished: integer('articles_published').default(0),
  aiRequestsCount: integer('ai_requests_count').default(0),
  aiRequestsFailed: integer('ai_requests_failed').default(0),
  topArticles: jsonb('top_articles').$type<{ id: number; views: number }[]>(),
  topCategories: jsonb('top_categories').$type<{ id: number; views: number }[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sitemap Configuration
export const sitemapConfig = pgTable('sitemap_config', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // articles, categories, pages
  changeFreq: text('change_freq').default('weekly'),
  priority: text('priority').default('0.5'),
  isIncluded: boolean('is_included').default(true),
  lastGenerated: timestamp('last_generated'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Article Networks (Internal Linking Structure)
export const articleNetworks = pgTable('article_networks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  nicheId: integer('niche_id').references(() => niches.id),
  pillarArticleId: integer('pillar_article_id').references(() => articles.id),
  clusterArticles: jsonb('cluster_articles').$type<number[]>(),
  linkingStrategy: text('linking_strategy').default('hub-spoke'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// System Logs
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: text('level').default('info'),
  category: text('category'),
  message: text('message').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Settings
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value'),
  category: text('category').default('general'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
