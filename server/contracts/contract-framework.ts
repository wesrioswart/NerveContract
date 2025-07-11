/**
 * Contract Framework Abstraction Layer
 * Supports NEC4, JCT, FIDIC, and other contract types with pluggable rule engines
 */

export interface ContractRule {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  deadlineRules: DeadlineRule[];
  complianceChecks: ComplianceCheck[];
  escalationRules: EscalationRule[];
}

export interface DeadlineRule {
  eventType: 'compensation_event' | 'early_warning' | 'variation' | 'extension_of_time';
  baseDeadlineDays: number;
  extensionCriteria: string[];
  mandatoryNotifications: string[];
  penaltyClause?: string;
}

export interface ComplianceCheck {
  ruleId: string;
  checkType: 'automatic' | 'manual' | 'ai_assisted';
  criteria: string[];
  violations: string[];
  remedialActions: string[];
}

export interface EscalationRule {
  condition: string;
  escalationLevel: 'low' | 'medium' | 'high' | 'critical';
  notificationRequired: boolean;
  actionRequired: string[];
}

export abstract class ContractFramework {
  protected contractType: string;
  protected rules: ContractRule[];
  
  constructor(contractType: string) {
    this.contractType = contractType;
    this.rules = [];
  }
  
  abstract loadRules(): Promise<void>;
  abstract validateCompensationEvent(event: any): Promise<ComplianceCheck>;
  abstract validateEarlyWarning(warning: any): Promise<ComplianceCheck>;
  abstract calculateDeadlines(event: any, eventType: string): Promise<Date[]>;
  abstract getClauseReference(eventType: string, condition: string): string;
  abstract getEscalationRules(eventType: string): EscalationRule[];
}

/**
 * NEC4 Contract Framework Implementation
 */
export class NEC4Framework extends ContractFramework {
  constructor() {
    super('NEC4');
  }
  
  async loadRules(): Promise<void> {
    this.rules = [
      {
        id: 'nec4-ce-notification',
        name: 'Compensation Event Notification',
        description: 'NEC4 8-week notification requirement',
        triggerConditions: ['compensation_event_raised'],
        deadlineRules: [{
          eventType: 'compensation_event',
          baseDeadlineDays: 56, // 8 weeks
          extensionCriteria: ['complexity_high', 'value_over_threshold'],
          mandatoryNotifications: ['project_manager', 'contractor'],
          penaltyClause: 'NEC4 Clause 61.3'
        }],
        complianceChecks: [{
          ruleId: 'nec4-ce-notification',
          checkType: 'automatic',
          criteria: ['notification_within_8_weeks', 'proper_documentation'],
          violations: ['late_notification', 'incomplete_documentation'],
          remedialActions: ['immediate_escalation', 'documentation_review']
        }],
        escalationRules: [{
          condition: 'overdue_7_days',
          escalationLevel: 'high',
          notificationRequired: true,
          actionRequired: ['urgent_review', 'client_notification']
        }]
      },
      {
        id: 'nec4-early-warning',
        name: 'Early Warning Requirement',
        description: 'NEC4 Early Warning obligation',
        triggerConditions: ['risk_identified', 'programme_impact'],
        deadlineRules: [{
          eventType: 'early_warning',
          baseDeadlineDays: 0, // Immediate
          extensionCriteria: [],
          mandatoryNotifications: ['all_parties'],
          penaltyClause: 'NEC4 Clause 16.1'
        }],
        complianceChecks: [{
          ruleId: 'nec4-early-warning',
          checkType: 'ai_assisted',
          criteria: ['timely_notification', 'impact_assessment'],
          violations: ['delayed_warning', 'insufficient_detail'],
          remedialActions: ['immediate_meeting', 'mitigation_plan']
        }],
        escalationRules: [{
          condition: 'no_early_warning_for_ce',
          escalationLevel: 'medium',
          notificationRequired: true,
          actionRequired: ['retrospective_warning', 'process_review']
        }]
      }
    ];
  }
  
  async validateCompensationEvent(event: any): Promise<ComplianceCheck> {
    const rule = this.rules.find(r => r.id === 'nec4-ce-notification');
    if (!rule) throw new Error('NEC4 CE rule not found');
    
    return {
      ruleId: 'nec4-ce-notification',
      checkType: 'automatic',
      criteria: rule.complianceChecks[0].criteria,
      violations: [],
      remedialActions: []
    };
  }
  
  async validateEarlyWarning(warning: any): Promise<ComplianceCheck> {
    const rule = this.rules.find(r => r.id === 'nec4-early-warning');
    if (!rule) throw new Error('NEC4 EW rule not found');
    
    return {
      ruleId: 'nec4-early-warning',
      checkType: 'ai_assisted',
      criteria: rule.complianceChecks[0].criteria,
      violations: [],
      remedialActions: []
    };
  }
  
  async calculateDeadlines(event: any, eventType: string): Promise<Date[]> {
    const rule = this.rules.find(r => r.deadlineRules.some(dr => dr.eventType === eventType));
    if (!rule) return [];
    
    const deadlineRule = rule.deadlineRules.find(dr => dr.eventType === eventType);
    if (!deadlineRule) return [];
    
    const baseDeadline = new Date(Date.now() + deadlineRule.baseDeadlineDays * 24 * 60 * 60 * 1000);
    return [baseDeadline];
  }
  
  getClauseReference(eventType: string, condition: string): string {
    const clauseMap = {
      'compensation_event': 'NEC4 Clause 60.1',
      'early_warning': 'NEC4 Clause 16.1',
      'programme_update': 'NEC4 Clause 32.1',
      'change_in_law': 'NEC4 Clause 60.1(19)'
    };
    
    return clauseMap[eventType] || 'NEC4 General Conditions';
  }
  
