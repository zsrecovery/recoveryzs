declare module "haversine-distance" {
  interface Coord {
    latitude: number;
    longitude: number;
  }

  function haversineDistance(a: Coord, b: Coord): number;
  export = haversineDistance;
}
