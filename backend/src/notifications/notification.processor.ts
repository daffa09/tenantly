import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const TASK_QUEUE_NAME = 'task-assignment-queue';

export interface TaskAssignmentJobData {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  assigneeEmail: string;
  companyId: string;
  assignedBy: string;
}

@Processor(TASK_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<TaskAssignmentJobData, any, string>): Promise<any> {
    this.logger.log(`[ASYNC JOB PROCESSED] Job ID: ${job.id}, Name: ${job.name}`);
    const { taskTitle, assigneeEmail, assignedBy } = job.data;

    // Simulasi pengiriman email notifikasi di luar request cycle (async worker)
    this.logger.log(
      `📧 [MOCK EMAIL SENT] Notification sent to ${assigneeEmail}: Task "${taskTitle}" assigned by ${assignedBy}.`
    );

    return { status: 'SENT', sentAt: new Date().toISOString() };
  }
}