  getEscalationRules(eventType: string): EscalationRule[] {
    const rule = this.rules.find(r => r.deadlineRules.some(dr => dr.eventType === eventType));
    return rule ? rule.escalationRules : [];
  }
}

/**
 * JCT Contract Framework Implementation
 */
export class JCTFramework extends ContractFramework {
  constructor() {
    super('JCT');
  }
  
  async loadRules(): Promise<void> {
    this.rules = [
      {
        id: 'jct-variation-instruction',
        name: 'Variation Instruction',
        description: 'JCT Variation process and deadlines',
        triggerConditions: ['variation_requested'],
        deadlineRules: [{
          eventType: 'compensation_event',
          baseDeadlineDays: 21, // 3 weeks for quotation
          extensionCriteria: ['complex_variation', 'design_required'],
          mandatoryNotifications: ['architect', 'contractor'],
          penaltyClause: 'JCT Clause 5.2'
        }],
        complianceChecks: [{
          ruleId: 'jct-variation-instruction',
          checkType: 'manual',
          criteria: ['architect_instruction', 'cost_breakdown', 'time_assessment'],
          violations: ['unauthorised_variation', 'incomplete_quotation'],
          remedialActions: ['formal_instruction', 'cost_assessment']
        }],
        escalationRules: [{
          condition: 'overdue_quotation',
          escalationLevel: 'medium',
          notificationRequired: true,
          actionRequired: ['architect_review', 'deadline_extension']
        }]
      }
    ];
  }
  
  async validateCompensationEvent(event: any): Promise<ComplianceCheck> {
    return {
      ruleId: 'jct-variation-instruction',
      checkType: 'manual',
      criteria: ['architect_instruction', 'cost_breakdown'],
      violations: [],
      remedialActions: []
    };
  }
  
  async validateEarlyWarning(warning: any): Promise<ComplianceCheck> {
    return {
      ruleId: 'jct-early-warning',
      checkType: 'manual',
      criteria: ['timely_notification'],
      violations: [],
      remedialActions: []
    };
  }
  
  async calculateDeadlines(event: any, eventType: string): Promise<Date[]> {
    return [new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)]; // 21 days default
  }
  
  getClauseReference(eventType: string, condition: string): string {
    const clauseMap = {
      'compensation_event': 'JCT Clause 5.2',
      'extension_of_time': 'JCT Clause 2.28',
      'loss_expense': 'JCT Clause 4.23'
    };
    
    return clauseMap[eventType] || 'JCT General Conditions';
  }
  
  getEscalationRules(eventType: string): EscalationRule[] {
    return this.rules.find(r => r.deadlineRules.some(dr => dr.eventType === eventType))?.escalationRules || [];
  }
}

/**
 * FIDIC Contract Framework Implementation
 */
export class FIDICFramework extends ContractFramework {
  constructor() {
    super('FIDIC');
  }
  
  async loadRules(): Promise<void> {
    this.rules = [
      {
        id: 'fidic-variation-order',
        name: 'Variation Order',
        description: 'FIDIC Variation process',
        triggerConditions: ['variation_ordered'],
        deadlineRules: [{
          eventType: 'compensation_event',
          baseDeadlineDays: 28, // 4 weeks
          extensionCriteria: ['major_variation', 'design_development'],
          mandatoryNotifications: ['engineer', 'contractor'],
          penaltyClause: 'FIDIC Clause 13.3'
        }],
        complianceChecks: [{
          ruleId: 'fidic-variation-order',
          checkType: 'automatic',
          criteria: ['engineer_instruction', 'cost_impact', 'time_impact'],
          violations: ['unauthorized_work', 'incomplete_submission'],
          remedialActions: ['formal_instruction', 'impact_assessment']
        }],
        escalationRules: [{
          condition: 'disputed_variation',
          escalationLevel: 'high',
          notificationRequired: true,
          actionRequired: ['engineer_determination', 'dispute_resolution']
        }]
      }
    ];
  }
  
  async validateCompensationEvent(event: any): Promise<ComplianceCheck> {
    return {
      ruleId: 'fidic-variation-order',
      checkType: 'automatic',
      criteria: ['engineer_instruction', 'cost_impact'],
      violations: [],
      remedialActions: []
    };
  }
  
  async validateEarlyWarning(warning: any): Promise<ComplianceCheck> {
    return {
      ruleId: 'fidic-early-warning',
      checkType: 'automatic',
      criteria: ['timely_notification'],
      violations: [],
      remedialActions: []
    };
  }
  
  async calculateDeadlines(event: any, eventType: string): Promise<Date[]> {
    return [new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)]; // 28 days default
  }
  
  getClauseReference(eventType: string, condition: string): string {
    const clauseMap = {
      'compensation_event': 'FIDIC Clause 13.3',
      'extension_of_time': 'FIDIC Clause 8.4',
      'additional_payment': 'FIDIC Clause 13.3'
    };
    
    return clauseMap[eventType] || 'FIDIC General Conditions';
  }
  
  getEscalationRules(eventType: string): EscalationRule[] {
    return this.rules.find(r => r.deadlineRules.some(dr => dr.eventType === eventType))?.escalationRules || [];
  }
}

/**
 * Contract Framework Factory
 */
export class ContractFrameworkFactory {
  static createFramework(contractType: string): ContractFramework {
    switch (contractType.toLowerCase()) {
      case 'nec4':
      case 'nec4 ecc':
      case 'nec4 option c':
        return new NEC4Framework();
      case 'jct':
      case 'jct design and build':
      case 'jct standard building contract':
        return new JCTFramework();
      case 'fidic':
      case 'fidic red book':
      case 'fidic yellow book':
        return new FIDICFramework();
      default:
        throw new Error(`Unsupported contract type: ${contractType}`);
    }
  }
}