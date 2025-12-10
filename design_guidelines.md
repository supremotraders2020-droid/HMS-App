# Gravity Hospital Management System - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern healthcare platforms like One Medical, Zocdoc, and healthcare-focused SaaS products. Combining Material Design 3 principles with vibrant, animation-rich interfaces that maintain medical professionalism while feeling contemporary and engaging.

## Core Design Principles
- **Vibrant Professionalism**: Modern, energetic design that maintains healthcare credibility
- **Fluid Interactions**: Smooth animations that enhance usability without distraction
- **Dynamic Clarity**: Information hierarchy enhanced through motion and visual depth
- **Adaptive Experience**: Seamless dark/light mode transitions with consistent interactions

## Color Palette

### Light Mode
- **Primary**: `hsl(195, 85%, 45%)` - Vibrant teal (medical trust with energy)
- **Primary Hover**: `hsl(195, 85%, 38%)` - Deeper teal for interactions
- **Accent**: `hsl(160, 75%, 50%)` - Energetic mint green
- **Secondary**: `hsl(210, 90%, 55%)` - Calming sky blue
- **Surface**: `hsl(0, 0%, 99%)` - Near-white base
- **Surface Elevated**: `hsl(195, 40%, 98%)` - Subtle blue-tinted cards
- **Border**: `hsl(195, 25%, 88%)` - Soft blue borders

### Dark Mode
- **Primary**: `hsl(195, 75%, 55%)` - Brighter teal for contrast
- **Primary Hover**: `hsl(195, 75%, 48%)` - Interaction state
- **Accent**: `hsl(160, 65%, 55%)` - Adjusted mint green
- **Surface**: `hsl(210, 20%, 10%)` - Rich dark blue-black
- **Surface Elevated**: `hsl(210, 18%, 14%)` - Elevated card surfaces
- **Border**: `hsl(210, 15%, 20%)` - Subtle borders

### Semantic Colors
- **Success**: `hsl(142, 70%, 48%)` / Dark: `hsl(142, 65%, 55%)`
- **Warning**: `hsl(38, 90%, 52%)` / Dark: `hsl(38, 85%, 58%)`
- **Error**: `hsl(0, 75%, 58%)` / Dark: `hsl(0, 70%, 62%)`
- **Info**: `hsl(210, 85%, 60%)` / Dark: `hsl(210, 80%, 65%)`

## Typography
**Primary Font**: Inter (Google Fonts CDN)
- **Hero**: Inter 700, 48px/56px - Landing page headlines
- **Display**: Inter 600, 32px/40px - Dashboard titles
- **Headline**: Inter 600, 24px/32px - Section headers
- **Subheading**: Inter 500, 18px/28px - Card headers
- **Body**: Inter 400, 16px/24px - Primary content
- **Small**: Inter 400, 14px/20px - Supporting text
- **Label**: Inter 500, 14px/20px - Form labels, buttons

## Layout System
**Spacing**: Tailwind units 3, 4, 6, 8, 12, 16, 20, 24
- **Component padding**: p-4, p-6 (cards, inputs)
- **Section spacing**: py-12, py-16, py-20 (page sections)
- **Grid gaps**: gap-4, gap-6, gap-8 (responsive grids)
- **Element margins**: mb-3, mb-4, mb-6 (vertical rhythm)

## Visual Effects & Animations

### Gradient Foundations
**Light Mode Cards**: `bg-gradient-to-br from-white via-blue-50/30 to-teal-50/20`
**Dark Mode Cards**: `bg-gradient-to-br from-surface-elevated via-surface-elevated to-primary/5`
**Hero Gradient**: `bg-gradient-to-br from-primary/10 via-white to-accent/10` (Light) / `from-primary/20 via-surface to-accent/10` (Dark)
**Stat Card Accents**: `bg-gradient-to-r from-primary/15 via-primary/8 to-transparent`

### Shadows & Elevation
- **Cards Default**: `shadow-sm` (subtle depth)
- **Cards Hover**: `shadow-lg shadow-primary/10` (elevated with colored glow)
- **Modals**: `shadow-2xl shadow-black/20` (strong elevation)
- **Floating Elements**: `shadow-xl shadow-primary/15` (navigation, sticky headers)

