# Lot Availability Features - Usage Guide

This document explains how to use the lot availability checking system in the Fermentum recipe ingredient grids.

## Overview

The lot availability system provides two main features:

1. **LotAvailabilityChecker Badge** - Visual indicator showing stock availability with quantity information
2. **IngredientCardWithAvailability** - Card wrapper that colors backgrounds based on stock availability

## Feature 1: LotAvailabilityChecker Badge

### Compact Mode (Icon Only)
Used in ingredient grids to show a simple availability indicator:

```jsx
<LotAvailabilityChecker
  ingredientId={grain.grainId}
  category="grain"
  amount={0}
  unit="lbs"
  compact={true}
/>
```

**Display**:
- ✅ Green cube icon = Stock available
- ⬜ Gray transparent cube icon = No stock

### Full Mode (With Quantity)
Shows detailed availability information:

```jsx
<LotAvailabilityChecker
  ingredientId={grain.grainId}
  category="grain"
  amount={0}
  unit="lbs"
  compact={false}
  showLabel={true}
  showQuantity={true}
/>
```

**Display for Single-Lot Availability**:
```
✅ In Stock
   45.5 lbs
```

**Display for Multi-Lot Availability**:
```
✅ Multi-lot
   120.3 lbs / 3 lots
```

**Display for No Stock**:
```
⬜ No Stock
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ingredientId` | string | required | The ingredient ID |
| `category` | string | required | Category: 'grain', 'hop', 'yeast', 'additive' |
| `amount` | number | 0 | Amount needed (0 = just check availability) |
| `unit` | string | 'lbs' | Unit of measure |
| `compact` | boolean | false | Show icon only |
| `showLabel` | boolean | true | Show text label in full mode |
| `showQuantity` | boolean | true | Show quantity numbers in full mode |
| `className` | string | '' | Additional CSS classes |

## Feature 2: Background Color Based on Availability

### Using IngredientCardWithAvailability Component

Replace your standard `<button>` ingredient cards with the wrapper component:

**Before:**
```jsx
<button
  key={grain.grainId}
  onClick={() => onSelect(grain)}
  className={`p-3 rounded-lg border-2 text-left transition-all ${
    selectedIngredient?.grainId === grain.grainId
      ? 'border-fermentum-500 bg-fermentum-50'
      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-200 bg-gray-100'
  }`}
>
  <div className="font-semibold text-gray-900">{grain.name}</div>
  {/* card content */}
</button>
```

**After:**
```jsx
import IngredientCardWithAvailability from '../IngredientCardWithAvailability';

<IngredientCardWithAvailability
  ingredientId={grain.grainId}
  category="grain"
  unit="lbs"
  isSelected={selectedIngredient?.grainId === grain.grainId}
  onClick={() => onSelect(grain)}
>
  <div className="flex items-start justify-between mb-1">
    <div className="font-semibold text-gray-900">{grain.name}</div>
    <LotAvailabilityChecker
      ingredientId={grain.grainId}
      category="grain"
      amount={0}
      unit="lbs"
      compact={true}
    />
  </div>
  {/* rest of card content */}
</IngredientCardWithAvailability>
```

### Background Color Legend

| Stock Status | Background Color | Border Color |
|-------------|------------------|--------------|
| **Available** | Light green (`bg-green-50`) | Green (`border-green-200`) |
| **Not Available** | Light red (`bg-red-50`) | Red (`border-red-200`) |
| **Selected** | Fermentum brand (`bg-fermentum-50`) | Brand (`border-fermentum-500`) |
| **Loading** | Gray (`bg-gray-100`) | Gray (`border-gray-200`) |

**Note**: Selected state overrides availability colors. Single-lot vs multi-lot distinction is not shown in the ingredient selection grid because lot requirements can't be determined until the user specifies recipe amounts.

## Feature 3: Custom Hook for Advanced Usage

### Using useLotAvailability Hook

For custom implementations, use the `useLotAvailability` hook directly:

