import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, headlinesQueue, generationTasks, niches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  generateHeadlinesAndSubtitles,
  generateIntroAndFirstPart,
  generateMiddlePart,
  generateFinalPart,
  generateMetaData,
} from '@/lib/openrouter';
import { parseJsonSafe, slugify, countWords } from '@/lib/utils';

interface GenerationResult {
  success: boolean;
  articleId?: number;
  error?: string;
}

// توليد العناوين من نيش محدد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, nicheId, headlineId } = body;

    if (action === 'generate-headlines') {
      return await handleGenerateHeadlines(nicheId);
    } else if (action === 'generate-article') {
      return await handleGenerateArticle(headlineId);
    } else if (action === 'generate-full') {
      return await handleFullGeneration(nicheId);
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Generation failed' 
    }, { status: 500 });
  }
}

async function handleGenerateHeadlines(nicheId: number) {
  // الحصول على معلومات النيش
  const [niche] = await db.select().from(niches).where(eq(niches.id, nicheId));
  
  if (!niche) {
    return NextResponse.json({ success: false, error: 'Niche not found' }, { status: 404 });
  }

  // توليد العناوين باستخدام AI
  const result = await generateHeadlinesAndSubtitles(
    niche.name,
    (niche.keywords as string[]) || []
  );

  if (!result.success || !result.content) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  // تحليل النتيجة
  const parsed = parseJsonSafe<{
    mainTitle: string;
    subHeadlines: string[];
    faqQuestions: string[];
  }>(result.content, {
    mainTitle: '',
    subHeadlines: [],
    faqQuestions: [],
  });

  if (!parsed.mainTitle) {
    return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
  }

  // حفظ في قائمة الانتظار
  const [headline] = await db.insert(headlinesQueue).values({
    nicheId,
    headline: parsed.mainTitle,
    subHeadlines: parsed.subHeadlines,
    faqQuestions: parsed.faqQuestions,
    status: 'pending',
    sourceType: 'generated',
  }).returning();

  return NextResponse.json({ 
    success: true, 
    data: headline,
    parsed 
  });
}

