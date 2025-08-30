import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { marketingSequences } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sequences = await db.query.marketingSequences.findMany({
      where: eq(marketingSequences.userId, userId),
      orderBy: [desc(marketingSequences.createdAt)],
    });

    return NextResponse.json({ sequences });
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, nodes, edges, triggerConfig, settings } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Sequence name is required' }, { status: 400 });
    }

    // Create new sequence
    const [newSequence] = await db.insert(marketingSequences).values({
      userId,
      name: name.trim(),
      description: description?.trim() || '',
      status: 'draft',
      triggerType: triggerConfig?.triggerType || 'manual',
      triggerConfig: triggerConfig || {},
      settings: settings || {
        timezone: 'UTC',
        respectBusinessHours: false,
        businessHours: { start: '09:00', end: '17:00' },
      },
      stats: {
        totalEntered: 0,
        totalCompleted: 0,
        totalExited: 0,
        currentActive: 0,
        conversionRate: 0,
        avgCompletionTime: 0,
        stepStats: [],
      },
    }).returning();

    // TODO: Save sequence steps to sequence_steps table
    // For now, we'll store the nodes/edges in the triggerConfig for simplicity
    await db.update(marketingSequences)
      .set({
        triggerConfig: {
          ...triggerConfig,
          nodes: nodes || [],
          edges: edges || [],
        },
      })
      .where(eq(marketingSequences.id, newSequence.id));

    return NextResponse.json({ 
      sequence: newSequence,
      message: 'Sequence created successfully'
    });
  } catch (error) {
    console.error('Error creating sequence:', error);
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, nodes, edges, triggerConfig, settings } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Sequence ID is required' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Sequence name is required' }, { status: 400 });
    }

    // Check if sequence exists and belongs to user
    const existingSequence = await db.query.marketingSequences.findFirst({
      where: eq(marketingSequences.id, id),
    });

    if (!existingSequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    if (existingSequence.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update sequence
    const [updatedSequence] = await db.update(marketingSequences)
      .set({
        name: name.trim(),
        description: description?.trim() || '',
        triggerType: triggerConfig?.triggerType || existingSequence.triggerType,
        triggerConfig: {
          ...triggerConfig,
          nodes: nodes || [],
          edges: edges || [],
        },
        settings: settings || existingSequence.settings,
        updatedAt: new Date(),
      })
      .where(eq(marketingSequences.id, id))
      .returning();

    return NextResponse.json({ 
      sequence: updatedSequence,
      message: 'Sequence updated successfully'
    });
  } catch (error) {
    console.error('Error updating sequence:', error);
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 500 });
  }
}
