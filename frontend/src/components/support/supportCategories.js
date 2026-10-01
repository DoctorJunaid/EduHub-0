import {
  BookOpen,
  Calendar,
  CreditCard,
  Bookmark,
  Bus,
  User,
  AlertTriangle,
  DollarSign,
  HelpCircle,
  Bug,
  Lightbulb,
} from "lucide-react";

/**
 * Canonical EduHub Support Categories with matching Lucide icons.
 * Replaces raw inconsistent emojis with professional, uniform SVG icons.
 */
export const CANONICAL_SUPPORT_CATEGORIES = [
  { id: "Academic", label: "Homework or subject", Icon: BookOpen },
  { id: "Attendance", label: "Attendance", Icon: Calendar },
  { id: "Fees & Payments", label: "Fees or payment", Icon: CreditCard },
  { id: "Library", label: "Library", Icon: Bookmark },
  { id: "Transport", label: "Transport", Icon: Bus },
  { id: "Technical Issue", label: "My account", Icon: User },
  { id: "Discipline", label: "Discipline", Icon: AlertTriangle },
  { id: "Payroll", label: "Salary", Icon: DollarSign },
  { id: "Other", label: "Something else", Icon: HelpCircle },
  { id: "Platform Bug", label: "Platform Bug", Icon: Bug },
  { id: "Feature Request", label: "Feature Request", Icon: Lightbulb },
];

/**
 * Returns the matching Lucide icon component for a category id or label.
 */
export function getCategoryIcon(categoryIdOrLabel) {
  if (!categoryIdOrLabel) return HelpCircle;
  const key = String(categoryIdOrLabel).toLowerCase().trim();
  const match = CANONICAL_SUPPORT_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === key ||
      c.label.toLowerCase() === key ||
      key.includes(c.id.toLowerCase())
  );
  return match ? match.Icon : HelpCircle;
}

/**
 * Returns canonical category label for a given id.
 */
export function getCategoryLabel(categoryIdOrLabel) {
  if (!categoryIdOrLabel) return "General";
  const key = String(categoryIdOrLabel).toLowerCase().trim();
  const match = CANONICAL_SUPPORT_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === key ||
      c.label.toLowerCase() === key ||
      key.includes(c.id.toLowerCase())
  );
  return match ? match.label : categoryIdOrLabel;
}
