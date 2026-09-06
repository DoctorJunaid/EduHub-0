# EduHub Common Components

## Overview

EduHub uses **ShadCN UI v4** (Radix UI + Tailwind CSS v4) customized with the EduHub green theme defined in `src/index.css`.

## ShadCN Setup

| Item | Location |
|------|----------|
| Config | `components.json` |
| Utilities | `src/lib/utils.js` |
| Theme tokens | `src/index.css` (`:root` + `.dark`) |
| Path alias | `@/` → `src/` |

### Add more components

```bash
npx shadcn@latest add [component-name]
```

Example: `npx shadcn@latest add sheet popover`

## Installed ShadCN Components

| Component | File | Notes |
|-----------|------|-------|
| Button | `ui/button.jsx` | variants: default, destructive, outline, secondary, ghost, link |
| Input | `ui/input.jsx` | |
| Textarea | `ui/textarea.jsx` | |
| Label | `ui/label.jsx` | |
| Badge | `ui/badge.jsx` | |
| Card | `ui/card.jsx` | CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Table | `ui/table.jsx` | TableHeader, TableBody, TableRow, TableHead, TableCell |
| Select | `ui/select.jsx` | |
| Checkbox | `ui/checkbox.jsx` | |
| Switch | `ui/switch.jsx` | |
| Dialog | `ui/dialog.jsx` | |
| Dropdown Menu | `ui/dropdown-menu.jsx` | |
| Tooltip | `ui/tooltip.jsx` | Requires `TooltipProvider` in `main.jsx` |
| Avatar | `ui/avatar.jsx` | |
| Alert | `ui/alert.jsx` | |
| Tabs | `ui/tabs.jsx` | |
| Separator | `ui/separator.jsx` | |
| Skeleton | `ui/skeleton.jsx` | |

## Layout Components

| Component | File | ShadCN |
|-----------|------|--------|
| Sidebar | `common/Sidebar.jsx` | No — custom, includes theme toggle |
| Header | `common/Header.jsx` | No — custom |

## Usage

```jsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
```

## Theme

- ShadCN tokens (`--primary`, `--background`, etc.) are mapped to EduHub greens in `index.css`
- Dark mode uses `.dark` on `<html>`
- Toggle: Sidebar footer → `useTheme()` hook
