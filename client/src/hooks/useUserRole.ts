import { useUser } from '@/contexts/user-context';

export function useUserRole() {
  let user = null;
  
  try {
    const context = useUser();
    user = context.user;
  } catch (error) {
    // Return safe defaults when context is not available
    return {
      user: null,
      isAdmin: false,
      isMaintenance: false,
      isSystemUser: false,
      canAccessSystemTools: false,
      canAccessAIHealthMonitoring: false,
      canAccessDeveloperTools: false,
    };
  }
  
  const isAdmin = user?.role === 'Admin' || user?.role === 'System Administrator';
  const isMaintenance = user?.role === 'Maintenance' || user?.role === 'Technical Support';
  const isSystemUser = isAdmin || isMaintenance;
  
  const canAccessSystemTools = isSystemUser;
  const canAccessAIHealthMonitoring = isSystemUser;
  const canAccessDeveloperTools = isSystemUser;
  
  return {
    user,
    isAdmin,
    isMaintenance,
    isSystemUser,
    canAccessSystemTools,
    canAccessAIHealthMonitoring,
    canAccessDeveloperTools,
  };
}