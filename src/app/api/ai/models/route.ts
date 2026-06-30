import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiModels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { FREE_MODELS, getModelStatuses, resetModelStatus } from '@/lib/openrouter';

export async function GET() {
  try {
    // الحصول على النماذج من قاعدة البيانات
    let dbModels = await db.select().from(aiModels).orderBy(aiModels.priority);

    // إذا لم تكن هناك نماذج، أضف النماذج الافتراضية
    if (dbModels.length === 0) {
      for (const model of FREE_MODELS) {
        await db.insert(aiModels).values({
          name: model.name,
          modelId: model.id,
          provider: 'openrouter',
          isActive: true,
          isFree: true,
          priority: model.priority,
        });
      }
      dbModels = await db.select().from(aiModels).orderBy(aiModels.priority);
    }

    // إضافة حالة النماذج من الذاكرة
    const statuses = getModelStatuses();
    const modelsWithStatus = dbModels.map(model => {
      const status = statuses.find(s => s.modelId === model.modelId);
      return {
        ...model,
        currentFailures: status?.failures || 0,
        lastFailure: status?.lastFailure || null,
      };
    });

    return NextResponse.json({ success: true, data: modelsWithStatus });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, modelId, provider, isActive, isFree, priority } = body;

    if (!name || !modelId) {
      return NextResponse.json({ success: false, error: 'Name and modelId are required' }, { status: 400 });
    }

    const [newModel] = await db.insert(aiModels).values({
      name,
      modelId,
      provider: provider || 'openrouter',
      isActive: isActive ?? true,
      isFree: isFree ?? true,
      priority: priority || 0,
    }).returning();

    return NextResponse.json({ success: true, data: newModel });
  } catch (error) {
    console.error('Error creating AI model:', error);
    return NextResponse.json({ success: false, error: 'Failed to create model' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // إعادة تعيين حالة النموذج
    if (action === 'reset') {
      const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
      if (model) {
        resetModelStatus(model.modelId);
        await db.update(aiModels)
          .set({ failureCount: 0, lastError: null })
          .where(eq(aiModels.id, id));
      }
      return NextResponse.json({ success: true });
    }

    const updateData: Record<string, unknown> = {};
    
    const allowedFields = ['name', 'modelId', 'provider', 'isActive', 'isFree', 'priority'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const [updatedModel] = await db.update(aiModels)
      .set(updateData)
      .where(eq(aiModels.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedModel });
  } catch (error) {
    console.error('Error updating AI model:', error);
    return NextResponse.json({ success: false, error: 'Failed to update model' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(aiModels).where(eq(aiModels.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete model' }, { status: 500 });
  }
}
