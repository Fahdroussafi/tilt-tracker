import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../enums/audit-action.enum';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_DESCRIPTION_KEY = 'audit_description';

export const Audit = (action: AuditAction, description?: string) => {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUDIT_ACTION_KEY, action)(target, propertyKey, descriptor);
    if (description) {
      SetMetadata(AUDIT_DESCRIPTION_KEY, description)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};
