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