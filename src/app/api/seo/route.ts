import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { seoSettings, sitemapConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const settings = await db.select().from(seoSettings);
    const sitemaps = await db.select().from(sitemapConfig);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        settings,
        sitemapConfig: sitemaps,
      }
    });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'setting') {
      const { key, value, description } = data;
      
      if (!key) {
        return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
      }

      // Upsert setting
      const existing = await db.select().from(seoSettings).where(eq(seoSettings.key, key));
      
      if (existing.length > 0) {
        const [updated] = await db.update(seoSettings)
          .set({ value, description, updatedAt: new Date() })
          .where(eq(seoSettings.key, key))
          .returning();
        return NextResponse.json({ success: true, data: updated });
      } else {
        const [created] = await db.insert(seoSettings)
          .values({ key, value, description })
          .returning();
        return NextResponse.json({ success: true, data: created });
      }
    }

    if (type === 'sitemap') {
      const { entityType, changeFreq, priority, isIncluded } = data;
      
      if (!entityType) {
        return NextResponse.json({ success: false, error: 'Entity type is required' }, { status: 400 });
      }

      const existing = await db.select().from(sitemapConfig).where(eq(sitemapConfig.entityType, entityType));
      
      if (existing.length > 0) {
        const [updated] = await db.update(sitemapConfig)
          .set({ changeFreq, priority, isIncluded, updatedAt: new Date() })
          .where(eq(sitemapConfig.entityType, entityType))
          .returning();
        return NextResponse.json({ success: true, data: updated });
      } else {
        const [created] = await db.insert(sitemapConfig)
          .values({ entityType, changeFreq, priority, isIncluded })
          .returning();
        return NextResponse.json({ success: true, data: created });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error saving SEO setting:', error);
    return NextResponse.json({ success: false, error: 'Failed to save setting' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (type === 'setting') {
      await db.delete(seoSettings).where(eq(seoSettings.id, parseInt(id)));
    } else if (type === 'sitemap') {
      await db.delete(sitemapConfig).where(eq(sitemapConfig.id, parseInt(id)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SEO setting:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete setting' }, { status: 500 });
  }
}
