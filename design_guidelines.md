# HMS Core - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design 3 with healthcare industry adaptations. This enterprise healthcare system prioritizes usability, accessibility, and professional trust over visual flair.

## Core Design Principles
- **Clinical Clarity**: Information hierarchy that supports medical decision-making
- **Professional Trust**: Conservative design that instills confidence in healthcare professionals
- **Efficient Workflows**: Minimal cognitive load for users managing critical patient data
- **Accessibility First**: WCAG 2.1 AA compliance for diverse healthcare workers

## Color Palette

### Primary Colors
- **Primary**: 210 100% 50% (Medical blue - trust and professionalism)
- **Primary Container**: 210 100% 95% (Light blue backgrounds)

### Semantic Colors
- **Success**: 142 71% 45% (Medical green for positive statuses)
- **Warning**: 38 92% 50% (Amber for caution states)
- **Error**: 0 84% 60% (Medical red for critical alerts)
- **Info**: 210 100% 70% (Lighter blue for informational states)

### Neutral Colors
- **Surface**: 0 0% 98% (Light mode primary background)
- **Surface Variant**: 210 20% 96% (Card backgrounds)
- **Outline**: 210 25% 84% (Borders and dividers)

### Dark Mode
- **Surface**: 210 15% 8% (Dark primary background)
- **Surface Variant**: 210 15% 12% (Dark card backgrounds)
- **Primary**: 210 100% 80% (Adjusted for dark contrast)

## Typography
**Primary Font**: Inter (Google Fonts)
- **Display**: Inter 600 (32px) - Page titles
- **Headline**: Inter 500 (24px) - Section headers
- **Body**: Inter 400 (16px) - Primary content
- **Caption**: Inter 400 (14px) - Supporting text
- **Label**: Inter 500 (14px) - Form labels and buttons

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 units
- **Tight spacing**: p-2, m-2 (8px) - Form elements
- **Standard spacing**: p-4, m-4 (16px) - Card padding
- **Section spacing**: p-6, m-6 (24px) - Page sections
- **Large spacing**: p-8, m-8 (32px) - Major layout divisions

## Component Library

### Navigation
- **Sidebar Navigation**: Persistent left navigation with role-based menu items
- **Top Bar**: Hospital/tenant selector, user profile, notifications
- **Breadcrumbs**: Essential for deep navigation hierarchies

### Data Display
- **Patient Cards**: Compact cards with critical info (ID, name, status)
- **Data Tables**: Sortable, filterable tables with pagination
- **Status Indicators**: Color-coded badges for patient/appointment status
- **Charts**: Clean, medical-grade data visualizations

### Forms
- **Input Fields**: Material Design 3 outlined inputs
- **Role Selectors**: Dropdown with clear role descriptions
- **Tenant Switcher**: Prominent hospital/clinic selector
- **Validation**: Real-time validation with clear error messaging

### Overlays
- **Modal Dialogs**: Patient detail views, confirmation dialogs
- **Drawer Panels**: Quick actions, additional patient information
- **Toast Notifications**: System alerts, success confirmations

## Dashboard-Specific Design Enhancements

### Medical Gradients & Visual Elements
- **Primary Gradient**: `bg-gradient-to-br from-blue-50 via-white to-blue-50/50` (Light mode)
- **Card Gradients**: `bg-gradient-to-r from-white to-blue-50/30` for stat cards
- **Accent Gradients**: `bg-gradient-to-r from-primary/10 via-primary/5 to-transparent`
- **Emergency Gradients**: `bg-gradient-to-r from-destructive/10 to-destructive/5` for urgent items
- **Success Gradients**: `bg-gradient-to-r from-green-50 to-emerald-50/30` for positive metrics

### Enhanced Visual Hierarchy
- **Stat Cards**: Elevated cards with subtle shadows and gradient backgrounds
- **Icon Styling**: Medical icons with proper sizing (h-5 w-5 for stats, h-4 w-4 for actions)
- **Typography Scale**: 
  - Dashboard title: `text-2xl md:text-3xl font-semibold`
  - Section headers: `text-lg font-medium`
  - Stat values: `text-2xl md:text-3xl font-bold`
  - Supporting text: `text-sm text-muted-foreground`

### Responsive Breakpoints (Mobile-First)
- **Mobile**: `base` - Single column layout, compact spacing
- **Tablet**: `md:` (768px+) - 2-column grid for stats, stacked sections
- **Desktop**: `lg:` (1024px+) - 4-column stats grid, side-by-side sections
- **Large Desktop**: `xl:` (1280px+) - Expanded spacing and larger components

### Dashboard Layout Patterns
- **Stats Grid**: `grid gap-4 md:grid-cols-2 lg:grid-cols-4`
- **Section Grid**: `grid gap-6 md:grid-cols-2 xl:grid-cols-3`
- **Container Spacing**: `space-y-6` for main sections, `space-y-4` for subsections
- **Card Padding**: `p-6` on desktop, `p-4` on mobile
- **Icon Spacing**: `mr-2` for inline icons, `mb-2` for stacked layouts

### Medical-Themed Visual Elements
- **Status Indicators**: Colored dots with proper medical semantics
  - Critical/Emergency: `bg-red-500`
  - Warning/Attention: `bg-amber-500`
  - Normal/Success: `bg-green-500`
  - Info/Pending: `bg-blue-500`
- **Activity Timeline**: Left border indicators with role-based colors
- **Hover Effects**: Subtle elevation with `hover-elevate` utility
- **Focus States**: Enhanced focus rings for accessibility
- **Loading States**: Medical-themed skeleton components

### Dashboard Card Styling
- **Stat Cards**: 
  - Background: `bg-gradient-to-br from-card via-card/95 to-card/90`
  - Border: Subtle with `border-card-border/50`
  - Shadow: `shadow-sm hover:shadow-md` transition
  - Icon container: Subtle background with role-appropriate colors
- **Quick Actions**: 
  - Button styling: `variant="outline"` with medical icons
  - Hover states: Subtle background changes
  - Loading states: Disabled appearance with spinner
- **Activity Feed**:
  - Timeline design with connecting lines
  - Badge indicators for activity types
  - Relative timestamps with proper spacing

## Healthcare-Specific Considerations
- **Patient Privacy**: Subtle indicators when viewing sensitive data
- **Emergency States**: Clear visual hierarchy for urgent patient needs
- **Multi-Role Context**: Visual cues for current role/permissions
- **Tenant Isolation**: Clear indicators of current hospital context
- **Audit Trail**: Subtle but visible activity logging indicators

## Accessibility Features
- **High Contrast**: All text meets 4.5:1 contrast ratio minimum
- **Focus Management**: Clear focus indicators for keyboard navigation
- **Screen Reader**: Semantic HTML with appropriate ARIA labels
- **Color Independence**: Status never conveyed by color alone
- **Responsive Design**: Mobile-friendly for healthcare workers on tablets

This design system prioritizes the critical nature of healthcare data while maintaining the efficiency healthcare professionals need in their daily workflows.