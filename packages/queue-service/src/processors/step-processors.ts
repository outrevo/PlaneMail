import { 
  SequenceStep, 
  MarketingSequence, 
  SequenceEnrollment, 
  DatabaseService, 
  EmailQueueService
} from '@planemail/shared';
import { SequenceProcessorResult } from '../sequence-processors';
import { BaseSequenceProcessor } from './base-processor';
import { EmailStepProcessor } from './email-step-processor';

export class WaitStepProcessor extends BaseSequenceProcessor {
  async executeStep(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): Promise<SequenceProcessorResult> {
    if (step.type !== 'wait') {
      return {
        success: false,
        error: 'Invalid wait step configuration',
      };
    }

    // Find next step
    const nextStep = sequence.steps?.find(s => s.order === step.order + 1);
    
    if (!nextStep) {
      return {
        success: true,
        shouldExit: true,
        exitReason: 'sequence_completed',
      };
    }

    const nextScheduledAt = this.calculateNextScheduledTime(nextStep, sequence.settings);

    return {
      success: true,
      nextStepId: nextStep.id,
      nextScheduledAt,
    };
  }
}

export class ConditionStepProcessor extends BaseSequenceProcessor {
  async executeStep(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): Promise<SequenceProcessorResult> {
    if (step.type !== 'condition' || !step.config.conditionConfig) {
      return {
        success: false,
        error: 'Invalid condition step configuration',
      };
    }

    const { conditionConfig } = step.config;
    const conditionsMet = this.evaluateConditions(conditionConfig.conditions, subscriberData);
    
    const nextStepId = conditionsMet ? conditionConfig.trueStepId : conditionConfig.falseStepId;
    
    if (!nextStepId) {
      return {
        success: true,
        shouldExit: true,
        exitReason: 'condition_no_next_step',
      };
    }

    const nextStep = sequence.steps?.find(s => s.id === nextStepId);
    
    if (!nextStep) {
      return {
        success: false,
        error: 'Next step not found',
      };
    }

    return {
      success: true,
      nextStepId: nextStep.id,
      nextScheduledAt: this.calculateNextScheduledTime(nextStep, sequence.settings),
      metadata: {
        conditionResult: conditionsMet,
      },
    };
  }

  private evaluateConditions(conditions: any[], subscriberData: any): boolean {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      console.warn('No conditions provided, defaulting to true');
      return true;
    }

