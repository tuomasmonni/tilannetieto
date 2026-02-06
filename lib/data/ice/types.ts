/**
 * SYKE Hydrologia OData — jäänpaksuustyypit
 */

export interface SykeStation {
  Paikka_Id: number;
  Nimi: string;
  KoordLat: string;  // DDMMSS latitude, e.g. "613602"
  KoordLong: string; // DDMMSS longitude, e.g. "292923"
  KuntaNimi?: string;
  JarviNimi?: string;
}

export interface SykeMeasurement {
  Paikka_Id: number;
  Aika: string; // ISO date
  Arvo: number | null; // Ice thickness in cm
  Lippu_Id?: number;
}

export interface IceObservation {
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  iceThickness: number;
  timestamp: string;
  municipality?: string;
  lakeName?: string;
}

export interface IcebreakerRoute {
  type: 'Feature';
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface IcebreakerGeoJSON {
  type: 'FeatureCollection';
  features: IcebreakerRoute[];
}
