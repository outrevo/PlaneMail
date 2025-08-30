import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { marketingSequences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sequenceId = id;
    if (!sequenceId) {
      return NextResponse.json({ error: 'Invalid sequence ID' }, { status: 400 });
    }

    const sequence = await db.query.marketingSequences.findFirst({
      where: eq(marketingSequences.id, sequenceId),
    });

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    if (sequence.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract nodes and edges from triggerConfig for backward compatibility
    const triggerConfigData = sequence.triggerConfig as any || {};
    const { nodes = [], edges = [], ...triggerConfig } = triggerConfigData;

    // Log the structure for debugging (will show in server console)
    console.log(`API [${id}] - triggerConfig keys:`, Object.keys(triggerConfigData));
    console.log(`API [${id}] - nodes count:`, nodes?.length || 0);
    console.log(`API [${id}] - edges count:`, edges?.length || 0);

    return NextResponse.json({ 
      sequence: {
        ...sequence,
        nodes: nodes || [],
        edges: edges || [],
        triggerConfig: triggerConfig || {},
        // Also include the original triggerConfig for debugging
        _rawTriggerConfig: sequence.triggerConfig,
      }
    });
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sequenceId = id;
    if (!sequenceId) {
      return NextResponse.json({ error: 'Invalid sequence ID' }, { status: 400 });
    }

    // Check if sequence exists and belongs to user
    const existingSequence = await db.query.marketingSequences.findFirst({
      where: eq(marketingSequences.id, sequenceId),
    });

    if (!existingSequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    if (existingSequence.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Don't allow deletion of active sequences
    if (existingSequence.status === 'active') {
      return NextResponse.json({ 
        error: 'Cannot delete active sequence. Please pause it first.' 
      }, { status: 400 });
    }

    // Delete sequence
    await db.delete(marketingSequences)
      .where(eq(marketingSequences.id, sequenceId));

    return NextResponse.json({ 
      message: 'Sequence deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sequenceId = id;
    if (!sequenceId) {
      return NextResponse.json({ error: 'Invalid sequence ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Check if sequence exists and belongs to user
    const existingSequence = await db.query.marketingSequences.findFirst({
      where: eq(marketingSequences.id, sequenceId),
    });

    if (!existingSequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
    }

    if (existingSequence.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update only specific fields (like status)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    const [updatedSequence] = await db.update(marketingSequences)
      .set(updateData)
      .where(eq(marketingSequences.id, sequenceId))
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
