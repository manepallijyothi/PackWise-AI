import { CommodityInput } from '../types/packaging';

export interface PresetCommodityConfig {
  id: string;
  name: string;
  category: 'Fresh Produce' | 'Dry Grains & Staples' | 'Snacks & Fats' | 'Dairy & Protein' | 'Spices & Flavors';
  description: string;
  defaultValues: CommodityInput;
}

export const PRESET_COMMODITIES: PresetCommodityConfig[] = [
  {
    id: 'tomato',
    name: 'Tomato (Fresh Whole)',
    category: 'Fresh Produce',
    description: 'High moisture (94%), actively respiring fruit requiring controlled gas exchange and condensation prevention.',
    defaultValues: {
      commodityType: 'Tomato',
      moisture: 94,
      oilFat: 0.2,
      pH: 4.3,
      respirationRate: 'High',
      targetShelfLifeDays: 15,
      storageTemperature: 4,
      relativeHumidity: 90,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 3,
      isFreshProduce: true
    }
  },
  {
    id: 'mango',
    name: 'Mango (Alphonso / Kesar)',
    category: 'Fresh Produce',
    description: 'Climacteric fruit with peak ethylene synthesis; high respiration rate and susceptibility to chilling injury.',
    defaultValues: {
      commodityType: 'Mango',
      moisture: 83,
      oilFat: 0.4,
      pH: 4.2,
      respirationRate: 'High',
      targetShelfLifeDays: 14,
      storageTemperature: 12,
      relativeHumidity: 85,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 4,
      isFreshProduce: true
    }
  },
  {
    id: 'potato',
    name: 'Potato (Ware Tubers)',
    category: 'Fresh Produce',
    description: 'Starchy tuber prone to greening from light exposure, sprouting from ambient moisture, and medium respiration.',
    defaultValues: {
      commodityType: 'Potato',
      moisture: 79,
      oilFat: 0.1,
      pH: 5.8,
      respirationRate: 'Medium',
      targetShelfLifeDays: 30,
      storageTemperature: 10,
      relativeHumidity: 85,
      storageType: 'Ambient',
      transportationCondition: 'Normal',
      transportationDurationDays: 2,
      isFreshProduce: true
    }
  },
  {
    id: 'rice',
    name: 'Basmati Rice (Milled White)',
    category: 'Dry Grains & Staples',
    description: 'Dry staple grain (13% moisture). Highly hygroscopic; vulnerable to moisture absorption, weevil infestation, and odor uptake.',
    defaultValues: {
      commodityType: 'Rice',
      moisture: 13,
      oilFat: 0.6,
      pH: 6.5,
      respirationRate: 'Low',
      targetShelfLifeDays: 60,
      storageTemperature: 25,
      relativeHumidity: 60,
      storageType: 'Ambient',
      transportationCondition: 'Normal',
      transportationDurationDays: 5,
      isFreshProduce: false
    }
  },
  {
    id: 'potato-chips',
    name: 'Potato Chips (Fried Salted)',
    category: 'Snacks & Fats',
    description: 'Ultra-low moisture (2%) and high fat (35%). Extreme vulnerability to oxidative rancidity and moisture sogginess.',
    defaultValues: {
      commodityType: 'Potato Chips',
      moisture: 2,
      oilFat: 35,
      pH: 6.0,
      respirationRate: 'Low',
      targetShelfLifeDays: 60,
      storageTemperature: 25,
      relativeHumidity: 55,
      storageType: 'Ambient',
      transportationCondition: 'Normal',
      transportationDurationDays: 3,
      isFreshProduce: false
    }
  },
  {
    id: 'milk-powder',
    name: 'Whole Milk Powder (Dairy)',
    category: 'Dairy & Protein',
    description: 'Hygroscopic powder with 26% butterfat; vulnerable to Maillard browning, fat oxidation, and caking.',
    defaultValues: {
      commodityType: 'Milk Powder',
      moisture: 3,
      oilFat: 26,
      pH: 6.6,
      respirationRate: 'Low',
      targetShelfLifeDays: 60,
      storageTemperature: 22,
      relativeHumidity: 50,
      storageType: 'Ambient',
      transportationCondition: 'Normal',
      transportationDurationDays: 4,
      isFreshProduce: false
    }
  },
  {
    id: 'spices',
    name: 'Spices (Ground Turmeric & Chili)',
    category: 'Spices & Flavors',
    description: 'Aromatic powders rich in essential oils and natural pigments (curcumin/capsanthin); degrades rapidly under light and oxygen.',
    defaultValues: {
      commodityType: 'Spices',
      moisture: 9,
      oilFat: 11,
      pH: 5.5,
      respirationRate: 'Low',
      targetShelfLifeDays: 60,
      storageTemperature: 22,
      relativeHumidity: 55,
      storageType: 'Ambient',
      transportationCondition: 'Normal',
      transportationDurationDays: 3,
      isFreshProduce: false
    }
  },
  {
    id: 'apples',
    name: 'Apples (Royal Gala)',
    category: 'Fresh Produce',
    description: 'Temperate pomaceous fruit with moderate respiration and ethylene emission; thrives in controlled low temperature.',
    defaultValues: {
      commodityType: 'Apples',
      moisture: 85,
      oilFat: 0.2,
      pH: 3.6,
      respirationRate: 'Medium',
      targetShelfLifeDays: 30,
      storageTemperature: 2,
      relativeHumidity: 90,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 2,
      isFreshProduce: true
    }
  },
  {
    id: 'bananas',
    name: 'Bananas (Cavendish Green/Ripe)',
    category: 'Fresh Produce',
    description: 'Tropical climacteric fruit; extremely chilling-sensitive below 12°C, high respiratory heat and ethylene production.',
    defaultValues: {
      commodityType: 'Bananas',
      moisture: 74,
      oilFat: 0.3,
      pH: 4.8,
      respirationRate: 'High',
      targetShelfLifeDays: 7,
      storageTemperature: 13,
      relativeHumidity: 85,
      storageType: 'Ambient',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 2,
      isFreshProduce: true
    }
  },
  {
    id: 'strawberries',
    name: 'Strawberries (Fresh Harvest)',
    category: 'Fresh Produce',
    description: 'Non-climacteric berry with fragile epidermis, extreme respiration, and rapid fungal spoilage (Botrytis cinerea).',
    defaultValues: {
      commodityType: 'Strawberries',
      moisture: 91,
      oilFat: 0.3,
      pH: 3.4,
      respirationRate: 'High',
      targetShelfLifeDays: 7,
      storageTemperature: 1,
      relativeHumidity: 92,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 1,
      isFreshProduce: true
    }
  },
  {
    id: 'paneer',
    name: 'Fresh Paneer / Cottage Cheese',
    category: 'Dairy & Protein',
    description: 'High moisture unaged curd cheese (55% moisture, 22% fat); prone to microbial slime, yeast/mold, and whey syneresis.',
    defaultValues: {
      commodityType: 'Fresh Paneer',
      moisture: 55,
      oilFat: 22,
      pH: 5.7,
      respirationRate: 'Low',
      targetShelfLifeDays: 15,
      storageTemperature: 4,
      relativeHumidity: 85,
      storageType: 'Chilled',
      transportationCondition: 'Refrigerated',
      transportationDurationDays: 2,
      isFreshProduce: false
    }
  }
];
