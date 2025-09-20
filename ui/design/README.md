# Fermentum Design System

A complete React + TailwindCSS design system for the Fermentum brewery management application.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access the design system:**
   Open [http://localhost:5174](http://localhost:5174) in your browser.

## What's Included

### Components Showcase
- **Colors** - Complete color palette with Fermentum branding
- **Typography** - Text styles, headings, and size scales
- **Buttons** - All button variants, states, and groups
- **Forms** - Input fields, selects, checkboxes, and form layouts
- **Cards** - Various card designs for different use cases
- **Layout** - Grid systems, flex layouts, and spacing examples

### Key Features
- 🎨 **Fermentum Brand Colors** - Teal and cyan color scheme
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **React 18** - Latest React with modern hooks
- 🎯 **TailwindCSS** - Utility-first CSS framework
- 🔧 **Vite** - Fast development build tool
- ✅ **ESLint** - Code quality and consistency

## Design Tokens

### Colors
- **Primary**: Teal (600-700 for main actions)
- **Background**: Cyan (50 for page backgrounds)
- **Text**: Gray (900 for primary, 600 for secondary)
- **Success**: Green variants
- **Error**: Red variants

### Typography
- **Font Family**: Inter, system fonts
- **Scale**: xs (12px) to 4xl (36px)
- **Weights**: normal, medium, semibold, bold

### Spacing
- **Scale**: 0.25rem increments (1-96)
- **Common**: 4 (1rem), 6 (1.5rem), 8 (2rem)

## Usage Examples

### Basic Button
```jsx
<button className="btn btn-primary">
  Primary Action
</button>
```

### Form Input
```jsx
<input
  type="text"
  className="input"
  placeholder="Enter text"
/>
```

### Card Component
```jsx
<div className="card p-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">
    Card Title
  </h3>
  <p className="text-gray-600">
    Card content goes here.
  </p>
</div>
```

### Grid Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="card p-4">Item 1</div>
  <div className="card p-4">Item 2</div>
  <div className="card p-4">Item 3</div>
</div>
```

## Component Classes

### Custom Utility Classes
- `.btn` - Base button styles
- `.btn-primary` - Primary button variant
- `.btn-secondary` - Secondary button variant
- `.btn-outline` - Outline button variant
- `.card` - Base card component
- `.input` - Form input styling

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### File Structure
```
src/
├── components/          # Design system components
│   ├── Header.jsx      # Top navigation
│   ├── ColorPalette.jsx # Color showcase
│   ├── Typography.jsx   # Text styles
│   ├── Buttons.jsx     # Button variants
│   ├── Forms.jsx       # Form elements
│   ├── Cards.jsx       # Card components
│   └── Layout.jsx      # Layout patterns
├── App.jsx             # Main application
├── main.jsx            # React entry point
└── index.css           # TailwindCSS imports
```

## Integration

This design system is built to integrate seamlessly with the main Fermentum application. Copy any component patterns or CSS classes directly into your project files.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Part of the Fermentum brewery management system.