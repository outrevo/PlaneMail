import { EmailJobData } from '@planemail/shared';
import { 
  SequenceStep, 
  MarketingSequence, 
  SequenceEnrollment, 
  SequenceStepExecution,
  DatabaseService, 
  EmailQueueService
} from '@planemail/shared';
import { SequenceProcessorResult } from '../sequence-processors';
import { BaseSequenceProcessor } from './base-processor';

export class EmailStepProcessor extends BaseSequenceProcessor {
  async executeStep(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): Promise<SequenceProcessorResult> {
    if (step.type !== 'email' || !step.config.emailConfig) {
      return {
        success: false,
        error: 'Invalid email step configuration',
      };
    }

    const { emailConfig } = step.config;
    
    try {
      // Load provider configuration for email sending
      const providerConfig = await this.dbService.getUserIntegrations(sequence.userId, sequence.orgId);
      
      // Create email job data
      const emailJobData: EmailJobData = {
        id: `sequence_${enrollment.id}_${step.id}_${Date.now()}`,
        userId: sequence.userId,
        subject: this.personalizeContent(emailConfig.subject, subscriberData),
        fromName: emailConfig.fromName,
        fromEmail: emailConfig.fromEmail,
        htmlContent: this.personalizeContent(emailConfig.htmlContent, subscriberData),
        sendingProviderId: emailConfig.sendingProviderId,
        recipients: [{
          email: subscriberData.email,
          name: subscriberData.name,
          metadata: {
            subscriberId: subscriberData.id,
            sequenceId: sequence.id,
            enrollmentId: enrollment.id,
            stepId: step.id,
          },
        }],
        providerConfig,
        priority: 2, // Sequence emails have medium priority
        attempts: 0,
        createdAt: new Date(),
      };

      // Queue the email job
      const emailJobId = await this.emailQueueService.addEmailJob(emailJobData);
      console.log(`📧 Queued email job ${emailJobId} for step ${step.id} to ${subscriberData.email}`);
      
      // Find next step
      const nextStep = sequence.steps?.find(s => s.order === step.order + 1);
      
      return {
        success: true,
        nextStepId: nextStep?.id,
        nextScheduledAt: nextStep ? this.calculateNextScheduledTime(nextStep, sequence.settings) : undefined,
        metadata: {
          emailJobId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to send email: ${error.message}`,
      };
    }
  }

  private personalizeContent(content: string, subscriberData: any): string {
    if (!content || typeof content !== 'string') {
      return content || '';
    }

    try {
      let personalizedContent = content;
      
      // Define available variables with fallbacks
      const variables: Record<string, string> = {
        'subscriber.name': subscriberData?.name || subscriberData?.firstName || 'Friend',
        'subscriber.firstName': this.extractFirstName(subscriberData?.name) || subscriberData?.firstName || 'Friend',
        'subscriber.lastName': this.extractLastName(subscriberData?.name) || subscriberData?.lastName || '',
        'subscriber.email': subscriberData?.email || '',
        'subscriber.company': subscriberData?.company || '',
        'subscriber.phone': subscriberData?.phone || '',
        'subscriber.id': subscriberData?.id || '',
        'today.date': new Date().toLocaleDateString(),
        'today.datetime': new Date().toLocaleString(),
        'today.year': new Date().getFullYear().toString(),
        'today.month': (new Date().getMonth() + 1).toString(),
        'today.day': new Date().getDate().toString(),
      };

      // Add custom fields
      if (subscriberData?.customFields && typeof subscriberData.customFields === 'object') {
        Object.entries(subscriberData.customFields).forEach(([key, value]) => {
          variables[`subscriber.${key}`] = String(value || '');
          variables[`custom.${key}`] = String(value || '');
        });
      }

      // Replace all variables using regex with fallback support
      personalizedContent = personalizedContent.replace(
        /\{\{([^}]+)\}\}/g,
        (match, variableName) => {
          const trimmedName = variableName.trim();
          
          // Check for fallback syntax: {{variable|fallback}}
          if (trimmedName.includes('|')) {
            const [varName, fallback] = trimmedName.split('|').map((s: string) => s.trim());
            const value = variables[varName];
            return value || fallback || '';
          }
          
          // Regular variable replacement
          const value = variables[trimmedName];
          if (value !== undefined && value !== null) {
            return String(value);
          }
          
          // Try to get dynamic field value using base class method
          const dynamicValue = this.getFieldValue(subscriberData, trimmedName.replace('subscriber.', ''));
          if (dynamicValue !== undefined && dynamicValue !== null) {
            return String(dynamicValue);
          }
          
          // Return original if no match found
          console.warn(`Unknown personalization variable: ${trimmedName}`);
          return match;
        }
      );

      // Handle conditional blocks: {{#if subscriber.name}}Hello {{subscriber.name}}{{/if}}
      personalizedContent = this.processConditionalBlocks(personalizedContent, subscriberData);

      return personalizedContent;
    } catch (error: any) {
      console.error('Error personalizing content:', error);
      return content; // Return original content on error
    }
  }

  private extractFirstName(fullName: string | undefined): string {
    if (!fullName || typeof fullName !== 'string') {
      return '';
    }
    return fullName.trim().split(/\s+/)[0] || '';
  }

  private extractLastName(fullName: string | undefined): string {
    if (!fullName || typeof fullName !== 'string') {
      return '';
    }
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  private processConditionalBlocks(content: string, subscriberData: any): string {
    // Handle simple if blocks: {{#if field}}content{{/if}}
    return content.replace(
      /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs,
      (match, condition, innerContent) => {
        const fieldValue = this.getFieldValue(subscriberData, condition.trim().replace('subscriber.', ''));
        
        // Consider truthy values: non-empty strings, non-zero numbers, true boolean
        const isTruthy = fieldValue && 
          (typeof fieldValue === 'string' ? fieldValue.trim() !== '' : 
           typeof fieldValue === 'number' ? fieldValue !== 0 : 
           Boolean(fieldValue));
        
        return isTruthy ? innerContent : '';
      }
    );
  }
}
