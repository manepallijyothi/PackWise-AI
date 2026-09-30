import React, { useState, useMemo } from 'react';
import { WMSItem, WMSPackingResponse, WMSBox } from '../types/packaging';
import {
  optimizeWarehousePacking,
  STANDARD_WAREHOUSE_BOXES
} from '../engine/wmsPackingEngine';
import {
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  ShieldAlert,
  Scale,
  Maximize2,
  Package,
  RotateCcw,
  Truck,
  Check
} from 'lucide-react';

const PRESET_ORDERS: Array<{ name: string; description: string; items: WMSItem[] }> = [
  {
    name: 'Fragile Electronics & Accessories',
    description: 'Fragile tablet with 1.5" buffer + charging accessories',
    items: [
      {
        id: 'item-1',
        name: 'Tablet Screen Terminal (Fragile)',
        length: 10.5,
        width: 7.2,
        height: 1.0,
        weight_lbs: 2.2,
        is_fragile: true
      },
      {
        id: 'item-2',
        name: 'Heavy Power Supply Brick',
        length: 6.0,
        width: 4.0,
        height: 2.5,
        weight_lbs: 4.5,
        is_fragile: false
      },
      {
        id: 'item-3',
        name: 'USB-C Cable Bundle',
        length: 5.0,
        width: 3.0,
        height: 1.5,
        weight_lbs: 0.5,
        is_fragile: false
      }
    ]
  },
  {
    name: 'Gourmet Food Jar & Dry Mix',
    description: 'Glass honey jar (fragile) + organic tea tins',
    items: [
      {
        id: 'item-g1',
        name: 'Artisan Glass Honey Jar (Fragile)',
        length: 4.5,
        width: 4.5,
        height: 6.0,
        weight_lbs: 2.8,
        is_fragile: true
      },
      {
        id: 'item-g2',
        name: 'Tea Canister Tin Set',
        length: 8.0,
        width: 4.0,
        height: 5.0,
        weight_lbs: 1.2,
        is_fragile: false
      }
    ]
  },
  {
    name: 'Oversized Item (Edge Case)',
    description: '40" Industrial Conveyor Rail exceeding standard box envelope',
    items: [
      {
        id: 'item-o1',
        name: 'Stainless Steel Guide Rail (40-inch)',
        length: 40.0,
        width: 6.0,
        height: 4.0,
        weight_lbs: 18.0,
        is_fragile: false
      }
    ]
  },
  {
    name: 'Overweight Parcel (Capacity Limit)',
    description: '140 lbs dense die-cast tooling block exceeding pallet-fit carton',
    items: [
      {
        id: 'item-w1',
        name: 'Tungsten Counterweight Core',
        length: 12.0,
        width: 10.0,
        height: 8.0,
        weight_lbs: 135.0,
        is_fragile: false
      }
    ]
  }
];