```jsx
import { useLotAvailability } from '../hooks/useLotAvailability';

const MyComponent = ({ ingredientId, category }) => {
  const {
    availability,
    loading,
    error,
    isAvailable,
    canFulfillSingleLot,
    totalAvailable,
    lotsRequired
  } = useLotAvailability(ingredientId, category, 0, 'lbs');

  // Use the availability data for custom logic
  const customBackgroundClass = isAvailable
    ? 'bg-green-100'
    : 'bg-red-100';

  return (
    <div className={customBackgroundClass}>
      {loading && <span>Checking availability...</span>}
      {!loading && isAvailable && (
        <span>
          {totalAvailable.toFixed(1)} lbs available
          {!canFulfillSingleLot && ` (${lotsRequired} lots)`}
        </span>
      )}
      {!loading && !isAvailable && <span>Out of stock</span>}
    </div>
  );
};
```

### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `availability` | object | Raw availability response from API |
| `loading` | boolean | Loading state |
| `error` | string/null | Error message if API call failed |
| `isAvailable` | boolean | Whether ingredient is in stock |
| `canFulfillSingleLot` | boolean | Whether available from single lot |
| `totalAvailable` | number | Total quantity available across all lots |
| `lotsRequired` | number | Number of lots needed to fulfill |

## Implementation Examples

### Example 1: Grains Tab with Badge Only (Current)
```jsx
// Current implementation in NewGrainsTab.jsx
<button className="p-3 rounded-lg border-2...">
  <div className="flex items-start justify-between mb-1">
    <div className="font-semibold text-gray-900">{grain.name}</div>
    <LotAvailabilityChecker
      ingredientId={grain.grainId}
      category="grain"
      amount={0}
      unit="lbs"
      compact={true}
    />
  </div>
  {/* grain details */}
</button>
```

### Example 2: Enhanced Card with Background Color
```jsx
import IngredientCardWithAvailability from '../IngredientCardWithAvailability';
import LotAvailabilityChecker from '../LotAvailabilityChecker';

<IngredientCardWithAvailability
  ingredientId={grain.grainId}
  category="grain"
  unit="lbs"
  isSelected={selectedIngredient?.grainId === grain.grainId}
  onClick={() => onSelect(grain)}
>
  <div className="flex items-start justify-between mb-1">
    <div className="font-semibold text-gray-900">{grain.name}</div>
    <LotAvailabilityChecker
      ingredientId={grain.grainId}
      category="grain"
      amount={0}
      unit="lbs"
      compact={true}
    />
  </div>
  <div className="text-xs text-gray-600">
    <div>{grain.type}</div>
    <div>Color: {grain.color}°L</div>
  </div>
</IngredientCardWithAvailability>
```

### Example 3: Recipe Detail with Full Badge Display
```jsx
// Show detailed availability in recipe detail view
<div className="flex items-center gap-2">
  <span className="font-medium">Pale Ale Malt</span>
  <LotAvailabilityChecker
    ingredientId={grain.grainId}
    category="grain"
    amount={recipeAmount}
    unit="lbs"
    compact={false}
    showLabel={true}
    showQuantity={true}
  />
</div>
```

## API Integration

The system queries the `/api/stock/availability` endpoint with these parameters:

```javascript
{
  ingredientId: "11111111-1111-1111-1111-111111111111",
  category: "grain",
  amount: 0.01,  // or specific amount needed
  unit: "lbs"
}
```

Response structure:
```javascript
{
  success: true,
  data: {
    isAvailable: true,
    canFulfillFromSingleLot: true,
    totalAvailable: 45.5,
    lotsRequired: 1,
    unit: "lbs",
    lots: [
      {
        lotNumber: "LOT-2024-001",
        quantityAvailable: 45.5,
        expirationDate: "2025-12-31"
      }
    ]
  }
}
```

## Notes

- All availability checks are cached per ingredient during the component lifecycle
- Loading states return `null` to avoid layout shift
- Error states display as "no stock available"
- The system uses FIFO (First In, First Out) lot allocation logic
- Multi-lot warnings help brewers understand inventory fragmentation
