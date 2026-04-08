# Dark Mode Implementation Guide

## Overview
The application now supports a comprehensive dark mode with a toggle button in the header.

## Implementation Details

### Core Features
- **Theme Toggle**: Moon/Sun icon in the header (top right)
- **Persistence**: Theme preference saved to localStorage
- **System Preference**: Detects system dark mode preference on first load
- **Smooth Transitions**: All color changes animate smoothly

### Components Updated

#### ✅ Layout Components
- **Header** (`components/layout/Header.tsx`)
  - Background, text, and hover states
  - User profile dropdown
  - Theme toggle button

- **Sidebar** (`components/layout/Sidebar.tsx`)
  - Navigation items (active/inactive states)
  - Admin section
  - Mobile bottom navigation
  - Footer

- **Dashboard Layout** (`app/(dashboard)/layout.tsx`)
  - Background color

#### ✅ Auth Pages
- **Login Page** (`app/(auth)/login/LoginForm.tsx`)
  - Form fields with proper contrast
  - Error messages
  - Buttons and inputs

- **Auth Layout** (`app/(auth)/layout.tsx`)
  - Background gradient
  - Card container

#### ✅ Global Styles
- **Form Inputs** (`app/globals.css`)
  - All text inputs, textareas, and selects
  - **Light mode**: Black text on white background
  - **Dark mode**: Light text on dark background
  - Proper border colors

- **Toast Notifications** (`app/layout.tsx`)
  - Success/error/info toasts
  - Dark mode specific colors

### Theme Context API

**Location**: `contexts/ThemeContext.tsx`

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  // Use theme state
  console.log(theme); // 'light' or 'dark'

  // Toggle between light and dark
  toggleTheme();

  // Set specific theme
  setTheme('dark');
}
```

### CSS Classes Reference

Common dark mode patterns used throughout:

```tsx
// Background colors
className="bg-white dark:bg-gray-800"
className="bg-gray-50 dark:bg-gray-900"

// Text colors
className="text-gray-900 dark:text-white"
className="text-gray-600 dark:text-gray-300"
className="text-gray-500 dark:text-gray-400"

// Borders
className="border-gray-200 dark:border-gray-700"

// Hover states
className="hover:bg-gray-50 dark:hover:bg-gray-700"

// Active/selected states
className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"

// Buttons
className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
```

## Components That May Need Updates

The following components may still need dark mode classes added:

### High Priority
- [ ] Content cards/items in content library
- [ ] Contact cards and detail views
- [ ] Activity feed items
- [ ] Dashboard metrics cards
- [ ] Charts and graphs
- [ ] Modals and dialogs
- [ ] Dropdowns and selects
- [ ] Tables and data grids

### Medium Priority
- [ ] Form labels and help text
- [ ] Badge components
- [ ] Status indicators
- [ ] Search inputs
- [ ] Filter panels
- [ ] Pagination controls

### Low Priority
- [ ] Loading spinners
- [ ] Empty states
- [ ] Error pages
- [ ] Footer components

## Adding Dark Mode to New Components

When creating new components, follow this checklist:

1. **Background Colors**
   - Add `dark:` variant for all `bg-*` classes
   - Use `dark:bg-gray-800` for cards
   - Use `dark:bg-gray-900` for page backgrounds

2. **Text Colors**
   - Add `dark:text-white` for primary text
   - Add `dark:text-gray-300` for secondary text
   - Add `dark:text-gray-400` for muted text

3. **Borders**
   - Add `dark:border-gray-700` for most borders
   - Add `dark:border-gray-600` for emphasized borders

4. **Interactive States**
   - Add dark mode hover states: `dark:hover:bg-gray-700`
   - Add dark mode focus states: `dark:focus:ring-blue-500`
   - Add dark mode active states: `dark:bg-blue-900/30`

5. **Icons**
   - Icon colors should match text colors
   - Use `dark:text-gray-300` for most icons

## Testing Dark Mode

### Manual Testing Checklist
1. Toggle dark mode using the header button
2. Refresh the page - theme should persist
3. Check all form inputs are readable
4. Verify navigation items are visible
5. Test hover and active states
6. Check modals and dropdowns
7. Verify charts and graphics adapt
8. Test on different screen sizes

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari

### Device Testing
- Desktop (Windows/Mac)
- Mobile (iOS/Android)
- Tablet

## Troubleshooting

### Issue: Text is unreadable on forms
**Solution**: Check `globals.css` - form inputs have `!important` styles to ensure proper contrast

### Issue: Component doesn't respond to theme changes
**Solution**: Make sure the component is wrapped in `ThemeProvider` (should be in root layout)

### Issue: Theme doesn't persist after refresh
**Solution**: Check browser localStorage is enabled and not being cleared

### Issue: Flicker on page load
**Solution**: This is normal - the ThemeProvider checks localStorage and applies theme on mount

## Future Enhancements

- [ ] Add transition animations to theme changes
- [ ] Support for custom color themes (beyond light/dark)
- [ ] Auto-switch based on time of day
- [ ] Per-page theme preferences
- [ ] High contrast mode for accessibility
- [ ] Theme preview before applying

## Resources

- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [Next.js Theming](https://nextjs.org/docs/app/building-your-application/styling/css-variables)
- [Web.dev Dark Mode](https://web.dev/prefers-color-scheme/)

---

**Last Updated**: 2026-04-07
**Maintained By**: Development Team
