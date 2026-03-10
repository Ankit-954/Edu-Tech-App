let roadmapCache = null;

const normalizeRoadmapKey = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const loadRoadmaps = async () => {
  if (roadmapCache) return roadmapCache;

  const response = await fetch("/data/roadmap.json");
  if (!response.ok) {
    throw new Error("Failed to load roadmap data");
  }

  roadmapCache = await response.json();
  return roadmapCache;
};

export const findExactRoadmapKey = (roadmaps, value) => {
  const target = normalizeRoadmapKey(value);
  return Object.keys(roadmaps).find((key) => normalizeRoadmapKey(key) === target) || null;
};

export const findMatchingRoadmapKeys = (roadmaps, value) => {
  const target = normalizeRoadmapKey(value);
  if (!target) return [];

  return Object.keys(roadmaps).filter((key) => normalizeRoadmapKey(key).includes(target));
};
