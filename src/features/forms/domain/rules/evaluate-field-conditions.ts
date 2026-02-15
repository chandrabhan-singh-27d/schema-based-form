import { ConditionalRule, FieldConditions, RuleNode } from '../types';

const isConditionalRule = (node: RuleNode): node is ConditionalRule => {
    return (
        typeof node === 'object' &&
        node !== null &&
        'field' in node &&
        'operator' in node &&
        'value' in node
    );
};

const evaluateConditionRule = (condition: ConditionalRule, data: Record<string, unknown>): boolean => {
    const dependentValue = data[condition.field];

    switch (condition.operator) {
        case 'eq':
            return dependentValue === condition.value;
        case 'neq':
            return dependentValue !== condition.value;
        case 'in':
            return Array.isArray(condition.value)
                ? condition.value.some((value) => value === dependentValue)
                : false;
        case 'nin':
            return Array.isArray(condition.value)
                ? !condition.value.some((value) => value === dependentValue)
                : false;
        default:
            return true;
    }
};

const evaluateRuleNode = (node: RuleNode, data: Record<string, unknown>): boolean => {
    if (isConditionalRule(node)) {
        return evaluateConditionRule(node, data);
    }

    if (node.all) {
        return node.all.every((child) => evaluateRuleNode(child, data));
    }

    if (node.any) {
        return node.any.some((child) => evaluateRuleNode(child, data));
    }

    if (node.not) {
        return !evaluateRuleNode(node.not, data);
    }

    // Empty rule groups default to true to avoid blocking field visibility.
    return true;
};

/**
 * Evaluates field visibility rules against current form data.
 * Supports the legacy array format (implicit AND) and nested JSON rules.
 */
export const evaluateFieldConditions = (
    conditions: FieldConditions | undefined,
    data: Record<string, unknown>
): boolean => {
    if (!conditions) {
        return true;
    }

    if (Array.isArray(conditions)) {
        return conditions.every((condition) => evaluateConditionRule(condition, data));
    }

    return evaluateRuleNode(conditions, data);
};
