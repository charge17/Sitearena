import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { niches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const allNiches = await db.select().from(niches).orderBy(niches.createdAt);
    return NextResponse.json({ success: true, data: allNiches });
  } catch (error) {
    console.error('Error fetching niches:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch niches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, keywords } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);
    
    const [newNiche] = await db.insert(niches).values({
      name,
      slug,
      description,
      keywords: keywords || [],
      isActive: true,
    }).returning();

    return NextResponse.json({ success: true, data: newNiche });
  } catch (error) {
    console.error('Error creating niche:', error);
    return NextResponse.json({ success: false, error: 'Failed to create niche' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, keywords, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (description !== undefined) updateData.description = description;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedNiche] = await db.update(niches)
      .set(updateData)
      .where(eq(niches.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedNiche });
  } catch (error) {
    console.error('Error updating niche:', error);
    return NextResponse.json({ success: false, error: 'Failed to update niche' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(niches).where(eq(niches.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting niche:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete niche' }, { status: 500 });
  }
}
