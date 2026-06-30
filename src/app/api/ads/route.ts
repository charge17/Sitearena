import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allAds = await db.select().from(ads).orderBy(ads.createdAt);
    return NextResponse.json({ success: true, data: allAds });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, code, position, isActive, startDate, endDate, targetNiches, targetCategories } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Name and code are required' }, { status: 400 });
    }

    const [newAd] = await db.insert(ads).values({
      name,
      type: type || 'banner',
      code,
      position,
      isActive: isActive ?? true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      targetNiches,
      targetCategories,
    }).returning();

    return NextResponse.json({ success: true, data: newAd });
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json({ success: false, error: 'Failed to create ad' }, { status: 500 });
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
    
    const allowedFields = ['name', 'type', 'code', 'position', 'isActive', 'startDate', 'endDate', 'targetNiches', 'targetCategories'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          updateData[field] = updateFields[field] ? new Date(updateFields[field]) : null;
        } else {
          updateData[field] = updateFields[field];
        }
      }
    });

    const [updatedAd] = await db.update(ads)
      .set(updateData)
      .where(eq(ads.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedAd });
  } catch (error) {
    console.error('Error updating ad:', error);
    return NextResponse.json({ success: false, error: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(ads).where(eq(ads.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete ad' }, { status: 500 });
  }
}
