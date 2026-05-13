# ToyX Design System (Mobile-First)


## Brand Colors (Tailwind tokens)
- Primary: `purple-500` (buttons, active nav, links)
- Primary hover: `purple-600`
- Secondary: `pink-500` (accents, badges, highlights)
- Success: `green-500`
- Warning: `amber-500`
- Error: `red-500`
- Background light: `gray-50`
- Background dark: `gray-950`
- Card light: `white`
- Card dark: `gray-900`
- Text primary light: `gray-900`
- Text primary dark: `gray-50`
- Text secondary light: `gray-500`
- Text secondary dark: `gray-400`
- Border light: `gray-200`
- Border dark: `gray-800`


## Typography Scale
- Page title: `text-xl font-bold`
- Section title: `text-lg font-semibold`
- Card title: `text-base font-semibold`
- Body: `text-sm font-normal`
- Caption/subtitle: `text-xs text-gray-500 dark:text-gray-400`
- Stat number: `text-2xl font-bold`
- Stat label: `text-xs text-gray-500`


## Spacing
- Page horizontal padding: `px-4`
- Section vertical gap: `space-y-4`
- Card internal padding: `p-4`
- Between items in a list: `space-y-3`
- Between icon and text: `gap-3`
- Between label and sublabel: `gap-0.5`


## Border Radius
- Cards/sections: `rounded-2xl`
- Buttons: `rounded-xl`
- Avatars: `rounded-full`
- Input fields: `rounded-xl`
- Pills/badges: `rounded-full`


## Shadows
- Cards: `shadow-sm`
- Elevated (modals/sheets): `shadow-lg`
- No other shadows


## Buttons
- Primary: `bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-6 py-3 text-sm font-semibold`
- Secondary: `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-6 py-3 text-sm font-semibold`
- Destructive: `bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 py-3 text-sm font-semibold`
- Disabled: `opacity-50 cursor-not-allowed`
- All buttons: `min-h-[44px]` (touch target)


## Inputs
- `w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm`
- Focus: `ring-2 ring-purple-500 outline-none`


## Icons
- Default size: `w-5 h-5`
- In list rows: `w-10 h-10` container with `rounded-xl bg-{color}-50 dark:bg-{color}-900/30 flex items-center justify-center`
- Icon color matches container accent


## Cards / Sections
- `bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4`
- No nested shadows
- Consistent gap between cards: `space-y-4`


## Layout
- Max content width: `max-w-lg mx-auto` (keeps it phone-friendly on desktop)
- Page wrapper: `min-h-screen bg-gray-50 dark:bg-gray-950 pb-20` (room for bottom nav)
- Bottom nav height: `h-16`


## Dark Mode Rules
- Always use `dark:` variants on every color/bg/border/text class
- Never use raw hex colors
- Test every component in both modes
- Use `dark:bg-gray-900` for cards, `dark:bg-gray-950` for page bg


## Responsive Rules
- Design mobile-first (default)
- Cards should be full-width on mobile (`w-full`)
- On tablet+ (`sm:` / `md:`): optionally constrain with `max-w-lg mx-auto`
- Touch targets: minimum `44px` height for all interactive elements
- No horizontal scroll on any screen


## List/Settings Rows (standard)
- Container: `flex items-center gap-3 p-3 rounded-xl`
- Left: icon container (see Icons above)
- Center: `flex flex-col gap-0.5 flex-1 min-w-0`
  - Title: `text-sm font-medium text-gray-900 dark:text-gray-50`
  - Subtitle: `text-xs text-gray-500 dark:text-gray-400 truncate`
- Right: chevron / toggle / value
- Hover/press: `hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`


## Empty States
- Centered icon (large, muted)
- Title + subtitle
- Optional CTA button


## Animations / Transitions
- Use `transition-colors duration-150` on interactive elements
- Use `transition-all duration-200` on expandable sections
- No heavy animations