### Micro-Interactions
**Card Hover**: Scale 1.02, shadow elevation, subtle border glow (0.3s ease-out)
**Button Press**: Scale 0.98, increased shadow depth (0.15s ease-in-out)
**Icon Hover**: Rotation 5-10deg or scale 1.1 (0.2s ease)
**Stat Counters**: Count-up animation on load with ease-out timing
**Form Focus**: Border glow with primary color, scale 1.01 (0.2s ease)
**Status Badges**: Subtle pulse animation for active/critical states
**Navigation Items**: Smooth background fill and icon shift (0.25s ease)

### Page Transitions
- **Route Changes**: Fade + subtle slide (0.3s)
- **Modal Open**: Scale from 0.95 to 1 with fade (0.25s ease-out)
- **Drawer Slide**: Transform X/Y with backdrop fade (0.3s ease-in-out)
- **Toast Notifications**: Slide + fade from top-right (0.3s spring)

## Component Library

### Navigation
- **Sidebar**: Gradient background with frosted glass effect, animated hover states for items, active state with accent bar and background fill
- **Top Bar**: Elevated with subtle shadow, hospital selector with dropdown animation, notification badge with pulse
- **Breadcrumbs**: Animated chevrons on hover, underline transitions

### Data Display
- **Patient Cards**: Gradient background, status indicator with subtle pulse, hover lift effect with shadow glow
- **Stat Cards**: Large animated counter, gradient accent bar, icon with background glow, hover scale animation
- **Data Tables**: Striped rows with hover highlight, sortable headers with animated arrows, pagination with smooth transitions
- **Charts**: Animated bar/line reveals on load, interactive hover tooltips with smooth appearance

### Forms
- **Inputs**: Outlined style with focus glow, floating labels with smooth transitions, validation states with animated icons
- **Dropdowns**: Smooth expand animation, hover highlight on options, selected state with checkmark animation
- **Date Pickers**: Calendar slide-in animation, date hover effects, smooth range selection
- **Buttons**: Primary with gradient background, hover scale and shadow lift, press scale-down effect, loading spinner with smooth rotation

### Overlays
- **Modals**: Scale-in animation with backdrop blur, close button hover rotation, content fade-in stagger
- **Drawers**: Slide from edge with smooth easing, overlay backdrop with fade
- **Toasts**: Slide + fade entry, progress bar animation, dismiss swipe gesture

## Dashboard Layouts

### Responsive Grid System
- **Mobile**: Single column, compact spacing (p-4, gap-4)
- **Tablet** (md:): 2-column stats (grid-cols-2), stacked sections
- **Desktop** (lg:): 4-column stats (grid-cols-4), 2-column sections
- **Large** (xl:): Expanded spacing (p-6, gap-6), 3-column sections

### Key Dashboard Sections
- **Hero Stats Grid**: 4 animated stat cards with gradients, icons, trend indicators
- **Activity Timeline**: Left border design with role-colored indicators, relative timestamps, animated entry
- **Quick Actions**: Icon buttons with hover lift, gradient backgrounds on hover
- **Patient Overview**: Card grid with hover effects, status badges with pulse, priority sorting
- **Appointment Calendar**: Interactive date cells, hover highlights, booked slot animations

## Images

### Dashboard
- **Header Background**: Abstract medical pattern (microscopic cells, DNA strands, or heartbeat waves) with gradient overlay, placed as full-width background behind stats section
- **Empty States**: Medical illustrations (clipboard with checkmark, calendar with appointments, patient records) - friendly line-art style

### Landing/Marketing Pages
- **Hero Image**: Modern hospital interior or diverse medical team collaboration - full-bleed with gradient overlay and blurred button backgrounds
- **Feature Section**: 3-4 spot illustrations showing system features (patient management, scheduling, analytics)
- **Testimonial Section**: Hospital administrator and staff photos in authentic healthcare settings

## Accessibility
- **Color Contrast**: Minimum 4.5:1 for all text, 3:1 for UI components
- **Focus Indicators**: Prominent 2px ring with primary color, offset for visibility
- **Motion**: Respect `prefers-reduced-motion` - disable animations when enabled
- **Keyboard**: All interactive elements accessible, logical tab order, skip links
- **Screen Readers**: Semantic HTML, ARIA labels for icons/dynamic content, live regions for updates

## Dark Mode Strategy
- Automatic detection via system preference with manual toggle
- Smooth color transitions (0.3s ease) on mode switch
- Adjusted shadow intensities (lighter in dark mode)
- Enhanced glow effects for dark backgrounds
- Consistent interaction patterns across modes

This design system creates a vibrant, professional healthcare platform that feels modern and engaging while maintaining the trust and clarity essential for medical applications.