export interface Level {
  level: number;
  name: string;
  minPoints: number;
}

export const levels: Level[] = [
  { level: 1, name: "Sprout", minPoints: 0 },
  { level: 2, name: "Seedling", minPoints: 100 },
  { level: 3, name: "Gardener", minPoints: 250 },
  { level: 4, name: "Conservationist", minPoints: 500 },
  { level: 5, name: "Eco-Warrior", minPoints: 1000 },
  { level: 6, name: "Planet Hero", minPoints: 2000 },
];

export const getLevelFromPoints = (points: number): Level => {
  return levels.slice().reverse().find(l => points >= l.minPoints) || levels[0];
};