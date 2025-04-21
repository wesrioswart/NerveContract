export const purchaseOrderStatusColors: Record<string, string> = {
  'draft': 'bg-gray-200 text-gray-800 hover:bg-gray-200 hover:text-gray-800',
  'pending_approval': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800',
  'approved': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
  'ordered': 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
  'delivered': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800',
  'completed': 'bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800',
  'cancelled': 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800'
};

export const inventoryTransactionTypes = [
  { value: 'purchase', label: 'Purchase', description: 'Add items to inventory from a supplier' },
  { value: 'issue', label: 'Issue', description: 'Remove items from inventory for a project' },
  { value: 'transfer', label: 'Transfer', description: 'Move items between locations' },
  { value: 'return', label: 'Return', description: 'Return items back to inventory' },
  { value: 'adjustment', label: 'Adjustment', description: 'Adjust quantities due to count or other reason' },
  { value: 'stocktake', label: 'Stocktake', description: 'Update quantities based on physical count' }
];

export const transactionTypeColors: Record<string, string> = {
  'purchase': 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
  'issue': 'bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800',
  'transfer': 'bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800',
  'return': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800',
  'adjustment': 'bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800',
  'stocktake': 'bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800'
};

export const inventoryStockLevelStatus = {
  normal: 'text-green-600',
  warning: 'text-amber-600',
  critical: 'text-red-600',
  unknown: 'text-gray-600'
};

export const inventoryItemCategories = [
  'Materials',
  'Equipment',
  'PPE',
  'Tools',
  'Consumables',
  'Office Supplies',
  'Other'
];

export const inventoryItemUnits = [
  { value: 'item', label: 'Item' },
  { value: 'm', label: 'Meter' },
  { value: 'm2', label: 'Square Meter' },
  { value: 'm3', label: 'Cubic Meter' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'l', label: 'Liter' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'pair', label: 'Pair' },
  { value: 'set', label: 'Set' }
];

export const gpsmacsCodeRanges = {
  materials: { min: 5000, max: 5999, description: 'Construction Materials' },
  plant: { min: 6000, max: 6999, description: 'Plant & Equipment' },
  equipment: { min: 7000, max: 7999, description: 'Small Equipment & Tools' },
  ppe: { min: 8000, max: 8999, description: 'PPE & Safety Equipment' }
};

export const locationTypes = [
  { value: 'yard', label: 'Yard' },
  { value: 'store', label: 'Store' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'site', label: 'Site' }
];