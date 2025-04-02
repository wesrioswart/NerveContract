import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null, formatString: string = "PPP"): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }
  
  return format(dateObj, formatString);
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "£0.00";
  
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string): {
  bgColor: string;
  textColor: string;
} {
  switch (status.toLowerCase()) {
    case "open":
    case "notification":
    case "quotation due":
      return { bgColor: "bg-amber-100", textColor: "text-amber-700" };
    
    case "accepted":
    case "implemented":
    case "mitigated":
    case "completed":
      return { bgColor: "bg-green-100", textColor: "text-green-700" };
    
    case "rejected":
      return { bgColor: "bg-red-100", textColor: "text-red-700" };
    
    case "in progress":
      return { bgColor: "bg-blue-100", textColor: "text-blue-700" };
    
    case "closed":
      return { bgColor: "bg-gray-100", textColor: "text-gray-700" };
    
    default:
      return { bgColor: "bg-gray-100", textColor: "text-gray-700" };
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
