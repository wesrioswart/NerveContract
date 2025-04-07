import { formatCurrency } from "@/lib/utils";
import { CheckSquare, AlertTriangle, AlertOctagon, Receipt, ArrowUp, ArrowDown, Clock, CalendarDays } from 'lucide-react';
import { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "warning" | "error" | "secondary";
  status?: string;
  statusIcon?: string;
};

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  status,
  statusIcon,
}: SummaryCardProps) {
  // Define colors based on the color prop
  const colorVariants = {
    primary: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-50",
      text: "text-blue-500",
    },
    warning: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-50",
      text: "text-amber-500",
    },
    error: {
      bg: "bg-red-600",
      bgLight: "bg-red-50",
      text: "text-red-600",
    },
    secondary: {
      bg: "bg-cyan-700",
      bgLight: "bg-cyan-50",
      text: "text-cyan-700",
    },
  };

  const colors = colorVariants[color];

  // Map material icons to Lucide icons
  const getIcon = (): ReactNode => {
    switch (icon) {
      case 'fact_check':
        return <CheckSquare className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'report_problem':
        return <AlertOctagon className="w-6 h-6" />;
      case 'receipt':
        return <Receipt className="w-6 h-6" />;
      default:
        return <CheckSquare className="w-6 h-6" />;
    }
  };

  // Map material icons to Lucide icons for status
  const getStatusIcon = (): ReactNode => {
    if (!statusIcon) return null;
    
    switch (statusIcon) {
      case 'schedule':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'trending_down':
        return <ArrowDown className="w-3 h-3 mr-1" />;
      case 'arrow_upward':
        return <ArrowUp className="w-3 h-3 mr-1" />;
      case 'calendar_today':
        return <CalendarDays className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">
          {typeof value === "number" && title.includes("Payment") 
            ? formatCurrency(value) 
            : value}
        </p>
        {status && (
          <p className={`text-xs flex items-center mt-1 ${colors.text} font-medium`}>
            {statusIcon && getStatusIcon()}
            {status}
          </p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-full ${colors.bgLight} flex items-center justify-center`}>
        <div className={colors.text}>
          {getIcon()}
        </div>
      </div>
    </div>
  );
}
