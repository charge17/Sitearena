import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { plugins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const allPlugins = await db.select().from(plugins).orderBy(plugins.createdAt);
    return NextResponse.json({ success: true, data: allPlugins });
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch plugins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, version, isActive, config, hooks } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);

    const [newPlugin] = await db.insert(plugins).values({
      name,
      slug,
      description,
      version: version || '1.0.0',
      isActive: isActive ?? false,
      config,
      hooks,
    }).returning();

    return NextResponse.json({ success: true, data: newPlugin });
  } catch (error) {
    console.error('Error creating plugin:', error);
    return NextResponse.json({ success: false, error: 'Failed to create plugin' }, { status: 500 });
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
    
    if (updateFields.name !== undefined) {
      updateData.name = updateFields.name;
      updateData.slug = slugify(updateFields.name);
    }

    const allowedFields = ['description', 'version', 'isActive', 'config', 'hooks'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedPlugin] = await db.update(plugins)
      .set(updateData)
      .where(eq(plugins.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedPlugin });
  } catch (error) {
    console.error('Error updating plugin:', error);
    return NextResponse.json({ success: false, error: 'Failed to update plugin' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(plugins).where(eq(plugins.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete plugin' }, { status: 500 });
  }
}
