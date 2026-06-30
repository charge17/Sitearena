import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
    return NextResponse.json({ success: true, data: allCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nicheId, description, parentId, metaTitle, metaDescription, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    
    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      nicheId,
      description,
      parentId,
      metaTitle,
      metaDescription,
      sortOrder: sortOrder || 0,
      isActive: true,
    }).returning();

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
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
    
    const allowedFields = ['nicheId', 'description', 'parentId', 'metaTitle', 'metaDescription', 'isActive', 'sortOrder'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedCategory] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(categories).where(eq(categories.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
}
