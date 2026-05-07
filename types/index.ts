export interface DrinkRecord {
    id: string;
    imageUrl: string;
    day: number;
    month: number;
    year: number;
    cost: number;
    brand?: string;
    type: string; // name
    size?: string;
    temperature?: string;
    sweetness?: string;
}

export interface BrandMetricItem {
  brand: string;
  cups: number;
  cost: number;
  ratio: number;
}