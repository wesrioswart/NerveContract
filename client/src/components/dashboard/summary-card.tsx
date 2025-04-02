import { formatCurrency } from "@/lib/utils";

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
      bg: "bg-primary",
      bgLight: "bg-primary bg-opacity-10",
      text: "text-primary",
    },
    warning: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-500 bg-opacity-10",
      text: "text-amber-500",
    },
    error: {
      bg: "bg-red-600",
      bgLight: "bg-red-600 bg-opacity-10",
      text: "text-red-600",
    },
    secondary: {
      bg: "bg-cyan-700",
      bgLight: "bg-cyan-700 bg-opacity-10",
      text: "text-cyan-700",
    },
  };

  const colors = colorVariants[color];

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">
          {typeof value === "number" && title.includes("Payment") 
            ? formatCurrency(value) 
            : value}
        </p>
        {status && (
          <p className={`text-xs flex items-center ${colors.text}`}>
            {statusIcon && (
              <span className="material-icons text-sm mr-0.5">{statusIcon}</span>
            )}
            {status}
          </p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-full ${colors.bgLight} flex items-center justify-center`}>
        <span className={`material-icons ${colors.text}`}>{icon}</span>
      </div>
    </div>
  );
}
