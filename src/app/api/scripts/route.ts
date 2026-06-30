import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scripts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allScripts = await db.select().from(scripts).orderBy(scripts.createdAt);
    return NextResponse.json({ success: true, data: allScripts });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch scripts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, position, isActive, loadAsync, loadDefer, targetPages } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Name and code are required' }, { status: 400 });
    }

    const [newScript] = await db.insert(scripts).values({
      name,
      code,
      position: position || 'head',
      isActive: isActive ?? true,
      loadAsync: loadAsync ?? false,
      loadDefer: loadDefer ?? false,
      targetPages,
    }).returning();

    return NextResponse.json({ success: true, data: newScript });
  } catch (error) {
    console.error('Error creating script:', error);
    return NextResponse.json({ success: false, error: 'Failed to create script' }, { status: 500 });
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
    
    const allowedFields = ['name', 'code', 'position', 'isActive', 'loadAsync', 'loadDefer', 'targetPages'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedScript] = await db.update(scripts)
      .set(updateData)
      .where(eq(scripts.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedScript });
  } catch (error) {
    console.error('Error updating script:', error);
    return NextResponse.json({ success: false, error: 'Failed to update script' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(scripts).where(eq(scripts.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete script' }, { status: 500 });
  }
}
