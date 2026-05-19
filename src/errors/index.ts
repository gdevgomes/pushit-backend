export interface ErrorDefinition {
  readonly code: number;
  readonly key: string;
  readonly status: number;
}

export const Errors = {
  // Auth (1xxx)
  USER_EXISTS:              { code: 1001, key: 'USER_EXISTS',              status: 409 },
  PASSWORD_REQUIRED:        { code: 1002, key: 'PASSWORD_REQUIRED',        status: 400 },
  PASSWORD_MISMATCH:        { code: 1003, key: 'PASSWORD_MISMATCH',        status: 400 },
  USER_NOT_FOUND:           { code: 1004, key: 'USER_NOT_FOUND',           status: 404 },
  INVALID_PASSWORD:         { code: 1005, key: 'INVALID_PASSWORD',         status: 401 },
  NAME_REQUIRED:            { code: 1006, key: 'NAME_REQUIRED',            status: 400 },
  UNAUTHORIZED:             { code: 1007, key: 'UNAUTHORIZED',             status: 401 },
  ACCOUNT_ALREADY_ELEVATED: { code: 1009, key: 'ACCOUNT_ALREADY_ELEVATED', status: 409 },
  ELEVATED_ACCOUNT_REQUIRED:{ code: 1010, key: 'ELEVATED_ACCOUNT_REQUIRED',status: 403 },

  // Group (2xxx)
  GROUP_NOT_FOUND:          { code: 2001, key: 'GROUP_NOT_FOUND',          status: 404 },
  TRIAL_GROUP_EXISTS:       { code: 2002, key: 'TRIAL_GROUP_EXISTS',       status: 400 },
  ALREADY_IN_GROUP:         { code: 2003, key: 'ALREADY_IN_GROUP',         status: 400 },
  NOT_IN_GROUP:             { code: 2004, key: 'NOT_IN_GROUP',             status: 400 },
  GROUP_ACCESS_DENIED:      { code: 2005, key: 'GROUP_ACCESS_DENIED',      status: 403 },
  MEMBER_LIMIT_REACHED:     { code: 2006, key: 'MEMBER_LIMIT_REACHED',     status: 400 },
  ONLY_OWNER_CAN_KICK:      { code: 2007, key: 'ONLY_OWNER_CAN_KICK',      status: 403 },
  OWNER_CANNOT_LEAVE:       { code: 2008, key: 'OWNER_CANNOT_LEAVE',       status: 400 },
  ONLY_OWNER_CAN_EDIT:      { code: 2009, key: 'ONLY_OWNER_CAN_EDIT',      status: 403 },
  ONLY_OWNER_CAN_VIEW_SUB:  { code: 2010, key: 'ONLY_OWNER_CAN_VIEW_SUB',  status: 403 },
  NOT_GROUP_OWNER:          { code: 2011, key: 'NOT_GROUP_OWNER',          status: 403 },
  NEW_OWNER_NOT_IN_GROUP:   { code: 2012, key: 'NEW_OWNER_NOT_IN_GROUP',   status: 400 },
  ONLY_OWNER_CAN_DELETE:    { code: 2013, key: 'ONLY_OWNER_CAN_DELETE',    status: 403 },

  // Subscription / Payment (3xxx)
  SUBSCRIPTION_NOT_FOUND:        { code: 3001, key: 'SUBSCRIPTION_NOT_FOUND',        status: 404 },
  SUBSCRIPTION_CANCELLED:        { code: 3002, key: 'SUBSCRIPTION_CANCELLED',        status: 400 },
  ONLY_OWNER_CAN_PAY:            { code: 3003, key: 'ONLY_OWNER_CAN_PAY',            status: 403 },
  ONLY_OWNER_CAN_VIEW_PAYMENTS:  { code: 3004, key: 'ONLY_OWNER_CAN_VIEW_PAYMENTS',  status: 403 },
  WEBHOOK_INVALID_SIGNATURE:     { code: 3005, key: 'WEBHOOK_INVALID_SIGNATURE',     status: 401 },

  // Notification (4xxx)
  NOTIFICATION_LIMIT_REACHED: { code: 4001, key: 'NOTIFICATION_LIMIT_REACHED', status: 400 },
  NOTIFICATION_NOT_FOUND:     { code: 4002, key: 'NOTIFICATION_NOT_FOUND',     status: 404 },
  NOTIFICATION_ACCESS_DENIED: { code: 4003, key: 'NOTIFICATION_ACCESS_DENIED', status: 403 },

  // Plans (5xxx)
  STARTER_PLAN_NOT_FOUND:  { code: 5001, key: 'STARTER_PLAN_NOT_FOUND',  status: 500 },
  PLAN_NOT_FOUND:          { code: 5002, key: 'PLAN_NOT_FOUND',          status: 400 },
  SANDBOX_PLAN_NOT_FOUND:  { code: 5003, key: 'SANDBOX_PLAN_NOT_FOUND',  status: 500 },
  PLAN_NOT_UPGRADEABLE:    { code: 5004, key: 'PLAN_NOT_UPGRADEABLE',    status: 400 },
  SUBSCRIPTION_FREE_PLAN:  { code: 5005, key: 'SUBSCRIPTION_FREE_PLAN',  status: 400 },

  // External / Infrastructure (6xxx)
  ABACATE_PAY_KEY_MISSING:  { code: 6001, key: 'ABACATE_PAY_KEY_MISSING',  status: 500 },
  ABACATE_PAY_BAD_RESPONSE: { code: 6002, key: 'ABACATE_PAY_BAD_RESPONSE', status: 502 },
  ABACATE_PAY_ERROR:        { code: 6003, key: 'ABACATE_PAY_ERROR',        status: 502 },
} as const satisfies Record<string, ErrorDefinition>;

export class AppError extends Error {
  public readonly code: number;
  public readonly key: string;
  public readonly statusCode: number;
  public readonly detail?: string;
  public readonly isOperational = true;

  constructor(error: ErrorDefinition, detail?: string) {
    super(error.key);
    this.code = error.code;
    this.key = error.key;
    this.statusCode = error.status;
    if (detail !== undefined) this.detail = detail;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
