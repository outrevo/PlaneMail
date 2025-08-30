import { 
  SequenceStep, 
  MarketingSequence, 
  SequenceEnrollment, 
  SequenceStepExecution,
  DatabaseService, 
  EmailQueueService
} from '@planemail/shared';
import { SequenceProcessorResult } from '../sequence-processors';

export abstract class BaseSequenceProcessor {
  constructor(
    protected dbService: DatabaseService,
    protected emailQueueService: EmailQueueService
  ) {}

  abstract executeStep(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): Promise<SequenceProcessorResult>;

  protected calculateNextScheduledTime(step: SequenceStep, settings: any): Date {
    const now = new Date();
    
    if (step.type === 'wait' && step.config.waitConfig) {
      const { duration, waitType, exactTime } = step.config.waitConfig;
      
      let waitMs = 0;
      switch (waitType) {
        case 'hours':
          waitMs = duration * 60 * 60 * 1000;
          break;
        case 'days':
          waitMs = duration * 24 * 60 * 60 * 1000;
          break;
        case 'weeks':
          waitMs = duration * 7 * 24 * 60 * 60 * 1000;
          break;
      }
      
      const scheduledTime = new Date(now.getTime() + waitMs);
      
      // If exact time is specified, adjust to that time
      if (exactTime) {
        const [hours, minutes] = exactTime.split(':').map(Number);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
      }
      
      // Apply business hours restriction if enabled
      if (settings?.businessHoursOnly && settings?.sendingSchedule) {
        return this.adjustForBusinessHours(scheduledTime, settings.sendingSchedule);
      }
      
      return scheduledTime;
    }
    
    // For immediate execution (email, action, condition steps)
    return now;
  }

  private adjustForBusinessHours(scheduledTime: Date, schedule: any): Date {
    if (!schedule || !schedule.daysOfWeek || !schedule.startTime || !schedule.endTime) {
      console.warn('Invalid business hours schedule, returning original time');
      return scheduledTime;
    }

    const { daysOfWeek, startTime, endTime, timezone } = schedule;
    
    try {
      // Parse time strings with validation
      const startTimeParts = startTime.split(':');
      const endTimeParts = endTime.split(':');
      
      if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
        throw new Error('Invalid time format. Expected HH:MM');
      }
      
      const [startHour, startMinute] = startTimeParts.map(Number);
      const [endHour, endMinute] = endTimeParts.map(Number);
      
      // Validate time ranges
      if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59 ||
          endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
        throw new Error('Invalid time values');
      }
      
      // Validate days of week
      if (!Array.isArray(daysOfWeek) || daysOfWeek.some(day => day < 0 || day > 6)) {
        throw new Error('Invalid days of week');
      }
      
      if (daysOfWeek.length === 0) {
        console.warn('No business days specified, returning original time');
        return scheduledTime;
      }
      
      // Create working copy of scheduled time
      let adjustedTime = new Date(scheduledTime);
      
      // Apply timezone if specified
      if (timezone) {
        try {
          adjustedTime = new Date(adjustedTime.toLocaleString("en-US", { timeZone: timezone }));
        } catch (error) {
          console.warn(`Invalid timezone ${timezone}, using local time`);
        }
      }
      
      // Check if current time is within business hours
      const currentDay = adjustedTime.getDay();
      const currentHour = adjustedTime.getHours();
      const currentMinute = adjustedTime.getMinutes();
      
      const isBusinessDay = daysOfWeek.includes(currentDay);
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Handle overnight business hours (e.g., 22:00 to 06:00)
      const isOvernightSchedule = endTimeMinutes <= startTimeMinutes;
      let isBusinessHour = false;
      
      if (isOvernightSchedule) {
        isBusinessHour = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
      } else {
        isBusinessHour = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
      }
      
      if (isBusinessDay && isBusinessHour) {
        return scheduledTime; // Already within business hours
      }
      
      // Find next business day and time
      let nextBusinessTime = new Date(adjustedTime);
      let daysChecked = 0;
      const maxDaysToCheck = 14; // Prevent infinite loop
      
      while (daysChecked < maxDaysToCheck) {
        const checkDay = nextBusinessTime.getDay();
        
        if (daysOfWeek.includes(checkDay)) {
          // This is a business day - set to start of business hours
          nextBusinessTime.setHours(startHour, startMinute, 0, 0);
          
          // If we're on the same day and past business hours, this time is valid
          if (daysChecked > 0 || nextBusinessTime > adjustedTime) {
            break;
          }
        }
        
        // Move to next day
        nextBusinessTime.setDate(nextBusinessTime.getDate() + 1);
        nextBusinessTime.setHours(startHour, startMinute, 0, 0);
        daysChecked++;
      }
      
