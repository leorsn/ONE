/** Cover one 150 × 325 panel without stretching or exposing adjacent worlds. */
export function backgroundSpriteLayout(width: number, height: number, index: number) {
  const panelWidth = Math.max(width, height * 150 / 325);
  const panelHeight = panelWidth * 325 / 150;
  return {
    width: panelWidth * 6,
    height: panelHeight,
    left: (width - panelWidth) / 2 - index * panelWidth,
    top: (height - panelHeight) / 2
  };
}
