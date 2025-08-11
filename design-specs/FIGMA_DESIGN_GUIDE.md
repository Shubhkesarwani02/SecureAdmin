# Framtt Admin Dashboard - Figma Design Guide

## 🎨 Design System Specifications

### Typography Scale
```
Base Font Size: 14px
Font Family: System UI / Inter (recommended for Figma)

Heading 1: 24px, Medium (1.714rem)
Heading 2: 20px, Medium (1.429rem) 
Heading 3: 18px, Medium (1.286rem)
Heading 4: 14px, Medium (1rem)
Body Text: 14px, Normal (1rem)
Small Text: 12px, Normal (0.857rem)
Tiny Text: 10px, Normal (0.714rem)
```

### Color Palette
```
PRIMARY COLORS:
- Primary: hsl(222.2, 47.4%, 11.2%) #1a1f2e
- Primary Foreground: hsl(210, 40%, 98%) #f8fafc
- Background: hsl(0, 0%, 100%) #ffffff
- Foreground: hsl(222.2, 84%, 4.9%) #0a0d14

SECONDARY COLORS:
- Secondary: hsl(210, 40%, 96%) #f1f5f9
- Secondary Foreground: hsl(222.2, 47.4%, 11.2%) #1a1f2e
- Muted: hsl(210, 40%, 96%) #f1f5f9
- Muted Foreground: hsl(215.4, 16.3%, 46.9%) #64748b

ACCENT COLORS:
- Accent: hsl(210, 40%, 96%) #f1f5f9
- Accent Foreground: hsl(222.2, 47.4%, 11.2%) #1a1f2e
- Border: hsl(214.3, 31.8%, 91.4%) #e2e8f0
- Input: hsl(214.3, 31.8%, 91.4%) #e2e8f0

STATUS COLORS:
- Success (Green): hsl(142, 71%, 45%) #10b981
- Warning (Yellow): hsl(48, 96%, 53%) #eab308
- Error (Red): hsl(0, 84%, 60%) #ef4444
- Info (Blue): hsl(221, 83%, 53%) #3b82f6

SIDEBAR COLORS:
- Sidebar Background: hsl(0, 0%, 98%) #fafafa
- Sidebar Foreground: hsl(222.2, 84%, 4.9%) #0a0d14
- Sidebar Primary: hsl(222.2, 47.4%, 11.2%) #1a1f2e
- Sidebar Accent: hsl(210, 40%, 96%) #f1f5f9
```

### Spacing Scale
```
Base Unit: 4px

xs: 4px   (0.25rem)
sm: 8px   (0.5rem)
md: 12px  (0.75rem)
lg: 16px  (1rem)
xl: 20px  (1.25rem)
2xl: 24px (1.5rem)
3xl: 32px (2rem)
4xl: 40px (2.5rem)
5xl: 48px (3rem)
6xl: 64px (4rem)
```

### Border Radius
```
Default: 10px (0.625rem)
Small: 6px
Large: 16px
Full: 9999px (for circular elements)
```

## 📐 Layout Specifications

### Sidebar
```
Width: 280px
Background: Sidebar Background (#fafafa)
Border Right: 1px solid Border (#e2e8f0)

Header Section:
- Height: 80px
- Padding: 24px 16px
- Logo container: 40px × 40px, rounded 8px, primary background
- Title: "Framtt Admin" (font-medium)
- Subtitle: "Superadmin Dashboard" (12px, muted)

Navigation Section:
- Padding: 16px 8px
- Menu items: 48px height, 12px padding, 8px border radius
- Active state: Primary background, white text
- Hover state: Sidebar accent background

Footer Section:
- Height: 80px
- Border top: 1px solid sidebar border
- User profile dropdown
```

### Main Content Area
```
Header:
- Height: 64px
- Background: rgba(255, 255, 255, 0.95) with backdrop blur
- Border bottom: 1px solid border
- Sticky positioned at top

Content:
- Padding: 24px
- Max width: none (full width)
- Grid gap: 24px between sections
```

### Grid System
```
Cards Grid (Overview):
- Desktop: 4 columns (1fr 1fr 1fr 1fr)
- Tablet: 2 columns (1fr 1fr)
- Mobile: 1 column (1fr)
- Gap: 16px

Charts Grid:
- Desktop: 2 columns (1fr 1fr)
- Tablet: 1 column (1fr)
- Gap: 16px

Statistics Grid:
- Desktop: 3 columns (1fr 1fr 1fr)
- Tablet: 2 columns (1fr 1fr)
- Mobile: 1 column (1fr)
- Gap: 16px
```

## 🔲 Component Specifications

### Card Component
```
Background: Card background (#ffffff)
Border: 1px solid border (#e2e8f0)
Border radius: 10px
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
Padding: 24px

Header:
- Title: H3 styling
- Description: Small text, muted foreground
- Margin bottom: 16px

Content:
- Custom padding based on content type
```

### Button Components
```
Primary Button:
- Background: Primary (#1a1f2e)
- Text: Primary foreground (#f8fafc)
- Padding: 8px 16px
- Border radius: 6px
- Height: 36px
- Font: Medium weight

Secondary Button:
- Background: Transparent
- Border: 1px solid border (#e2e8f0)
- Text: Foreground
- Same dimensions as primary

Icon Button:
- Size: 36px × 36px
- Icon size: 16px × 16px
- Background: Transparent
- Hover: Muted background
```

