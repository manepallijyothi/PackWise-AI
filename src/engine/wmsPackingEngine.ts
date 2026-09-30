import { WMSItem, WMSBox, WMSPackingResponse } from '../types/packaging';

export const STANDARD_WAREHOUSE_BOXES: WMSBox[] = [
  {
    box_id: 'BOX-XS',
    box_name: 'Small Shipper Mailer',
    dimensions_in: { length: 8, width: 6, height: 4 },
    max_weight_lbs: 10,
    tare_weight_lbs: 0.4
  },
  {
    box_id: 'BOX-SM',
    box_name: 'Standard E-Commerce Box',
    dimensions_in: { length: 12, width: 9, height: 6 },
    max_weight_lbs: 20,
    tare_weight_lbs: 0.7
  },
  {
    box_id: 'BOX-MD',
    box_name: 'Medium Parcel Shipper',
    dimensions_in: { length: 16, width: 12, height: 10 },
    max_weight_lbs: 40,
    tare_weight_lbs: 1.2
  },
  {
    box_id: 'BOX-LG',
    box_name: 'Large Master Carton',
    dimensions_in: { length: 20, width: 16, height: 14 },
    max_weight_lbs: 60,
    tare_weight_lbs: 1.8
  },
  {
    box_id: 'BOX-XL',
    box_name: 'Heavy-Duty Industrial Shipper',
    dimensions_in: { length: 24, width: 20, height: 18 },
    max_weight_lbs: 80,
    tare_weight_lbs: 2.5
  },
  {
    box_id: 'BOX-XXL',
    box_name: 'Bulk Pallet-Fit Master Container',
    dimensions_in: { length: 32, width: 24, height: 22 },
    max_weight_lbs: 120,
    tare_weight_lbs: 4.0
  }
];

export interface PlacementPlan {
  item: WMSItem;
  effectiveDimensions: { length: number; width: number; height: number };
  orientation: [number, number, number];
  rotationDesc: string;
}

/**
 * Checks whether an item with dimensions [l, w, h] fits inside a box with dimensions [bl, bw, bh]
 * across any of the 6 rotational orientations.
 */
export function canFitInBox(
  itemDims: [number, number, number],
  boxDims: [number, number, number]
): { fits: boolean; bestOrientation?: [number, number, number]; orientationDesc?: string } {
  const [l, w, h] = itemDims;
  const [bl, bw, bh] = boxDims;

  const orientations: Array<{ dims: [number, number, number]; desc: string }> = [
    { dims: [l, w, h], desc: 'Standard Flat (L × W × H)' },
    { dims: [l, h, w], desc: 'On-Edge (L × H × W)' },
    { dims: [w, l, h], desc: 'Rotated 90° (W × L × H)' },
    { dims: [w, h, l], desc: 'On-Side (W × H × L)' },
    { dims: [h, l, w], desc: 'Upright End (H × L × W)' },
    { dims: [h, w, l], desc: 'Upright Face (H × W × L)' }
  ];

  for (const orient of orientations) {
    const [ol, ow, oh] = orient.dims;
    if (ol <= bl && ow <= bw && oh <= bh) {
      return { fits: true, bestOrientation: orient.dims, orientationDesc: orient.desc };
    }
  }

  return { fits: false };
}

/**
 * Deterministic Enterprise WMS Packing Optimization Engine
 */