export const WmsLogisticsTab: React.FC = () => {
  const [items, setItems] = useState<WMSItem[]>(PRESET_ORDERS[0].items);
  const [copied, setCopied] = useState<boolean>(false);

  // New item form state
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemLength, setNewItemLength] = useState<number>(8);
  const [newItemWidth, setNewItemWidth] = useState<number>(6);
  const [newItemHeight, setNewItemHeight] = useState<number>(4);
  const [newItemWeight, setNewItemWeight] = useState<number>(3);
  const [newItemFragile, setNewItemFragile] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Optimization calculation
  const packingResult: WMSPackingResponse = useMemo(() => {
    return optimizeWarehousePacking(items);
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: WMSItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      length: Math.max(0.5, newItemLength),
      width: Math.max(0.5, newItemWidth),
      height: Math.max(0.5, newItemHeight),
      weight_lbs: Math.max(0.1, newItemWeight),
      is_fragile: newItemFragile
    };

    setItems((prev) => [...prev, item]);
    setNewItemName('');
    setNewItemFragile(false);
    setShowAddForm(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCopyJSON = () => {
    const formatted = JSON.stringify(packingResult, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const summary = packingResult.packing_summary;
  const isSuccess = summary.status === 'SUCCESS';
  const isOversized = summary.status === 'OVERSIZED_ITEM';
  const isWeightExceeded = summary.status === 'WEIGHT_LIMIT_EXCEEDED';

  return (
    <div className="pb-24 pt-1 max-w-xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">WMS Box Packing Optimizer</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  Logistics & Bin Packing
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Volumetric waste minimization, 3D orientation & WMS/ERP integration
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyJSON}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            title="Copy WMS JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Export JSON'}</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Quick Warehouse Scenarios
          </span>
          <span className="text-[11px] text-slate-400">Select order pattern</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ORDERS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setItems(preset.items)}
              className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs text-left transition-all group"
            >
              <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-600">
                {preset.name}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {preset.description}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 block mt-1">
                {preset.items.length} {preset.items.length === 1 ? 'Item' : 'Items'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* OPTIMIZATION RESULTS PANEL */}
      <div
        className={`rounded-2xl p-4.5 border-2 shadow-sm space-y-4 ${
          isSuccess
            ? 'bg-white border-emerald-500/40'
            : isOversized
            ? 'bg-amber-50/50 border-amber-500/40'
            : 'bg-red-50/50 border-red-500/40'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                isSuccess ? 'bg-emerald-600' : isOversized ? 'bg-amber-600' : 'bg-red-600'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Packing Status
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">{summary.status}</h2>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-800'
                      : isOversized
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isSuccess ? 'Optimal Fit' : isOversized ? 'Custom Crate Needed' : 'Weight Limit Warning'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Weight</span>
            <span className="text-sm font-black text-slate-900">{summary.total_weight_lbs} lbs</span>
          </div>
        </div>

        {/* Selected Box Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Container</span>
            </div>
            <p className="text-xs font-bold text-slate-900">{summary.selected_box.box_name}</p>
            <p className="text-[11px] font-medium text-slate-600 mt-0.5">
              ID: <span className="font-mono font-bold text-indigo-700">{summary.selected_box.box_id}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.selected_box.dimensions_in.length}" × {summary.selected_box.dimensions_in.width}" ×{' '}
              {summary.selected_box.dimensions_in.height}" (Max: {summary.selected_box.max_weight_lbs} lbs)
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Space Utilization</span>
              </span>
              <span className="font-bold text-slate-900">{summary.utilization_percentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden my-1.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  summary.utilization_percentage > 70
                    ? 'bg-emerald-500'
                    : summary.utilization_percentage > 40
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${summary.utilization_percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Void: {packingResult.cushioning_requirements.estimated_void_fill_sqft} sq.ft
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
              {packingResult.cushioning_requirements.padding_material}
            </p>
          </div>
        </div>

        {/* Warnings or Flags */}
        {packingResult.warnings_or_flags.length > 0 && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Critical Flags & Safety Buffers</span>
            </div>
            <ul className="text-[11px] list-disc list-inside space-y-0.5 text-amber-800">
              {packingResult.warnings_or_flags.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Packing Instructions */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-slate-800 block">
            Warehouse Operator Placement Instructions:
          </span>
          <div className="space-y-1.5">
            {packingResult.packing_instructions.map((step, idx) => (
              <div
                key={idx}
                className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ITEMS IN THIS SHIPMENT CONSIGNMENT */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Shipment Items ({items.length})
            </h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Item'}</span>
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddItem}
            className="p-3.5 bg-slate-50 rounded-xl border border-indigo-200 space-y-3"
          >
            <span className="text-xs font-bold text-slate-800 block">Add Warehouse Item</span>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Item Description
              </label>
              <input
                type="text"
                placeholder="e.g. Mechanical Valve, Glassware, Display..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block">L (in)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newItemLength}
                  onChange={(e) => setNewItemLength(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block">W (in)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newItemWidth}
                  onChange={(e) => setNewItemWidth(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block">H (in)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newItemHeight}
                  onChange={(e) => setNewItemHeight(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-600 block">Wt (lbs)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newItemWeight}
                  onChange={(e) => setNewItemWeight(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={newItemFragile}
                  onChange={(e) => setNewItemFragile(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold">Flag as Fragile (+1.5" cushioning buffer)</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Add to Order
              </button>
            </div>
          </form>
        )}

        {/* Item List */}
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{it.name}</span>
                  {it.is_fragile && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      FRAGILE (+1.5" Buffer)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dimensions: {it.length}" × {it.width}" × {it.height}" | Weight: {it.weight_lbs} lbs | Vol:{' '}
                  {(it.length * it.width * it.height).toFixed(0)} cu.in
                </p>
              </div>

              <button
                onClick={() => handleRemoveItem(it.id)}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No items in this order. Click "Add Item" or select a preset scenario above.
            </div>
          )}
        </div>
      </div>

      {/* RAW JSON VIEWER FOR WMS/ERP INTEGRATION */}
      <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 shadow-sm space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between text-xs text-slate-400 font-sans border-b border-slate-800 pb-2">
          <span className="font-bold flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Deterministic WMS/ERP JSON Output
          </span>
          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Payload'}</span>
          </button>
        </div>

        <pre className="overflow-x-auto max-h-64 text-emerald-400/90 leading-tight py-1">
          {JSON.stringify(packingResult, null, 2)}
        </pre>
      </div>
    </div>
  );
};
