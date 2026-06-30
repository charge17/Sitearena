import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const allPages = await db.select().from(pages).orderBy(pages.sortOrder);
    return NextResponse.json({ success: true, data: allPages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, metaTitle, metaDescription, isActive, template, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const slug = slugify(title);

    const [newPage] = await db.insert(pages).values({
      title,
      slug,
      content,
      metaTitle: metaTitle || title,
      metaDescription,
      isActive: isActive ?? true,
      template: template || 'default',
      sortOrder: sortOrder || 0,
    }).returning();

    return NextResponse.json({ success: true, data: newPage });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ success: false, error: 'Failed to create page' }, { status: 500 });
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
      updateData.slug = slugify(updateFields.title);
    }

    const allowedFields = ['content', 'metaTitle', 'metaDescription', 'isActive', 'template', 'sortOrder'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedPage] = await db.update(pages)
      .set(updateData)
      .where(eq(pages.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedPage });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ success: false, error: 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(pages).where(eq(pages.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete page' }, { status: 500 });
  }
}
