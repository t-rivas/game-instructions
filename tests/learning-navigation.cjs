// Hosted Learn has a single Contents panel; portable guides keep their layout.
async function learningContents(page) {
  const contents = page.locator('#lesson-overview');
  if (await contents.count() && !await contents.evaluate(node => node.open))
    await contents.locator(':scope > summary').click();
}
async function learningStage(page, stage) {
  const button = page.locator(`[data-learning-stage=${stage}]`);
  if (await button.count()) { await learningContents(page); await button.click(); }
}
async function learningLesson(page, lesson) {
  await learningContents(page);
  await page.locator(`[data-lesson-target="${lesson}"]`).click();
}
async function learningExample(page) {
  if (!(await page.locator('[data-learning-stage]').count())) return;
  await learningLesson(page, 'example');
}
async function learningSetupOptions(page) {
  const options = page.locator('details#guide-setup-options');
  if (await options.count() && !await options.evaluate(node => node.open))
    await options.locator(':scope > summary').click();
}
async function openDisclosure(page, selector) {
  const panel = page.locator(selector);
  if (await panel.count() && !await panel.evaluate(node => node.open))
    await panel.locator(':scope > summary').click();
}
module.exports = {learningContents, learningStage, learningLesson, learningExample, learningSetupOptions, openDisclosure};
