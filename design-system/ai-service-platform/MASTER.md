# Design System: AI Service Platform

## Pattern
- **Name:** Hero + Features + CTA
- **Conversion Focus:** Deep CTA placement. Use contrasting color (at least 7:1 contrast ratio). Sticky navbar CTA.
- **CTA Placement:** Hero (sticky) + Bottom
- **Color Strategy:** Hero: Brand primary or vibrant. Features: Card bg #FAFAFA. CTA: Contrasting accent color
- **Sections:**
  1. Hero with headline/image
  2. Value prop
  3. Key features (3-5)
  4. CTA section
  5. Footer

## Style
- **Name:** AI-Native UI
- **Keywords:** Chatbot, conversational, voice, assistant, agentic, ambient, minimal chrome, streaming text, AI interactions
- **Best For:** AI products, chatbots, voice assistants, copilots, AI-powered tools, conversational interfaces
- **Performance:** ⚡ Excellent | **Accessibility:** ✓ WCAG AA

## Colors
| Role | Hex |
|------|-----|
| Primary | #6366F1 |
| Secondary | #818CF8 |
| CTA | #10B981 |
| Background | #F5F3FF |
| Text | #1E1B4B |

*Notes: Indigo primary + emerald CTA*

## Typography
- **Heading:** Plus Jakarta Sans
- **Body:** Plus Jakarta Sans
- **Mood:** Friendly, modern, saas, clean, approachable, professional
- **Best For:** SaaS products, web apps, dashboards, B2B, productivity tools
- **Google Fonts:** https://fonts.google.com/share?selection?family=Plus+Jakarta+Sans:wght@300;400;500;600;700
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

## Key Effects
- Typing indicators (3-dot pulse)
- Streaming text animations
- Pulse animations
- Context cards
- Smooth reveals

## Avoid (Anti-patterns)
- Heavy chrome
- Slow response feedback

## Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

## Component Guidelines

### Buttons
- Primary CTA: `bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200`
- Secondary: `bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg px-6 py-3 font-semibold transition-all duration-200`
- Ghost: `bg-transparent hover:bg-[#F5F3FF] text-[#6366F1] rounded-lg px-6 py-3 font-semibold transition-all duration-200`

### Cards
- Background: `bg-white`
- Border: `border border-gray-100`
- Shadow: `shadow-sm hover:shadow-md transition-shadow duration-200`
- Radius: `rounded-xl`
- Padding: `p-6`

### Hero Section
- Gradient background: `bg-gradient-to-br from-[#6366F1] to-[#818CF8]`
- Text color: `text-white`
- CTA: Emerald accent

### Feature Cards
- Grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Icon container: `bg-[#F5F3FF] p-3 rounded-xl`

## Animation Guidelines
- Hover: `transition-all duration-200 ease-in-out`
- Pulse: `animate-pulse`
- Fade in: `fade-in animation duration-500 ease-out`
