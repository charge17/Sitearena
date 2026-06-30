import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { headlinesQueue } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nicheId = searchParams.get('nicheId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.select().from(headlinesQueue);
    
    if (status) {
      query = query.where(eq(headlinesQueue.status, status as 'pending' | 'running' | 'completed' | 'failed')) as typeof query;
    }
    
    if (nicheId) {
      query = query.where(eq(headlinesQueue.nicheId, parseInt(nicheId))) as typeof query;
    }

    const headlines = await query.orderBy(desc(headlinesQueue.priority), desc(headlinesQueue.createdAt)).limit(limit);
    
    return NextResponse.json({ success: true, data: headlines });
  } catch (error) {
    console.error('Error fetching headlines:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch headlines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nicheId, headline, subHeadlines, faqQuestions, priority, sourceType } = body;

    if (!headline) {
      return NextResponse.json({ success: false, error: 'Headline is required' }, { status: 400 });
    }

    const [newHeadline] = await db.insert(headlinesQueue).values({
      nicheId,
      headline,
      subHeadlines: subHeadlines || [],
      faqQuestions: faqQuestions || [],
      status: 'pending',
      priority: priority || 0,
      sourceType: sourceType || 'manual',
    }).returning();

    return NextResponse.json({ success: true, data: newHeadline });
  } catch (error) {
    console.error('Error creating headline:', error);
    return NextResponse.json({ success: false, error: 'Failed to create headline' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    const allowedFields = ['headline', 'subHeadlines', 'faqQuestions', 'status', 'priority'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedHeadline] = await db.update(headlinesQueue)
      .set(updateData)
      .where(eq(headlinesQueue.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedHeadline });
  } catch (error) {
    console.error('Error updating headline:', error);
    return NextResponse.json({ success: false, error: 'Failed to update headline' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(headlinesQueue).where(eq(headlinesQueue.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting headline:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete headline' }, { status: 500 });
  }
}
