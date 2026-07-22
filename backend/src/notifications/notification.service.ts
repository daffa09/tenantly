import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TASK_QUEUE_NAME, TaskAssignmentJobData } from './notification.processor';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(TASK_QUEUE_NAME) private readonly taskQueue: Queue,
  ) {}

  async dispatchTaskAssigned(data: TaskAssignmentJobData) {
    try {
      const job = await this.taskQueue.add('send-task-assignment-notification', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      this.logger.log(`Queued async notification job #${job.id} for task assignment to ${data.assigneeEmail}`);
    } catch (err: any) {
      this.logger.warn(`Redis queue offline. Fallback inline log for async job: ${err?.message}`);
      this.logger.log(
        `📧 [FALLBACK MOCK EMAIL] Notification to ${data.assigneeEmail}: Task "${data.taskTitle}" assigned.`
      );
    }
  }
}
