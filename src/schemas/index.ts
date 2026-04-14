import { z } from 'zod';

// Auth
export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(1),
  timezone: z.string().optional().default('UTC'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const EditProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    timezone: z.string().optional(),
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
});

export const UpdateNotificationSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(255).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    day: z.coerce.number().int().min(1).max(31).optional(),
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
