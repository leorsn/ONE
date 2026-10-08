export const worlds = [
  { id: "aurora", name: "Aurora", label: "Memory as atmosphere.", descriptor: "Pastel sky · a glass horizon", index: "01", screen: "home" },
  { id: "monolith", name: "Monolith", label: "Quiet. Focused. Reduced.", descriptor: "Graphite stone · mist and depth", index: "02", screen: "search" },
  { id: "platinum", name: "Platinum", label: "Light, clarity and structure.", descriptor: "Ivory dunes · soft metallic light", index: "03", screen: "saved" },
  { id: "archive", name: "Archive", label: "A little closer to nature.", descriptor: "Sage garden · quiet natural light", index: "04", screen: "home" },
  { id: "canyon", name: "Canyon", label: "Warmth with a sculptural edge.", descriptor: "Copper stone · warm sculptural light", index: "05", screen: "saved" },
  { id: "tidal", name: "Tidal", label: "A clearer kind of calm.", descriptor: "Crystal water · cool luminous depth", index: "06", screen: "calendar" },
] as const;

export type WorldId = typeof worlds[number]["id"];
