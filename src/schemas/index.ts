import { z } from 'zod';

const validIanaTimezone = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid IANA timezone' }
);

// Auth
export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(1),
  timezone: validIanaTimezone.optional().default('UTC'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const EditProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    timezone: validIanaTimezone.optional(),
    email: z.email().optional(),
    currentPassword: z.string().optional(),
    password: z.string().min(6).optional(),
    confirmPassword: z.string().optional(),
    push_token: z.string().optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.timezone !== undefined ||
      d.email !== undefined ||
      d.password !== undefined ||
      d.push_token !== undefined,
    {
      message: 'At least one field must be provided',
    }
  )
  .refine((d) => !d.password || d.currentPassword, {
    message: 'Current password is required to change password',
    path: ['currentPassword'],
  })
  .refine((d) => !d.password || d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const UpgradeGroupSchema = z.object({
  plan_slug: z.string().min(1),
});

// Group
export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  plan_slug: z.string().optional(),
});

export const UpdateGroupSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(255).optional(),
  })
  .refine((d) => d.name !== undefined || d.description !== undefined, {
    message: 'At least one field (name or description) must be provided',
  });

export const JoinLeaveGroupSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

// Notification
export const CreateNotificationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  hour: z.coerce.number().int().min(0).max(23).optional(),
});

export const UpdateNotificationSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(255).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    day: z.coerce.number().int().min(1).max(31).optional(),
    hour: z.coerce.number().int().min(0).max(23).nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

// Group owner leave
export const OwnerLeaveSchema = z.object({
  nextOwnerId: z.coerce.number().int().positive().optional(),
});

export const MonthParamSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
});

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;
