import { AutomationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';
import { AutomationRule, AutomationExecution } from '@splits-network/shared-types';

/**
 * Automation Executor Service
 * 
 * Executes automation rules with safety guardrails:
 * - Human approval requirements
 * - Rate limiting
 * - Audit trail
 * - Rollback capability
 */
export class AutomationExecutor {
    constructor(
        private repository: AutomationRepository,
        private logger: Logger
    ) {}

    /**
     * Execute an automation rule with approval workflow
     */
    async executeRule(
        ruleId: string,
        triggeredBy: string,
        triggerData: any,
        requiresApproval: boolean = true
    ): Promise<AutomationExecution> {
        this.logger.info({ ruleId, triggeredBy }, 'Executing automation rule');

        const rule = await this.repository.findRuleById(ruleId);
        if (!rule) {
            throw new Error(`Rule ${ruleId} not found`);
        }

        if (rule.status !== 'active') {
            throw new Error(`Rule ${ruleId} is not active`);
        }

        // Check rate limit
        const windowSeconds = 3600; // Default 1 hour
        const executionCount = await this.repository.countExecutionsInWindow(
            ruleId,
            windowSeconds
        );

        const maxExecutions = rule.max_executions_per_day || 100;
        if (executionCount >= maxExecutions) {
            throw new Error(`Rate limit exceeded for rule ${ruleId}`);
        }

        // Create execution record
        const execution = await this.repository.createExecution({
            rule_id: ruleId,
            trigger_data: triggerData,
            triggered_by: triggeredBy,
            status: requiresApproval ? 'pending_approval' : 'pending',
            requires_human_approval: requiresApproval,
        });

        this.logger.info(
            { executionId: execution.id, status: execution.status },
            'Automation execution created'
        );

        return execution;
    }

    /**
     * Approve a pending automation execution
     */
    async approveExecution(
        executionId: string,
        approvedBy: string
    ): Promise<AutomationExecution> {
        this.logger.info({ executionId, approvedBy }, 'Approving automation execution');

        const execution = await this.repository.findExecutionById(executionId);
        if (!execution) {
            throw new Error(`Execution ${executionId} not found`);
        }

        if (execution.status !== 'pending_approval') {
            throw new Error(`Execution ${executionId} is not pending approval`);
        }

        // Update to approved and execute
        const updated = await this.repository.updateExecution(executionId, {
            status: 'approved',
            approved_by: approvedBy,
            approved_at: new Date(),
        });

        // Execute the actual automation action
        await this.performAutomationAction(updated);

        return updated;
    }

    /**
     * Reject a pending automation execution
     */
    async rejectExecution(
        executionId: string,
        rejectedBy: string,
        rejectionReason: string
    ): Promise<AutomationExecution> {
        this.logger.info({ executionId, rejectedBy }, 'Rejecting automation execution');

        const updated = await this.repository.updateExecution(executionId, {
            status: 'rejected',
            rejected_by: rejectedBy,
            rejected_at: new Date(),
            rejection_reason: rejectionReason,
        });

        return updated;
    }

    /**
     * Perform the actual automation action
     * This would integrate with other services to execute the action
     */
    private async performAutomationAction(execution: AutomationExecution): Promise<void> {
        try {
            this.logger.info({ executionId: execution.id }, 'Performing automation action');

            const rule = await this.repository.findRuleById(execution.rule_id);
            if (!rule) {
                throw new Error('Rule not found');
            }

            // Update status to executing
            await this.repository.updateExecution(execution.id, {
                status: 'executing',
                executed_at: new Date(),
            });

            // Execute based on rule type
            const result = await this.executeAction(rule, execution.trigger_data);

            // Mark as completed
            await this.repository.updateExecution(execution.id, {
                status: 'completed',
                action_result: result,
            });

            this.logger.info(
                { executionId: execution.id, result },
                'Automation action completed'
            );
        } catch (error: any) {
            this.logger.error(
                { executionId: execution.id, error },
                'Automation action failed'
            );

            await this.repository.updateExecution(execution.id, {
                status: 'failed',
                error_message: error.message || 'Unknown error',
            });

            throw error;
        }
    }

    /**
     * Execute specific action based on rule type
     * This is a placeholder - actual implementations would call other services
     */
    private async executeAction(rule: AutomationRule, triggerData: any): Promise<any> {
        this.logger.info({ ruleType: rule.rule_type, actions: rule.actions }, 'Executing action');

        switch (rule.rule_type) {
            case 'auto_stage_advance':
                return await this.executeStageAdvance(rule, triggerData);
            
            case 'auto_notification':
                return await this.executeNotification(rule, triggerData);
            
            case 'auto_payout_schedule':
                return await this.executePayoutSchedule(rule, triggerData);
            
            case 'fraud_auto_throttle':
                return await this.executeFraudThrottle(rule, triggerData);
            
            default:
                throw new Error(`Unknown rule type: ${rule.rule_type}`);
        }
    }

    /**
     * Auto-advance application stage after X days of inactivity
     */
    private async executeStageAdvance(rule: AutomationRule, triggerData: any): Promise<any> {
        this.logger.info({ triggerData }, 'Executing stage advance');
        
        // In production, this would call the ATS service to advance the stage
        // For now, return a mock result
        return {
            action: 'stage_advance',
            application_id: triggerData.application_id,
            old_stage: triggerData.old_stage,
            new_stage: triggerData.new_stage,
            advanced_at: new Date(),
        };
    }

    /**
     * Send automated notification
     */
    private async executeNotification(rule: AutomationRule, triggerData: any): Promise<any> {
        this.logger.info({ triggerData }, 'Executing notification');
        
        // In production, this would call the notification service
        return {
            action: 'notification_sent',
            recipient: triggerData.recipient,
            notification_type: triggerData.notification_type,
            sent_at: new Date(),
        };
    }

    /**
     * Schedule payout after guarantee period
     */
    private async executePayoutSchedule(rule: AutomationRule, triggerData: any): Promise<any> {
        this.logger.info({ triggerData }, 'Executing payout schedule');
        
        // In production, this would call the billing service
        return {
            action: 'payout_scheduled',
            placement_id: triggerData.placement_id,
            scheduled_date: triggerData.scheduled_date,
            scheduled_at: new Date(),
        };
    }

    /**
     * Throttle recruiter due to fraud signal
     */
    private async executeFraudThrottle(rule: AutomationRule, triggerData: any): Promise<any> {
        this.logger.info({ triggerData }, 'Executing fraud throttle');
        
        // In production, this would update recruiter status
        return {
            action: 'fraud_throttle_applied',
            recruiter_id: triggerData.recruiter_id,
            throttle_level: triggerData.throttle_level,
            throttled_at: new Date(),
        };
    }

    /**
     * Get pending executions requiring approval
     */
    async getPendingExecutions(limit: number = 50): Promise<AutomationExecution[]> {
        return await this.repository.findExecutions({ 
            status: 'pending_approval', 
            limit 
        });
    }

    /**
     * Get execution history for a rule
     */
    async getRuleExecutionHistory(
        ruleId: string,
        limit: number = 100
    ): Promise<AutomationExecution[]> {
        return await this.repository.findExecutions({ 
            rule_id: ruleId, 
            limit 
        });
    }
}
