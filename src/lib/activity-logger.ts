import { supabase } from '@/integrations/supabase/client';

export type ActivityAction = 
  | 'login' 
  | 'logout' 
  | 'view' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'print' 
  | 'search' 
  | 'approve' 
  | 'reject'
  | 'payment'
  | 'redeem'
  | 'reloan';

export interface LogActivityParams {
  action: ActivityAction;
  module: string;
  entityType?: string;
  entityId?: string;
  entityIdentifier?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log user activity to the activity_logs table
 * This function is fire-and-forget and won't block the main operation
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('client_id, branch_id, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.client_id) return;

    // Use type assertion since types may not be regenerated yet
    await (supabase.from('activity_logs') as any).insert({
      client_id: profile.client_id,
      branch_id: profile.branch_id,
      user_id: user.id,
      user_name: profile.full_name || user.email,
      action: params.action,
      module: params.module,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      entity_identifier: params.entityIdentifier || null,
      description: params.description || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    // Silent fail - activity logging should never break the main app flow
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper to log page views
 */
export function logPageView(module: string, pageTitle?: string): void {
  logActivity({
    action: 'view',
    module,
    description: pageTitle ? `Viewed ${pageTitle}` : `Viewed ${module} page`,
  });
}

/**
 * Helper to log entity creation
 */
export function logCreate(
  module: string, 
  entityType: string, 
  entityId: string, 
  entityIdentifier: string,
  description?: string
): void {
  logActivity({
    action: 'create',
    module,
    entityType,
    entityId,
    entityIdentifier,
    description: description || `Created ${entityType} ${entityIdentifier}`,
  });
}

/**
 * Helper to log entity updates
 */
export function logUpdate(
  module: string, 
  entityType: string, 
  entityId: string, 
  entityIdentifier: string,
  description?: string
): void {
  logActivity({
    action: 'update',
    module,
    entityType,
    entityId,
    entityIdentifier,
    description: description || `Updated ${entityType} ${entityIdentifier}`,
  });
}

/**
 * Helper to log entity deletion
 */
export function logDelete(
  module: string, 
  entityType: string, 
  entityId: string, 
  entityIdentifier: string,
  description?: string
): void {
  logActivity({
    action: 'delete',
    module,
    entityType,
    entityId,
    entityIdentifier,
    description: description || `Deleted ${entityType} ${entityIdentifier}`,
  });
}

/**
 * Helper to log exports
 */
export function logExport(module: string, format: string, recordCount?: number): void {
  logActivity({
    action: 'export',
    module,
    description: `Exported ${recordCount ? `${recordCount} records` : 'data'} as ${format}`,
    metadata: { format, recordCount },
  });
}

/**
 * Helper to log print operations
 */
export function logPrint(
  module: string, 
  entityType: string, 
  entityId: string, 
  entityIdentifier: string,
  documentType?: string
): void {
  logActivity({
    action: 'print',
    module,
    entityType,
    entityId,
    entityIdentifier,
    description: `Printed ${documentType || entityType} for ${entityIdentifier}`,
    metadata: { documentType },
  });
}
