import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allSettings = await db.select().from(settings);
    
    // تحويل إلى كائن
    const settingsObj: Record<string, unknown> = {};
    allSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    return NextResponse.json({ success: true, data: settingsObj, raw: allSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, category } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    // Upsert
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    
    if (existing.length > 0) {
      const [updated] = await db.update(settings)
        .set({ value, category, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return NextResponse.json({ success: true, data: updated });
    } else {
      const [created] = await db.insert(settings)
        .values({ key, value, category })
        .returning();
      return NextResponse.json({ success: true, data: created });
    }
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ success: false, error: 'Failed to save setting' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = body.updates as { key: string; value: unknown; category?: string }[];

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: 'Updates array is required' }, { status: 400 });
    }

    const results = [];
    
    for (const update of updates) {
      const existing = await db.select().from(settings).where(eq(settings.key, update.key));
      
      if (existing.length > 0) {
        const [updated] = await db.update(settings)
          .set({ value: update.value, category: update.category, updatedAt: new Date() })
          .where(eq(settings.key, update.key))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(settings)
          .values({ key: update.key, value: update.value, category: update.category })
          .returning();
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    await db.delete(settings).where(eq(settings.key, key));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete setting' }, { status: 500 });
  }
}
