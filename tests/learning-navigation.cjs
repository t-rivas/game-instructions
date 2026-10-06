// Hosted Learn uses stages; the portable guide keeps its existing layout.
async function learningStage(page, stage) {
  const button = page.locator(`[data-learning-stage=${stage}]`);
  if (await button.count()) await button.click();
}
async function learningExample(page) {
  if (!(await page.locator('[data-learning-stage]').count())) return;
  await learningStage(page, 'turn');
  await page.locator('#learning-step').selectOption('example');
}
module.exports = {learningStage, learningExample};