export function optimizeWarehousePacking(
  items: WMSItem[],
  customBoxes?: WMSBox[]
): WMSPackingResponse {
  const boxes = customBoxes && customBoxes.length > 0 ? customBoxes : STANDARD_WAREHOUSE_BOXES;

  if (!items || items.length === 0) {
    const defaultBox = boxes[0];
    return {
      packing_summary: {
        status: 'SUCCESS',
        selected_box: {
          box_id: defaultBox.box_id,
          box_name: defaultBox.box_name,
          dimensions_in: defaultBox.dimensions_in,
          max_weight_lbs: defaultBox.max_weight_lbs
        },
        utilization_percentage: 0.0,
        total_weight_lbs: 0.0
      },
      cushioning_requirements: {
        padding_material: 'Standard Kraft Paper Dunnage',
        estimated_void_fill_sqft: 0.0
      },
      packing_instructions: ['No items submitted for packing assignment.'],
      warnings_or_flags: ['EMPTY_ORDER']
    };
  }

  // 1. Process items, calculate weights and effective buffered dimensions for fragile items
  let totalRawWeight = 0;
  let totalRawItemVolume = 0;
  let totalBufferedItemVolume = 0;
  const processedItems: Array<{
    item: WMSItem;
    effectiveDims: [number, number, number];
    isFragile: boolean;
  }> = [];

  const warningsOrFlags: string[] = [];
  const hasFragileItems = items.some((i) => i.is_fragile);

  for (const it of items) {
    totalRawWeight += it.weight_lbs;
    const rawVol = it.length * it.width * it.height;
    totalRawItemVolume += rawVol;

    // RULE: If fragile, add 1.5-inch safety buffer to all dimensions for protective padding
    const buffer = it.is_fragile ? 1.5 : 0;
    const effL = it.length + buffer;
    const effW = it.width + buffer;
    const effH = it.height + buffer;
    const effVol = effL * effW * effH;
    totalBufferedItemVolume += effVol;

    processedItems.push({
      item: it,
      effectiveDims: [effL, effW, effH],
      isFragile: it.is_fragile
    });

    if (it.is_fragile) {
      warningsOrFlags.push(
        `FRAGILE_ITEM: "${it.name}" requires 1.5-inch safety cushioning buffer on all surfaces.`
      );
    }
  }

  // Check if any single item exceeds all standard boxes in every orientation
  let isAnyItemOversized = false;
  const maxBoxDims = boxes.reduce(
    (acc, b) => ({
      l: Math.max(acc.l, b.dimensions_in.length),
      w: Math.max(acc.w, b.dimensions_in.width),
      h: Math.max(acc.h, b.dimensions_in.height)
    }),
    { l: 0, w: 0, h: 0 }
  );

  for (const proc of processedItems) {
    const [l, w, h] = proc.effectiveDims;
    // Check against every available box
    let canFitInAny = false;
    for (const box of boxes) {
      const bDims: [number, number, number] = [
        box.dimensions_in.length,
        box.dimensions_in.width,
        box.dimensions_in.height
      ];
      if (canFitInBox([l, w, h], bDims).fits) {
        canFitInAny = true;
        break;
      }
    }

    if (!canFitInAny) {
      isAnyItemOversized = true;
      warningsOrFlags.push(
        `OVERSIZED - CUSTOM CRATE REQUIRED: Item "${proc.item.name}" (${l.toFixed(1)}" × ${w.toFixed(1)}" × ${h.toFixed(1)}") exceeds standard warehouse box thresholds.`
      );
    }
  }

  // Handle OVERSIZED EDGE CASE
  if (isAnyItemOversized) {
    const largestBox = boxes[boxes.length - 1];
    return {
      packing_summary: {
        status: 'OVERSIZED_ITEM',
        selected_box: {
          box_id: 'CUSTOM-CRATE',
          box_name: 'Custom Pallet Crate / Engineered Wood Shroud',
          dimensions_in: {
            length: Math.ceil(maxBoxDims.l * 1.25),
            width: Math.ceil(maxBoxDims.w * 1.25),
            height: Math.ceil(maxBoxDims.h * 1.25)
          },
          max_weight_lbs: 500
        },
        utilization_percentage: parseFloat(
          Math.min(
            90,
            (totalRawItemVolume /
              (maxBoxDims.l * 1.25 * maxBoxDims.w * 1.25 * maxBoxDims.h * 1.25)) *
              100
          ).toFixed(1)
        ),
        total_weight_lbs: parseFloat(totalRawWeight.toFixed(2))
      },
      cushioning_requirements: {
        padding_material: 'Heavy-Duty EPE Foam Corner Protectors + Strapping Shroud',
        estimated_void_fill_sqft: parseFloat(
          ((totalBufferedItemVolume - totalRawItemVolume) / 144 + 6.0).toFixed(2)
        )
      },
      packing_instructions: [
        'Route consignment to Out-of-Gauge (OOG) Custom Packaging Station.',
        'Fabricate reinforced wooden base pallet with structural corner blocking.',
        'Apply 1.5" high-density polyethylene (EPE) shock absorbers around fragile perimeters.',
        'Secure item using steel/PET banding and moisture-barrier vapor bag before dispatch.'
      ],
      warnings_or_flags: warningsOrFlags
    };
  }

  // 2. Sort candidate boxes by volume ascending to minimize volumetric waste
  const sortedBoxes = [...boxes].map((b) => ({
    ...b,
    volume_cuin: b.dimensions_in.length * b.dimensions_in.width * b.dimensions_in.height
  }));
  sortedBoxes.sort((a, b) => (a.volume_cuin || 0) - (b.volume_cuin || 0));

  // Find candidate boxes that satisfy:
  // a) Total weight <= max_weight_lbs
  // b) Box volume >= totalBufferedItemVolume
  // c) Fits the largest item dimensions in at least one orientation
  const feasibleBoxes: Array<{
    box: WMSBox;
    vol: number;
    fitsAllDimensions: boolean;
    weightFeasible: boolean;
  }> = [];

  let weightExceededOnAllFitting = true;

  for (const b of sortedBoxes) {
    const bDims: [number, number, number] = [
      b.dimensions_in.length,
      b.dimensions_in.width,
      b.dimensions_in.height
    ];
    const bVol = b.volume_cuin || bDims[0] * bDims[1] * bDims[2];

    // Check if each individual item can fit inside this box's outer envelope
    const fitsIndividualDimensions = processedItems.every(
      (proc) => canFitInBox(proc.effectiveDims, bDims).fits
    );

    // Check bounding box volume
    const volumeFits = bVol >= totalBufferedItemVolume;
    const weightFeasible = totalRawWeight <= b.max_weight_lbs;

    if (fitsIndividualDimensions && volumeFits) {
      if (weightFeasible) {
        weightExceededOnAllFitting = false;
        feasibleBoxes.push({
          box: b,
          vol: bVol,
          fitsAllDimensions: true,
          weightFeasible: true
        });
      }
    }
  }

  // Handle WEIGHT LIMIT EXCEEDED
  if (feasibleBoxes.length === 0 && weightExceededOnAllFitting) {
    // Check if dimensionally it fit, but was too heavy
    const dimensionallyFitBox = sortedBoxes.find((b) => {
      const bDims: [number, number, number] = [
        b.dimensions_in.length,
        b.dimensions_in.width,
        b.dimensions_in.height
      ];
      return processedItems.every((proc) => canFitInBox(proc.effectiveDims, bDims).fits);
    }) || sortedBoxes[sortedBoxes.length - 1];

    warningsOrFlags.push(
      `WEIGHT_LIMIT_EXCEEDED: Total consignment weight (${totalRawWeight.toFixed(
        1
      )} lbs) exceeds the rated capacity (${dimensionallyFitBox.max_weight_lbs} lbs) of the dimensionally matching box.`
    );

    return {
      packing_summary: {
        status: 'WEIGHT_LIMIT_EXCEEDED',
        selected_box: {
          box_id: dimensionallyFitBox.box_id,
          box_name: dimensionallyFitBox.box_name,
          dimensions_in: dimensionallyFitBox.dimensions_in,
          max_weight_lbs: dimensionallyFitBox.max_weight_lbs
        },
        utilization_percentage: parseFloat(
          Math.min(
            100,
            (totalRawItemVolume /
              (dimensionallyFitBox.dimensions_in.length *
                dimensionallyFitBox.dimensions_in.width *
                dimensionallyFitBox.dimensions_in.height)) *
              100
          ).toFixed(1)
        ),
        total_weight_lbs: parseFloat(totalRawWeight.toFixed(2))
      },
      cushioning_requirements: {
        padding_material: 'Heavy-Duty Double-Wall Corrugated Liners + Reinforced Paper Pad',
        estimated_void_fill_sqft: parseFloat(
          (
            (dimensionallyFitBox.dimensions_in.length *
              dimensionallyFitBox.dimensions_in.width *
              dimensionallyFitBox.dimensions_in.height -
              totalRawItemVolume) /
            144
          ).toFixed(2)
        )
      },
      packing_instructions: [
        'SPLIT SHIPMENT ADVISORY: Consignment exceeds single-box gross mass threshold.',
        'Split items into multiple packages to maintain courier health-and-safety lifting limits (50 lbs/box).',
        'Alternatively, upgrade to heavy-duty double-wall master pallet container.'
      ],
      warnings_or_flags: warningsOrFlags
    };
  }

  // Selected optimal box (smallest volume that is physically & weight feasible)
  const optimalChoice =
    feasibleBoxes.length > 0 ? feasibleBoxes[0].box : sortedBoxes[sortedBoxes.length - 1];
  const boxVol =
    optimalChoice.dimensions_in.length *
    optimalChoice.dimensions_in.width *
    optimalChoice.dimensions_in.height;

  const rawUtilization = (totalRawItemVolume / boxVol) * 100;
  const utilization_percentage = parseFloat(Math.min(99.0, Math.max(5.0, rawUtilization)).toFixed(1));

  // Void fill calculation: (Box Volume - Total Raw Volume) in square feet (assuming 2" depth dunnage equivalent = 288 cu.in / sq.ft)
  const voidVolumeCuIn = Math.max(0, boxVol - totalRawItemVolume);
  const estimated_void_fill_sqft = parseFloat((voidVolumeCuIn / 288).toFixed(2));

  // Padding material decision
  let padding_material = 'Recycled Kraft Paper Dunnage (Crumpled Accordion)';
  if (hasFragileItems) {
    padding_material =
      'Anti-Static Air Bubble Wrap (1.5" buffer) + Expandable Honeycomb Paper / Corner Foam Blocks';
  } else if (utilization_percentage > 85) {
    padding_material = 'Lightweight Inflatable Air Pillows (Void Minimization)';
  }

  // Generate step-by-step visual placement instructions for warehouse operator
  // Sort items: Heavy non-fragile items at bottom, lighter/fragile items on top!
  const sortedItemsForPacking = [...processedItems].sort((a, b) => {
    // If one is fragile and one is not, non-fragile goes first (bottom)
    if (a.isFragile && !b.isFragile) return 1;
    if (!a.isFragile && b.isFragile) return -1;
    // Otherwise sort by weight descending (heavier items at the bottom)
    return b.item.weight_lbs - a.item.weight_lbs;
  });

  const packing_instructions: string[] = [
    `Retrieve carton [${optimalChoice.box_id}: ${optimalChoice.box_name}] (${optimalChoice.dimensions_in.length}" × ${optimalChoice.dimensions_in.width}" × ${optimalChoice.dimensions_in.height}"). Ensure bottom flaps are sealed with 3" fiberglass-reinforced tape.`
  ];

  if (hasFragileItems) {
    packing_instructions.push(
      'Lay a 1.5-inch shock-absorbing cushioning bed at the base using anti-static bubble wrap or kraft dunnage.'
    );
  } else {
    packing_instructions.push('Place base layer dunnage to eliminate base impact and transit vibration.');
  }

  sortedItemsForPacking.forEach((proc, index) => {
    const it = proc.item;
    const bDims: [number, number, number] = [
      optimalChoice.dimensions_in.length,
      optimalChoice.dimensions_in.width,
      optimalChoice.dimensions_in.height
    ];
    const fitRes = canFitInBox(proc.effectiveDims, bDims);
    const orient = fitRes.orientationDesc || 'Standard Flat';

    if (it.is_fragile) {
      packing_instructions.push(
        `Step ${index + 2}: Wrap FRAGILE item "${it.name}" (${it.length}" × ${it.width}" × ${it.height}", ${it.weight_lbs} lbs) in 1.5" protective cushioning on all sides. Orient [${orient}] at the TOP layer. DO NOT stack heavy goods above this unit.`
      );
    } else {
      packing_instructions.push(
        `Step ${index + 2}: Place foundation item "${it.name}" (${it.length}" × ${it.width}" × ${it.height}", ${it.weight_lbs} lbs) flat on carton floor in [${orient}] orientation to stabilize center of gravity.`
      );
    }
  });

  packing_instructions.push(
    `Step ${sortedItemsForPacking.length + 2}: Dispense ~${estimated_void_fill_sqft} sq.ft of ${padding_material} into remaining lateral and top voids to prevent internal migration.`
  );
  packing_instructions.push(
    `Step ${sortedItemsForPacking.length + 3}: Perform gentle shake-test; verify zero interior rattling. Seal top flaps with H-taping method and apply shipping & ${hasFragileItems ? 'FRAGILE HANDLE WITH CARE ' : ''}labels.`
  );

  return {
    packing_summary: {
      status: 'SUCCESS',
      selected_box: {
        box_id: optimalChoice.box_id,
        box_name: optimalChoice.box_name,
        dimensions_in: {
          length: optimalChoice.dimensions_in.length,
          width: optimalChoice.dimensions_in.width,
          height: optimalChoice.dimensions_in.height
        },
        max_weight_lbs: optimalChoice.max_weight_lbs
      },
      utilization_percentage,
      total_weight_lbs: parseFloat(totalRawWeight.toFixed(2))
    },
    cushioning_requirements: {
      padding_material,
      estimated_void_fill_sqft
    },
    packing_instructions,
    warnings_or_flags: warningsOrFlags
  };
}