async function handleGenerateArticle(headlineId: number): Promise<NextResponse> {
  // الحصول على العنوان من قائمة الانتظار
  const [headline] = await db.select().from(headlinesQueue).where(eq(headlinesQueue.id, headlineId));
  
  if (!headline) {
    return NextResponse.json({ success: false, error: 'Headline not found' }, { status: 404 });
  }

  // تحديث الحالة
  await db.update(headlinesQueue)
    .set({ status: 'running' })
    .where(eq(headlinesQueue.id, headlineId));

  const subHeadlines = (headline.subHeadlines as string[]) || [];
  const faqQuestions = (headline.faqQuestions as string[]) || [];

  // تقسيم العناوين الفرعية
  const firstPart = subHeadlines.slice(0, 6);
  const middlePart = subHeadlines.slice(6, 14);
  const finalPart = subHeadlines.slice(14);

  let fullContent = '';
  const errors: string[] = [];

  // الجزء الأول: المقدمة و 6 عناوين
  const intro = await generateIntroAndFirstPart(headline.headline, firstPart);
  if (intro.success && intro.content) {
    fullContent += intro.content;
    
    // تسجيل المهمة
    await db.insert(generationTasks).values({
      headlineId,
      step: 1,
      status: 'completed',
      prompt: `Generate intro and first part for: ${headline.headline}`,
      response: intro.content.substring(0, 1000),
    });
  } else {
    errors.push(`Step 1 failed: ${intro.error}`);
  }

  // الجزء الثاني: 8 عناوين
  if (middlePart.length > 0) {
    const middle = await generateMiddlePart(headline.headline, middlePart);
    if (middle.success && middle.content) {
      fullContent += '\n\n' + middle.content;
      
      await db.insert(generationTasks).values({
        headlineId,
        step: 2,
        status: 'completed',
        prompt: `Generate middle part for: ${headline.headline}`,
        response: middle.content.substring(0, 1000),
      });
    } else {
      errors.push(`Step 2 failed: ${middle.error}`);
    }
  }

  // الجزء الثالث: العناوين المتبقية + FAQ + الخاتمة
  const final = await generateFinalPart(headline.headline, finalPart, faqQuestions);
  if (final.success && final.content) {
    fullContent += '\n\n' + final.content;
    
    await db.insert(generationTasks).values({
      headlineId,
      step: 3,
      status: 'completed',
      prompt: `Generate final part for: ${headline.headline}`,
      response: final.content.substring(0, 1000),
    });
  } else {
    errors.push(`Step 3 failed: ${final.error}`);
  }

  if (!fullContent) {
    await db.update(headlinesQueue)
      .set({ status: 'failed' })
      .where(eq(headlinesQueue.id, headlineId));
    
    return NextResponse.json({ 
      success: false, 
      error: errors.join('; ') || 'All generation steps failed' 
    }, { status: 500 });
  }

  // توليد البيانات الوصفية
  const meta = await generateMetaData(headline.headline, fullContent);
  let metaData = {
    metaTitle: headline.headline,
    metaDescription: '',
    keywords: [] as string[],
    excerpt: '',
  };

  if (meta.success && meta.content) {
    metaData = parseJsonSafe(meta.content, metaData);
  }

  // إنشاء FAQ Schema
  const faqSchema = faqQuestions.map(q => ({
    question: q,
    answer: '', // سيتم ملؤها من المحتوى
  }));

  // حفظ المقال
  const [article] = await db.insert(articles).values({
    nicheId: headline.nicheId,
    title: headline.headline,
    slug: slugify(headline.headline) + '-' + Date.now(),
    content: fullContent,
    excerpt: metaData.excerpt,
    metaTitle: metaData.metaTitle,
    metaDescription: metaData.metaDescription,
    status: 'draft',
    faqSchema,
    keywords: metaData.keywords,
    wordCount: countWords(fullContent),
  }).returning();

  // تحديث قائمة الانتظار
  await db.update(headlinesQueue)
    .set({ 
      status: 'completed',
      articleId: article.id,
      processedAt: new Date(),
    })
    .where(eq(headlinesQueue.id, headlineId));

  // إضافة أسئلة FAQ كعناوين جديدة
  if (faqQuestions.length > 0) {
    for (const question of faqQuestions) {
      await db.insert(headlinesQueue).values({
        nicheId: headline.nicheId,
        headline: question,
        subHeadlines: [],
        faqQuestions: [],
        status: 'pending',
        sourceType: 'faq',
        priority: -1, // أولوية أقل
      });
    }
  }

  return NextResponse.json({ 
    success: true, 
    data: article,
    warnings: errors.length > 0 ? errors : undefined,
  });
}

async function handleFullGeneration(nicheId: number): Promise<NextResponse> {
  // توليد العناوين أولاً
  const headlinesResponse = await handleGenerateHeadlines(nicheId);
  const headlinesData = await headlinesResponse.json();
  
  if (!headlinesData.success) {
    return NextResponse.json(headlinesData, { status: 500 });
  }

  // ثم توليد المقال
  const articleResponse = await handleGenerateArticle(headlinesData.data.id);
  return articleResponse;
}

// GET: الحصول على حالة التوليد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headlineId = searchParams.get('headlineId');

    if (headlineId) {
      const tasks = await db.select()
        .from(generationTasks)
        .where(eq(generationTasks.headlineId, parseInt(headlineId)));
      
      return NextResponse.json({ success: true, data: tasks });
    }

    // إحصائيات عامة
    const pendingHeadlines = await db.select()
      .from(headlinesQueue)
      .where(eq(headlinesQueue.status, 'pending'));

    return NextResponse.json({ 
      success: true, 
      data: {
        pendingCount: pendingHeadlines.length,
        pending: pendingHeadlines,
      }
    });
  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch status' }, { status: 500 });
  }
}
