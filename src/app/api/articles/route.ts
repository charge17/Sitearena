import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { slugify, countWords } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nicheId = searchParams.get('nicheId');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(articles);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(articles.status, status as 'draft' | 'pending' | 'generating' | 'published' | 'archived'));
    }
    if (nicheId) {
      conditions.push(eq(articles.nicheId, parseInt(nicheId)));
    }
    if (categoryId) {
      conditions.push(eq(articles.categoryId, parseInt(categoryId)));
    }

    const allArticles = await query
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ success: true, data: allArticles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      nicheId, 
      categoryId, 
      content, 
      excerpt,
      metaTitle, 
      metaDescription,
      featuredImage,
      status,
      faqSchema,
      howToSchema,
      internalLinks,
      externalLinks,
      ctaBlocks,
      tables,
      bulletPoints,
      keywords,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const slug = slugify(title) + '-' + Date.now();
    const wordCount = countWords(content || '');
    
    const [newArticle] = await db.insert(articles).values({
      title,
      slug,
      nicheId,
      categoryId,
      content,
      excerpt,
      metaTitle: metaTitle || title,
      metaDescription,
      featuredImage,
      status: status || 'draft',
      faqSchema,
      howToSchema,
      internalLinks,
      externalLinks,
      ctaBlocks,
      tables,
      bulletPoints,
      keywords,
      wordCount,
      publishedAt: status === 'published' ? new Date() : null,
    }).returning();

    return NextResponse.json({ success: true, data: newArticle });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ success: false, error: 'Failed to create article' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (updateFields.title !== undefined) {
      updateData.title = updateFields.title;
    }
    
    if (updateFields.content !== undefined) {
      updateData.content = updateFields.content;
      updateData.wordCount = countWords(updateFields.content);
    }

    const allowedFields = [
      'nicheId', 'categoryId', 'excerpt', 'metaTitle', 'metaDescription',
      'featuredImage', 'status', 'faqSchema', 'howToSchema', 'breadcrumbSchema',
      'internalLinks', 'externalLinks', 'ctaBlocks', 'tables', 'bulletPoints',
      'relatedArticles', 'keywords', 'isIndexed'
    ];
    
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    if (updateFields.status === 'published' && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const [updatedArticle] = await db.update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ success: false, error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete article' }, { status: 500 });
  }
}
