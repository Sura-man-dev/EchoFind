const STOP_WORDS = new Set(["the", "and", "with", "for", "item", "lost", "found"]);

function words(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );
}

function overlap(left, right) {
  const leftWords = words(left);
  const rightWords = words(right);
  return [...leftWords].filter((word) => rightWords.has(word));
}

export function scoreMatch(lost, found) {
  let score = 0;
  const reasons = [];
  const sharedItemWords = overlap(lost.itemName, found.itemName);
  const sharedDescriptionWords = overlap(lost.description, found.description);

  if (lost.category && found.category && lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 25;
    reasons.push(`Same category: ${lost.category}`);
  }

  if (sharedItemWords.length) {
    score += Math.min(35, sharedItemWords.length * 18);
    reasons.push(`Shared item details: ${sharedItemWords.slice(0, 3).join(", ")}`);
  }

  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    score += 15;
    reasons.push(`Same brand: ${lost.brand}`);
  }

  if (lost.color && found.color && lost.color.toLowerCase() === found.color.toLowerCase()) {
    score += 10;
    reasons.push(`Same color: ${lost.color}`);
  }

  if (overlap(lost.lostLocation, found.foundLocation).length) {
    score += 10;
    reasons.push("Locations have matching details");
  }

  if (sharedDescriptionWords.length) {
    score += Math.min(5, sharedDescriptionWords.length);
    reasons.push("Descriptions share identifying details");
  }

  const lostDate = new Date(lost.lostDate).getTime();
  const foundDate = new Date(found.foundDate).getTime();
  if (Number.isFinite(lostDate) && Number.isFinite(foundDate) && Math.abs(lostDate - foundDate) <= 7 * 86400000) {
    score += 5;
    reasons.push("Dates are within one week");
  }

  return { score: Math.min(100, score), reasons };
}

export function getMatchSuggestions(lostReports, foundReports) {
  return lostReports
    .flatMap((lost) => foundReports.map((found) => {
      const result = scoreMatch(lost, found);
      return { lost, found, ...result };
    }))
    .filter((match) => match.score >= 35)
    .sort((left, right) => right.score - left.score);
}