import { NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, niches, categories, headlinesQueue, aiModels, ads, pages, scheduledTasks } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';

export async function GET() {
  try {
    // إحصائيات المقالات
    const articlesStats = await db.select({
      total: count(),
      published: sql<number>`count(*) filter (where ${articles.status} = 'published')`,
      draft: sql<number>`count(*) filter (where ${articles.status} = 'draft')`,
      generating: sql<number>`count(*) filter (where ${articles.status} = 'generating')`,
      totalWords: sql<number>`coalesce(sum(${articles.wordCount}), 0)`,
      totalViews: sql<number>`coalesce(sum(${articles.views}), 0)`,
    }).from(articles);

    // إحصائيات النيشات
    const nichesCount = await db.select({ count: count() }).from(niches);
    
    // إحصائيات التصنيفات
    const categoriesCount = await db.select({ count: count() }).from(categories);

    // إحصائيات قائمة الانتظار
    const queueStats = await db.select({
      total: count(),
      pending: sql<number>`count(*) filter (where ${headlinesQueue.status} = 'pending')`,
      running: sql<number>`count(*) filter (where ${headlinesQueue.status} = 'running')`,
      completed: sql<number>`count(*) filter (where ${headlinesQueue.status} = 'completed')`,
      failed: sql<number>`count(*) filter (where ${headlinesQueue.status} = 'failed')`,
    }).from(headlinesQueue);

    // إحصائيات نماذج الذكاء الاصطناعي
    const aiStats = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${aiModels.isActive} = true)`,
      totalRequests: sql<number>`coalesce(sum(${aiModels.totalRequests}), 0)`,
      successfulRequests: sql<number>`coalesce(sum(${aiModels.successfulRequests}), 0)`,
    }).from(aiModels);

    // إحصائيات الإعلانات
    const adsStats = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${ads.isActive} = true)`,
      totalImpressions: sql<number>`coalesce(sum(${ads.impressions}), 0)`,
      totalClicks: sql<number>`coalesce(sum(${ads.clicks}), 0)`,
    }).from(ads);

    // إحصائيات الصفحات
    const pagesCount = await db.select({ count: count() }).from(pages);

    // إحصائيات المهام المجدولة
    const tasksStats = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${scheduledTasks.isActive} = true)`,
    }).from(scheduledTasks);

    // أحدث المقالات
    const recentArticles = await db.select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      createdAt: articles.createdAt,
      wordCount: articles.wordCount,
    })
    .from(articles)
    .orderBy(sql`${articles.createdAt} desc`)
    .limit(5);

    // العناوين في الانتظار
    const pendingHeadlines = await db.select()
      .from(headlinesQueue)
      .where(eq(headlinesQueue.status, 'pending'))
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesStats[0],
        niches: nichesCount[0]?.count || 0,
        categories: categoriesCount[0]?.count || 0,
        queue: queueStats[0],
        ai: aiStats[0],
        ads: adsStats[0],
        pages: pagesCount[0]?.count || 0,
        tasks: tasksStats[0],
        recentArticles,
        pendingHeadlines,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
