import { z } from 'zod';

// Auth
export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(1),
  timezone: z.string().optional().default('UTC'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const EditNameSchema = z.object({
  name: z.string().min(2).max(100),
});

// Group
export const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).optional(),
}).refine((d) => d.name !== undefined || d.description !== undefined, {
  message: 'At least one field (name or description) must be provided',
});

export const JoinLeaveGroupSchema = z.object({
  groupId: z.number({ coerce: true }).int().positive(),
});

// Notification
export const CreateNotificationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  month: z.number({ coerce: true }).int().min(1).max(12),
  day: z.number({ coerce: true }).int().min(1).max(31),
});

export const UpdateNotificationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(255).optional(),
  month: z.number({ coerce: true }).int().min(1).max(12).optional(),
  day: z.number({ coerce: true }).int().min(1).max(31).optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: 'At least one field must be provided',
});

// Group owner leave
export const OwnerLeaveSchema = z.object({
  nextOwnerId: z.number({ coerce: true }).int().positive().optional(),
});

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;
