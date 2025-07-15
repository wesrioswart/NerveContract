import { Badge } from '@/components/ui/badge';
import { Shield, Settings, Wrench } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export function SystemRoleIndicator() {
  const { isAdmin, isMaintenance, isSystemUser } = useUserRole();
  
  if (!isSystemUser) return null;
  
  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Badge variant="destructive" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      )}
      {isMaintenance && (
        <Badge variant="secondary" className="text-xs">
          <Wrench className="h-3 w-3 mr-1" />
          Maintenance
        </Badge>
      )}
      <Badge variant="outline" className="text-xs">
        <Settings className="h-3 w-3 mr-1" />
        System Access
      </Badge>
    </div>
  );
}