    try {
      return conditions.every((condition, index) => {
        if (!condition || typeof condition !== 'object') {
          console.warn(`Invalid condition at index ${index}:`, condition);
          return false;
        }

        const { field, operator, value } = condition;
        
        if (!field || !operator) {
          console.warn(`Missing field or operator in condition ${index}`);
          return false;
        }

        const subscriberValue = this.getFieldValue(subscriberData, field);
        const result = this.evaluateCondition(subscriberValue, operator, value, field);
        
        console.log(`Condition ${index}: ${field} ${operator} ${value} = ${result} (subscriber value: ${subscriberValue})`);
        
        return result;
      });
    } catch (error: any) {
      console.error('Error evaluating conditions:', error);
      return false;
    }
  }

  private evaluateCondition(subscriberValue: any, operator: string, expectedValue: any, fieldName: string): boolean {
    // Handle null/undefined values
    if (subscriberValue === null || subscriberValue === undefined) {
      switch (operator) {
        case 'is_empty':
        case 'is_null':
          return true;
        case 'is_not_empty':
        case 'is_not_null':
          return false;
        case 'equals':
          return expectedValue === null || expectedValue === undefined || expectedValue === '';
        case 'not_equals':
          return !(expectedValue === null || expectedValue === undefined || expectedValue === '');
        default:
          return false;
      }
    }

    try {
      switch (operator) {
        case 'equals':
          return this.normalizeValue(subscriberValue) === this.normalizeValue(expectedValue);
        case 'not_equals':
          return this.normalizeValue(subscriberValue) !== this.normalizeValue(expectedValue);
        case 'contains':
          return String(subscriberValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case 'not_contains':
          return !String(subscriberValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        case 'starts_with':
          return String(subscriberValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
        case 'ends_with':
          return String(subscriberValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
        case 'greater_than':
          return this.compareNumbers(subscriberValue, expectedValue, '>');
        case 'greater_than_or_equal':
          return this.compareNumbers(subscriberValue, expectedValue, '>=');
        case 'less_than':
          return this.compareNumbers(subscriberValue, expectedValue, '<');
        case 'less_than_or_equal':
          return this.compareNumbers(subscriberValue, expectedValue, '<=');
        case 'is_empty':
          return !subscriberValue || String(subscriberValue).trim() === '';
        case 'is_not_empty':
          return !!subscriberValue && String(subscriberValue).trim() !== '';
        case 'is_null':
          return subscriberValue === null || subscriberValue === undefined;
        case 'is_not_null':
          return subscriberValue !== null && subscriberValue !== undefined;
        case 'in':
          if (!Array.isArray(expectedValue)) {
            console.warn(`Expected array for 'in' operator, got ${typeof expectedValue}`);
            return false;
          }
          return expectedValue.some(val => this.normalizeValue(subscriberValue) === this.normalizeValue(val));
        case 'not_in':
          if (!Array.isArray(expectedValue)) {
            console.warn(`Expected array for 'not_in' operator, got ${typeof expectedValue}`);
            return true;
          }
          return !expectedValue.some(val => this.normalizeValue(subscriberValue) === this.normalizeValue(val));
        case 'regex':
          try {
            const regex = new RegExp(String(expectedValue), 'i');
            return regex.test(String(subscriberValue));
          } catch (error) {
            console.warn(`Invalid regex pattern: ${expectedValue}`);
            return false;
          }
        case 'date_before':
          return this.compareDates(subscriberValue, expectedValue, '<');
        case 'date_after':
          return this.compareDates(subscriberValue, expectedValue, '>');
        case 'date_equals':
          return this.compareDates(subscriberValue, expectedValue, '=');
        case 'has_tag':
          return this.hasTag(subscriberValue, expectedValue, fieldName);
        case 'does_not_have_tag':
          return !this.hasTag(subscriberValue, expectedValue, fieldName);
        default:
          console.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error: any) {
      console.error(`Error evaluating condition with operator ${operator}:`, error);
      return false;
    }
  }

  private normalizeValue(value: any): any {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  }

  private compareNumbers(value1: any, value2: any, operator: string): boolean {
    const num1 = this.parseNumber(value1);
    const num2 = this.parseNumber(value2);
    
    if (num1 === null || num2 === null) {
      console.warn(`Cannot compare non-numeric values: ${value1} ${operator} ${value2}`);
      return false;
    }
    
    switch (operator) {
      case '>':
        return num1 > num2;
      case '>=':
        return num1 >= num2;
      case '<':
        return num1 < num2;
      case '<=':
        return num1 <= num2;
      default:
        return false;
    }
  }

  private parseNumber(value: any): number | null {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    
    return null;
  }

  private compareDates(value1: any, value2: any, operator: string): boolean {
    const date1 = this.parseDate(value1);
    const date2 = this.parseDate(value2);
    
    if (!date1 || !date2) {
      console.warn(`Cannot compare invalid dates: ${value1} ${operator} ${value2}`);
      return false;
    }
    
    switch (operator) {
      case '<':
        return date1 < date2;
      case '>':
        return date1 > date2;
      case '=':
        return date1.getTime() === date2.getTime();
      default:
        return false;
    }
  }

  private parseDate(value: any): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  }

  private hasTag(subscriberValue: any, expectedTagId: string, fieldName: string): boolean {
    // Handle different tag field formats
    if (fieldName === 'tags' || fieldName.includes('tag')) {
      if (Array.isArray(subscriberValue)) {
        return subscriberValue.some(tag => 
          typeof tag === 'string' ? tag === expectedTagId : tag?.id === expectedTagId
        );
      }
      
      if (typeof subscriberValue === 'string') {
        // Handle comma-separated tag IDs
        return subscriberValue.split(',').map(id => id.trim()).includes(expectedTagId);
      }
    }
    
    return false;
  }
}

export class ActionStepProcessor extends BaseSequenceProcessor {
  async executeStep(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): Promise<SequenceProcessorResult> {
    if (step.type !== 'action' || !step.config.actionConfig) {
      return {
        success: false,
        error: 'Invalid action step configuration',
      };
    }

    const { actionConfig } = step.config;
    
    try {
      await this.executeAction(actionConfig, subscriberData);
      
      // Find next step
      const nextStep = sequence.steps?.find(s => s.order === step.order + 1);
      
      return {
        success: true,
        nextStepId: nextStep?.id,
        nextScheduledAt: nextStep ? this.calculateNextScheduledTime(nextStep, sequence.settings) : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Action execution failed: ${error.message}`,
      };
    }
  }

  private async executeAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig || !actionConfig.actionType) {
      throw new Error('Action configuration is missing or invalid');
    }

    const { actionType } = actionConfig;
    
    try {
      switch (actionType) {
        case 'add_tag':
          await this.executeAddTagAction(actionConfig, subscriberData);
          break;
        case 'remove_tag':
          await this.executeRemoveTagAction(actionConfig, subscriberData);
          break;
        case 'update_field':
          await this.executeUpdateFieldAction(actionConfig, subscriberData);
          break;
        case 'webhook':
          await this.executeWebhookAction(actionConfig, subscriberData);
          break;
        case 'move_to_segment':
          await this.executeMoveToSegmentAction(actionConfig, subscriberData);
          break;
        case 'unsubscribe':
          await this.executeUnsubscribeAction(actionConfig, subscriberData);
          break;
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (error: any) {
      console.error(`❌ Action execution failed for ${actionType}:`, error);
      throw new Error(`Action ${actionType} failed: ${error.message}`);
    }
  }

  private async executeAddTagAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig.tagIds || !Array.isArray(actionConfig.tagIds) || actionConfig.tagIds.length === 0) {
      throw new Error('tagIds must be a non-empty array');
    }

    console.log(`🏷️ Adding tags ${actionConfig.tagIds.join(', ')} to subscriber ${subscriberData.id}`);
    
    for (const tagId of actionConfig.tagIds) {
      if (!tagId || typeof tagId !== 'string') {
        throw new Error(`Invalid tag ID: ${tagId}`);
      }
    }
  }

  private async executeRemoveTagAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig.tagIds || !Array.isArray(actionConfig.tagIds) || actionConfig.tagIds.length === 0) {
      throw new Error('tagIds must be a non-empty array');
    }

    console.log(`🗑️ Removing tags ${actionConfig.tagIds.join(', ')} from subscriber ${subscriberData.id}`);
    
    for (const tagId of actionConfig.tagIds) {
      if (!tagId || typeof tagId !== 'string') {
        throw new Error(`Invalid tag ID: ${tagId}`);
      }
    }
  }

  private async executeUpdateFieldAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig.fieldUpdates || typeof actionConfig.fieldUpdates !== 'object') {
      throw new Error('fieldUpdates must be an object');
    }

    const updates = actionConfig.fieldUpdates;
    const allowedFields = ['name', 'firstName', 'lastName', 'phone', 'company', 'customFields'];
    
    for (const fieldName of Object.keys(updates)) {
      if (!allowedFields.includes(fieldName) && !fieldName.startsWith('custom_')) {
        throw new Error(`Field '${fieldName}' is not allowed to be updated`);
      }
    }

    console.log(`✏️ Updating fields for subscriber ${subscriberData.id}:`, updates);
  }

  private async executeMoveToSegmentAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig.segmentId || typeof actionConfig.segmentId !== 'string') {
      throw new Error('segmentId must be a valid string');
    }

    console.log(`📊 Moving subscriber ${subscriberData.id} to segment ${actionConfig.segmentId}`);
  }

  private async executeUnsubscribeAction(actionConfig: any, subscriberData: any): Promise<void> {
    const reason = actionConfig.reason || 'sequence_action';
    
    console.log(`🚫 Unsubscribing subscriber ${subscriberData.id} with reason: ${reason}`);
  }

  private async executeWebhookAction(actionConfig: any, subscriberData: any): Promise<void> {
    if (!actionConfig.webhookUrl || typeof actionConfig.webhookUrl !== 'string') {
      throw new Error('webhookUrl must be a valid string');
    }

    try {
      new URL(actionConfig.webhookUrl);
    } catch {
      throw new Error('webhookUrl must be a valid URL');
    }

    const timeout = actionConfig.timeout || 30000;
    const maxRetries = actionConfig.maxRetries || 3;
    const headers = actionConfig.headers || {};
    
    const payload = {
      event: 'sequence_action',
      subscriber: {
        id: subscriberData.id,
        email: subscriberData.email,
        name: subscriberData.name,
        ...subscriberData,
      },
      action: actionConfig,
      timestamp: new Date().toISOString(),
    };

    console.log(`🌐 Calling webhook ${actionConfig.webhookUrl} for subscriber ${subscriberData.id}`);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(actionConfig.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PlaneMail-Sequence-Processor/1.0',
            ...headers,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ Webhook call successful on attempt ${attempt}`);
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Webhook attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(`Webhook failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}

// Factory function to get the appropriate processor
export function getSequenceStepProcessor(
  stepType: string, 
  dbService: DatabaseService, 
  emailQueueService: EmailQueueService
): BaseSequenceProcessor {
  switch (stepType) {
    case 'email':
      return new EmailStepProcessor(dbService, emailQueueService);
    case 'wait':
      return new WaitStepProcessor(dbService, emailQueueService);
    case 'condition':
      return new ConditionStepProcessor(dbService, emailQueueService);
    case 'action':
      return new ActionStepProcessor(dbService, emailQueueService);
    default:
      throw new Error(`Unsupported sequence step type: ${stepType}`);
  }
}
