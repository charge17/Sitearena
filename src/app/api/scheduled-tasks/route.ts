import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scheduledTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cronToNextRun } from '@/lib/utils';

export async function GET() {
  try {
    const tasks = await db.select().from(scheduledTasks).orderBy(scheduledTasks.createdAt);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, taskType, cronExpression, isActive, config } = body;

    if (!name || !taskType || !cronExpression) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, taskType and cronExpression are required' 
      }, { status: 400 });
    }

    const nextRun = cronToNextRun(cronExpression);

    const [newTask] = await db.insert(scheduledTasks).values({
      name,
      description,
      taskType,
      cronExpression,
      isActive: isActive ?? true,
      config,
      nextRun,
    }).returning();

    return NextResponse.json({ success: true, data: newTask });
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // تنفيذ المهمة يدوياً
    if (action === 'run') {
      await db.update(scheduledTasks)
        .set({ 
          status: 'running',
          lastRun: new Date(),
        })
        .where(eq(scheduledTasks.id, id));
      
      // TODO: تنفيذ المهمة الفعلية بناءً على taskType
      
      const [task] = await db.select().from(scheduledTasks).where(eq(scheduledTasks.id, id));
      
      await db.update(scheduledTasks)
        .set({ 
          status: 'completed',
          runCount: (task?.runCount || 0) + 1,
          nextRun: task?.cronExpression ? cronToNextRun(task.cronExpression) : null,
          lastResult: 'Completed successfully',
        })
        .where(eq(scheduledTasks.id, id));
      
      return NextResponse.json({ success: true });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    const allowedFields = ['name', 'description', 'taskType', 'cronExpression', 'isActive', 'config'];
    allowedFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    if (updateFields.cronExpression) {
      updateData.nextRun = cronToNextRun(updateFields.cronExpression);
    }

    const [updatedTask] = await db.update(scheduledTasks)
      .set(updateData)
      .where(eq(scheduledTasks.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating scheduled task:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await db.delete(scheduledTasks).where(eq(scheduledTasks.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled task:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
