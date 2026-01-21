# InterviewPro UI Components Guide

## Component Library Overview

All components are built with Tailwind CSS and React TypeScript for consistency and reusability.

---

## 1. Button Component

### Usage
```tsx
import Button from '../components/Button';

<Button variant="primary" size="md">
  Click Me
</Button>
```

### Variants

#### Primary (Default)
- Color: Blue gradient
- Use for: Main CTAs, important actions
- Hover: Shadow glow effect

#### Secondary
- Color: Emerald gradient
- Use for: Alternative actions, secondary CTAs
- Hover: Shadow glow effect

#### Outline
- Color: Gray border with blue text
- Use for: Less important actions, secondary buttons
- Hover: Blue border and text

### Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| sm | px-4 py-2 | text-sm |
| md | px-6 py-3 | text-base |
| lg | px-8 py-4 | text-lg |

### Examples

```tsx
// Primary button
<Button variant="primary" size="lg">
  Start Practicing
</Button>

// Secondary button
<Button variant="secondary" size="md">
  Try Mock Interview
</Button>

// Outline button
<Button variant="outline" size="sm">
  Learn More
</Button>

// Custom styling
<Button variant="primary" className="w-full">
  Full Width Button
</Button>
```

---

## 2. Card Component

### Usage
```tsx
import Card from '../components/Card';

<Card highlight={false}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Types

#### Standard Card
- White background
- Light shadow
- Used for: Feature cards, stat cards, content containers

#### Highlight Card
- Light gradient background
- Blue border
- Enhanced shadow
- Lift effect on hover
- Used for: Featured pricing tier, important content

### Examples

```tsx
// Standard card
<Card>
  <div className="text-4xl mb-4">🎤</div>
  <h3 className="text-xl font-bold">Voice Practice</h3>
  <p>Perfect your spoken answers</p>
</Card>

// Highlighted card (for Pro pricing tier)
<Card highlight={true}>
  <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm">
    MOST POPULAR
  </span>
  <h3 className="text-2xl font-bold mt-4">Pro Plan</h3>
  <p className="text-4xl font-bold mt-2">$9.99/month</p>
</Card>
```

---

## 3. SectionContainer Component

### Usage
```tsx
import SectionContainer from '../components/SectionContainer';

<SectionContainer dark={false}>
  <h2>Section Title</h2>
  <p>Section content</p>
</SectionContainer>
```

### Types

#### Light Section
- White background
- Use for: Main content sections
- Default padding: 64px vertical

#### Dark Section
- Gray-900 background
- White text
- Use for: Features, testimonials, CTAs
- Creates visual contrast

### Examples

```tsx
// Light section
<SectionContainer>
  <h2 className="text-4xl font-bold mb-12">Features</h2>
  <div className="grid md:grid-cols-3 gap-8">
    {/* Feature cards */}
  </div>
</SectionContainer>

// Dark section
<SectionContainer dark>
  <h2 className="text-4xl font-bold mb-12">Why Choose Us</h2>
  <div className="grid md:grid-cols-2 gap-8">
    {/* Benefit items */}
  </div>
</SectionContainer>
```

---

## Component Combinations

### Hero Section Layout
```tsx
<SectionContainer className="bg-gradient-to-br from-blue-50 to-emerald-50">
  <div className="grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h1 className="text-5xl font-bold mb-6">Main Headline</h1>
      <p className="text-xl text-gray-600 mb-8">Subheading</p>
      <div className="flex gap-4">
        <Button variant="primary" size="lg">Primary</Button>
        <Button variant="secondary" size="lg">Secondary</Button>
      </div>
    </div>
    <div className="bg-gradient-to-br from-blue-100 to-emerald-100 rounded-3xl h-96"></div>
  </div>
</SectionContainer>
```

### Feature Grid
```tsx
<SectionContainer className="bg-gray-50">
  <div className="grid md:grid-cols-3 gap-8">
    {features.map((feature) => (
      <Card key={feature.id}>
        <div className="text-4xl mb-4">{feature.icon}</div>
        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
      </Card>
    ))}
  </div>