      if (daysChecked >= maxDaysToCheck) {
        console.warn('Could not find valid business hours within 14 days, returning original time');
        return scheduledTime;
      }
      
      // Convert back to original timezone if needed
      if (timezone) {
        try {
          const offset = nextBusinessTime.getTimezoneOffset() * 60000;
          nextBusinessTime = new Date(nextBusinessTime.getTime() - offset);
        } catch (error) {
          console.warn('Error converting timezone back:', error);
        }
      }
      
      console.log(`📅 Adjusted time from ${scheduledTime.toISOString()} to ${nextBusinessTime.toISOString()} for business hours`);
      return nextBusinessTime;
      
    } catch (error: any) {
      console.error('Error adjusting for business hours:', error);
      return scheduledTime; // Return original time on error
    }
  }

  protected getFieldValue(data: any, field: string): any {
    if (!data || !field) {
      return undefined;
    }

    try {
      // Handle direct field access
      if (!field.includes('.')) {
        return data[field];
      }

      // Handle nested field access with safety checks
      const fieldParts = field.split('.');
      let current = data;
      
      for (const part of fieldParts) {
        if (current === null || current === undefined) {
          return undefined;
        }
        
        // Handle array access like "tags[0]" or "customFields[fieldName]"
        if (part.includes('[') && part.includes(']')) {
          const [arrayField, indexPart] = part.split('[');
          const index = indexPart.replace(']', '');
          
          current = current[arrayField];
          
          if (!current) {
            return undefined;
          }
          
          // Handle numeric array index
          if (/^\d+$/.test(index)) {
            const numIndex = parseInt(index, 10);
            current = Array.isArray(current) ? current[numIndex] : undefined;
          } else {
            // Handle string key for object access
            current = current[index];
          }
        } else {
          current = current[part];
        }
      }
      
      return current;
    } catch (error) {
      console.warn(`Error accessing field '${field}' on data:`, error);
      return undefined;
    }
  }

  protected validateSequenceExecution(
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep,
    subscriberData: any
  ): { isValid: boolean; error?: string } {
    // Check if sequence is active
    if (sequence.status !== 'active') {
      return { isValid: false, error: `Sequence is not active: ${sequence.status}` };
    }

    // Check if enrollment is active
    if (enrollment.status !== 'active') {
      return { isValid: false, error: `Enrollment is not active: ${enrollment.status}` };
    }

    // Check if step is active
    if (!step.isActive) {
      return { isValid: false, error: 'Step is not active' };
    }

    // Check if subscriber still exists and is subscribed
    if (!subscriberData || subscriberData.status === 'unsubscribed') {
      return { isValid: false, error: 'Subscriber is unsubscribed or does not exist' };
    }

    // Check for sequence-specific exit conditions
    if (subscriberData.globalUnsubscribe) {
      return { isValid: false, error: 'Subscriber has globally unsubscribed' };
    }

    return { isValid: true };
  }

  protected async handleStepExecutionError(
    error: Error,
    sequence: MarketingSequence,
    enrollment: SequenceEnrollment,
    step: SequenceStep
  ): Promise<SequenceProcessorResult> {
    console.error(`❌ Step execution error for ${step.type} step ${step.id}:`, error);

    // Determine if error is retryable
    const isRetryable = this.isRetryableError(error);
    
    if (isRetryable && (step.config?.retryCount || 0) < 3) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, step.config?.retryCount || 0) * 60 * 1000; // Minutes to milliseconds
      const nextScheduledAt = new Date(Date.now() + retryDelay);
      
      return {
        success: false,
        error: `Retryable error: ${error.message}`,
        nextScheduledAt,
        metadata: {
          retryAttempt: (step.config?.retryCount || 0) + 1,
          isRetry: true,
        },
      };
    }

    // Non-retryable error or max retries reached - exit sequence
    return {
      success: false,
      error: error.message,
      shouldExit: true,
      exitReason: 'step_execution_failed',
    };
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'Rate limit',
      'Timeout',
      '429',
      '502',
      '503',
      '504',
    ];

    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || error.name.includes(retryableError)
    );
  }

  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