### Badge Components
```
Default Badge:
- Background: Primary (#1a1f2e)
- Text: Primary foreground (#f8fafc)
- Padding: 2px 8px
- Border radius: 4px
- Font size: 12px

Status Badges:
- Success: Green background (#10b981)
- Warning: Yellow background (#eab308)
- Error: Red background (#ef4444)
- Secondary: Muted background (#f1f5f9)
```

### Table Component
```
Header:
- Background: Muted (#f1f5f9)
- Text: Muted foreground (#64748b)
- Font size: 12px
- Font weight: Medium
- Padding: 12px 16px

Row:
- Height: 56px
- Padding: 12px 16px
- Border bottom: 1px solid border
- Hover: Muted background

Cell:
- Font size: 14px
- Vertical align: middle
```

## 📊 Dashboard Sections Layout

### 1. Overview Dashboard
```
Section 1 - Key Metrics (4-column grid):
- Total Rental Companies card
- Total Bookings card  
- Monthly Revenue card
- Pending KYC card

Section 2 - Charts (2-column grid):
- Revenue & Bookings Trend (Bar chart)
- Server Usage Distribution (Pie chart)

Section 3 - System Health (3-column grid):
- System Health metrics
- Recent Activity list
- Quick Actions buttons
```

### 2. Client Management
```
Section 1 - Action Bar:
- Export button (left)
- Add Client button (right)

Section 2 - Search & Filter:
- Search input with icon
- Status filter dropdown

Section 3 - Statistics (4-column grid):
- Total, Active, Inactive, Pending counts

Section 4 - Data Table:
- Full width table with 7 columns
- Action buttons in last column
```

### 3. System Monitoring
```
Section 1 - System Overview (4-column grid):
- CPU, Memory, Disk, Network usage cards

Section 2 - Performance Charts (2-column grid):
- System Resource Usage (Line chart)
- API Response Times (Area chart)

Section 3 - API Health:
- Full width cards with status indicators

Section 4 - Error Logs:
- List of log entries with badges
```

### 4. Payments & Billing
```
Section 1 - Revenue Overview (4-column grid):
- Monthly Revenue, Subscriptions, Churn Rate, Failed Payments

Section 2 - Revenue Charts (2-column grid):
- Revenue Trend (Line chart)
- Subscription Tiers (Pie chart)

Section 3 - Transactions Table:
- Full width with 8 columns

Section 4 - Renewals & Failed Payments (2-column grid):
- Upcoming renewals list
- Failed payments list
```

### 5. Snippet Manager
```
Section 1 - Action Bar:
- Search and filter controls (left)
- Generate New Code button (right)

Section 2 - Statistics (4-column grid):
- Total, Active, Web, Mobile counts

Section 3 - Integration Codes Table:
- Full width with 8 columns
- Multiple action buttons per row
```

### 6. Admin Settings
```
Tab Navigation:
- 4 tabs: Users, Security, System, Audit

User Management Tab:
- Statistics (4-column grid)
- Admin users table

Security Tab:
- Authentication settings (2-column grid)
- Notification settings

System Tab:
- Platform settings card

Audit Tab:
- Activity logs table
```

## 🎯 Figma Recreation Steps

### 1. Setup Design System
1. Create color styles for all specified colors
2. Create text styles for typography scale
3. Create effect styles for shadows and borders
4. Set up 8px grid system

### 2. Create Base Components
1. Button variants (Primary, Secondary, Icon)
2. Card component with header/content areas
3. Badge variants (Default, Success, Warning, Error)
4. Input field with icon support
5. Table components (Header, Row, Cell)
6. Navigation menu item

### 3. Build Layout Framework
1. Create sidebar frame (280px width)
2. Create main content area (remaining width)
3. Set up header component (64px height)
4. Create grid layouts for different sections

### 4. Build Dashboard Sections
1. Start with Overview Dashboard
2. Create metric cards with icons and values
3. Add chart placeholders (400px height)
4. Build each subsequent section following the specifications

### 5. Add Interactive States
1. Hover states for buttons and menu items
2. Active states for navigation
3. Focus states for inputs
4. Loading states for buttons

## 📱 Responsive Breakpoints
```
Desktop: 1024px and up (default)
Tablet: 768px - 1023px
Mobile: 320px - 767px

Responsive Adjustments:
- Hide sidebar on mobile (use overlay)
- Stack grid columns on smaller screens
- Adjust padding and spacing
- Hide non-essential columns in tables
```

## 💡 Tips for Figma Implementation

1. **Use Auto Layout extensively** for responsive behavior
2. **Create component variants** for different states
3. **Use constraints properly** for responsive design
4. **Organize layers** with clear naming conventions
5. **Create shared styles** for consistency
6. **Use proper text and color styles** throughout
7. **Add meaningful component descriptions**
8. **Create a style guide page** with all components
9. **Use grids and layouts** for perfect alignment
10. **Test responsive behavior** at different screen sizes

This guide provides everything needed to recreate the Framtt Admin Dashboard in Figma with pixel-perfect accuracy and proper design system implementation.