</SectionContainer>
```

### Pricing Comparison
```tsx
<SectionContainer>
  <div className="grid md:grid-cols-3 gap-8">
    {pricingPlans.map((plan) => (
      <Card key={plan.id} highlight={plan.isPopular}>
        {plan.isPopular && (
          <span className="bg-emerald-500 text-white px-4 py-1 rounded-full">
            MOST POPULAR
          </span>
        )}
        <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
        <p className="text-4xl font-bold mt-2">{plan.price}</p>
        <Button 
          variant={plan.isPopular ? "secondary" : "outline"} 
          className="w-full mt-6"
        >
          Get Started
        </Button>
      </Card>
    ))}
  </div>
</SectionContainer>
```

---

## Responsive Design Patterns

### Grid Patterns
```tsx
// 2 columns on desktop, 1 on mobile
<div className="grid md:grid-cols-2 gap-8">

// 3 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid md:grid-cols-3 sm:grid-cols-2 gap-8">

// 4 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid md:grid-cols-4 sm:grid-cols-2 gap-8">
```

### Spacing Patterns
```tsx
// Responsive padding
<div className="px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">

// Responsive gaps
<div className="gap-4 md:gap-8 lg:gap-12">

// Responsive text sizes
<h1 className="text-3xl md:text-4xl lg:text-5xl">
```

---

## Typography Examples

### Headline (h1)
```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
  Ace Your Tech Interviews Faster
</h1>
```

### Section Title (h2)
```tsx
<h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
  Powerful Features for Better Results
</h2>
```

### Card Title (h3)
```tsx
<h3 className="text-xl font-bold text-gray-900 mb-3">
  Voice Answer Practice
</h3>
```

### Body Text
```tsx
<p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
  Master interview skills with AI-powered practice
</p>
```

### Small Text
```tsx
<p className="text-sm text-gray-500">
  No credit card required
</p>
```

---

## Color Usage Examples

### Gradient Text
```tsx
<div className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
  InterviewPro
</div>
```

### Gradient Button
```tsx
<button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
  Primary Action
</button>
```

### Gradient Background
```tsx
<div className="bg-gradient-to-br from-blue-50 to-emerald-50">
  Hero Section
</div>
```

### Dark Section with Gradient Borders
```tsx
<div className="bg-gray-900 border border-gray-700 hover:border-emerald-500 transition-colors">
  Dark content
</div>
```

---

## Interactive States

### Hover States
```tsx
// Card hover
<div className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

// Button hover
<button className="hover:shadow-lg hover:shadow-blue-500/50">

// Link hover
<a className="hover:text-blue-700 transition-colors">
```

### Focus States
```tsx
<input className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
```

### Active States
```tsx
<button className="active:transform active:scale-95">
```

---

## Accessibility Features

### Focus Visible
```tsx
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
```

### Contrast Ratios
- Text on white: Blue (#2563eb) - Passes AAA
- Text on blue: White - Passes AAA
- Text on gray: Dark gray - Passes AAA

### Touch Targets
- Minimum size: 44px × 44px
- Buttons and links: At least 48px

---

## Animation Classes

### Smooth Transitions
```tsx
className="transition-all duration-300"
```

### Hover Lift
```tsx
className="hover:-translate-y-2"
```

### Color Transitions
```tsx
className="transition-colors duration-200"
```

### Shadow Transitions
```tsx
className="transition-shadow duration-300"
```

---

## Best Practices

1. **Always use semantic HTML**
   - Use `<button>` for buttons, not `<div>`
   - Use `<nav>` for navigation
   - Use `<h1>`, `<h2>`, etc. in order

2. **Mobile-first approach**
   - Write styles for mobile first
   - Add responsive classes for larger screens

3. **Consistent spacing**
   - Use spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, etc.
   - Keep gaps consistent throughout

4. **Color hierarchy**
   - Primary: Blue for main actions
   - Secondary: Emerald for alternative actions
   - Accent: Gray for supporting content

5. **Typography hierarchy**
   - One h1 per page
   - Proper heading hierarchy
   - Adequate line-height for readability

6. **Performance**
   - Use Tailwind utilities
   - Avoid custom CSS
   - Optimize images

7. **Accessibility**
   - Test keyboard navigation
   - Ensure color contrast
   - Add alt text to images
   - Use semantic HTML
