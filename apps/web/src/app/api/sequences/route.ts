import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { marketingSequences, sequenceSteps, sequenceEnrollments, sequenceStepExecutions } from '@/db/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    // Calculate real statistics for each sequence
    const sequencesWithStats = await Promise.all(
      sequences.map(async (sequence) => {
        // Get enrollment counts
        const [totalEnrolled] = await db
          .select({ count: count() })
          .from(sequenceEnrollments)
          .where(eq(sequenceEnrollments.sequenceId, sequence.id));

        const [activeEnrolled] = await db
          .select({ count: count() })
          .from(sequenceEnrollments)
          .where(
            and(
              eq(sequenceEnrollments.sequenceId, sequence.id),
              eq(sequenceEnrollments.status, 'active')
            )
          );

        const [completedEnrolled] = await db
          .select({ count: count() })
          .from(sequenceEnrollments)
          .where(
            and(
              eq(sequenceEnrollments.sequenceId, sequence.id),
              eq(sequenceEnrollments.status, 'completed')
            )
          );

        // Calculate conversion rate
        const totalCount = totalEnrolled?.count || 0;
        const completedCount = completedEnrolled?.count || 0;
        const conversionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return {
          ...sequence,
          stats: {
            totalEntered: totalCount,
            totalCompleted: completedCount,
            currentActive: activeEnrolled?.count || 0,
            conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
          },
        };
      })
    );

    return NextResponse.json({ sequences: sequencesWithStats });
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

    // Convert nodes to sequence steps and save to sequence_steps table
    if (nodes && Array.isArray(nodes)) {
      // First, delete existing steps for this sequence
      await db.delete(sequenceSteps)
        .where(eq(sequenceSteps.sequenceId, id));

      // Create new steps from nodes (excluding trigger node)
      const stepNodes = nodes.filter(node => node.type !== 'trigger');
      
      console.log(`🔍 Processing ${stepNodes.length} step nodes for sequence ${id}`);
      
      for (let i = 0; i < stepNodes.length; i++) {
        const node = stepNodes[i];
        
        console.log(`📋 Processing node ${i + 1}:`, {
          id: node.id,
          type: node.type,
          configKeys: Object.keys(node.config || {}),
          config: node.config,
          isConfigured: node.isConfigured
        });
        
        // Determine step type based on node type (nodes saved without data wrapper)
        let stepType = 'email';
        let stepConfig = {};
        
        if (node.type === 'email') {
          stepType = 'email';
          // Use the actual config from the node, properly structured for EmailStepProcessor
          const nodeConfig = node.config || {};
          
          // Only create emailConfig if there's actual configuration data
          if (Object.keys(nodeConfig).length > 0) {
            stepConfig = {
              emailConfig: {
                subject: nodeConfig.subject || 'Email Step',
                htmlContent: nodeConfig.htmlContent || nodeConfig.content || '<p>Default email content</p>',
                fromName: nodeConfig.fromName || 'PlaneMail',
                fromEmail: nodeConfig.fromEmail || 'noreply@planemail.io',
                sendingProviderId: nodeConfig.sendingProviderId || null,
                templateId: nodeConfig.templateId || null,
              }
            };
          } else {
            // For empty config, store empty object (will fail validation as expected)
            stepConfig = {};
          }
        } else if (node.type === 'delay' || node.type === 'wait') {
          stepType = 'wait';
          const nodeConfig = node.config || {};
          stepConfig = {
            waitConfig: {
              duration: nodeConfig.delayAmount || nodeConfig.duration || 1,
              waitType: nodeConfig.delayUnit || nodeConfig.unit || 'days',
            }
          };
        }

        console.log(`📧 Final step config for ${node.id}:`, JSON.stringify(stepConfig, null, 2));

        await db.insert(sequenceSteps).values({
          id: randomUUID(),
          sequenceId: id,
          name: node.label || node.title || `Step ${i + 1}`,
          type: stepType,
          order: i + 1,
          config: stepConfig,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      console.log(`✅ Created ${stepNodes.length} steps for sequence ${id}`);
    }

    return NextResponse.json({ 
      sequence: updatedSequence,
      message: 'Sequence updated successfully'
    });
  } catch (error) {
    console.error('Error updating sequence:', error);
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 500 });
  }
}
