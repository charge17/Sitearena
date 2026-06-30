import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articleNetworks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const networks = await db.select().from(articleNetworks).orderBy(articleNetworks.createdAt);
    return NextResponse.json({ success: true, data: networks });
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch networks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nicheId, pillarArticleId, clusterArticles, linkingStrategy } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const [newNetwork] = await db.insert(articleNetworks).values({
      name,
      description,
      nicheId,
      pillarArticleId,
      clusterArticles: clusterArticles || [],
      linkingStrategy: linkingStrategy || 'hub-spoke',
      isActive: true,
    }).returning();

    return NextResponse.json({ success: true, data: newNetwork });
  } catch (error) {
    console.error('Error creating network:', error);
    return NextResponse.json({ success: false, error: 'Failed to create network' }, { status: 500 });
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
    
    const allowedFields = ['name', 'description', 'nicheId', 'pillarArticleId', 'clusterArticles', 'linkingStrategy', 'isActive'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedNetwork] = await db.update(articleNetworks)
      .set(updateData)
      .where(eq(articleNetworks.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedNetwork });
  } catch (error) {
    console.error('Error updating network:', error);
    return NextResponse.json({ success: false, error: 'Failed to update network' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(articleNetworks).where(eq(articleNetworks.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting network:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete network' }, { status: 500 });
  }
}
