async (page) => {
  const base = "http://127.0.0.1:3003";
  const failures = [];
  const check = (ok, label) => {
    if (!ok) failures.push(label);
  };
  const consoleErrors = [];
  const requests = [];
  page.on("console", message => {
    if (message.type() === "error") {
      const location = message.location();
      consoleErrors.push(`${message.text()} @ ${location.url || "unknown"}`);
    }
  });
  page.on("request", request => requests.push(request.url()));

  let response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_200);
  check(response?.status() === 200, "home status");
  check(
    await page.title() === "Solar Contract Record Review & Consumer Resources | Solar Freedom",
    "home title",
  );
  check(
    await page.locator('link[rel="canonical"]').getAttribute("href")
      === "https://breakyoursolarcontract.com/",
    "home canonical",
  );
  check(
    (await page.locator('meta[name="robots"]').getAttribute("content") || "").includes("index"),
    "home indexable",
  );
  check(
    await page.getByRole("region", { name: "Privacy choices" }).isVisible(),
    "privacy choices visible",
  );
  check(
    await page.locator('[data-video-placeholder="hosted-media"]').count() === 3,
    "three hosted video placeholders",
  );
  const initialMp4Requests = requests.filter(url => url.endsWith(".mp4")).length;
  check(initialMp4Requests === 0, "no mp4 before click");
  check(
    !requests.some(url => /googletagmanager|google-analytics/.test(url)),
    "no analytics before consent",
  );

  const callbackButton = page.getByRole("button", { name: "REQUEST MY CASE REVIEW CALL →" });
  check(await callbackButton.isDisabled(), "callback disabled before consent");
  await page.getByRole("textbox", { name: "Phone number" }).fill("9045550123");
  check(await callbackButton.isDisabled(), "callback remains disabled without required consent");
  await page.getByRole("checkbox", { name: /Required: I authorize/ }).check();
  check(await callbackButton.isEnabled(), "callback enabled with phone and required consent");

  await page.locator('[data-video-placeholder="hosted-media"]').first().click();
  check(
    await page.locator('video[aria-label="Hidden Contract Clauses"]').count() === 1,
    "video created after click",
  );
  await page.getByRole("button", { name: "Decline optional analytics" }).click();
  check(
    await page.getByRole("region", { name: "Privacy choices" }).count() === 0,
    "privacy decision persisted in UI",
  );

  for (const [path, canonical] of [
    ["/privacy-policy", "https://breakyoursolarcontract.com/privacy-policy"],
    ["/terms", "https://breakyoursolarcontract.com/terms"],
  ]) {
    response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    check(response?.status() === 200, `${path} status`);
    check(
      await page.locator('link[rel="canonical"]').getAttribute("href") === canonical,
      `${path} canonical`,
    );
    check(
      (await page.locator('meta[name="robots"]').getAttribute("content") || "").includes("index"),
      `${path} indexable`,
    );
  }

  for (const path of [
    "/blog/adt-solar-cancellation-guide",
    "/cancel-solar-contract/dallas-tx",
    "/cancel-adt-solar-solar-contract",
    "/solar-contract-laws/alabama",
  ]) {
    response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    check(response?.status() === 200, `${path} withheld status`);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content") || "";
    check(robots.includes("noindex") && robots.includes("follow"), `${path} noindex follow`);
    const schemaTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schemaTypes = schemaTexts.flatMap(text => {
      try {
        const parsed = JSON.parse(text);
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        return nodes.flatMap(node => (
          Array.isArray(node?.["@graph"])
            ? node["@graph"].map(item => item?.["@type"])
            : [node?.["@type"]]
        ));
      } catch {
        return ["invalid-json"];
      }
    }).flat();
    check(
      !schemaTypes.includes("Article") && !schemaTypes.includes("FAQPage"),
      `${path} no Article/FAQ schema`,
    );
  }

  check(consoleErrors.length === 0, `normal-route console errors: ${consoleErrors.join(" | ")}`);
  consoleErrors.length = 0;

  response = await page.goto(`${base}/definitely-not-a-real-route-qa`, {
    waitUntil: "domcontentloaded",
  });
  check(response?.status() === 404, "unknown route true 404");
  check(
    (await page.locator('meta[name="robots"]').getAttribute("content") || "").includes("noindex"),
    "unknown route noindex",
  );

  await page.goto(`${base}/admin/content`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  check(
    (await page.locator('meta[name="robots"]').getAttribute("content") || "").includes("noindex"),
    "admin noindex",
  );

  const favicon = await page.request.get(`${base}/favicon.svg`);
  check(favicon.status() === 200, "favicon 200");
  const readiness = await page.request.get(`${base}/readyz`);
  check(readiness.status() === 503, "readiness reports missing DB");
  const inventedStorage = await page.request.get(`${base}/manus-storage/invented-secret.txt`, {
    maxRedirects: 0,
  });
  check(inventedStorage.status() === 404, "invented storage key blocked");
  const sitemapResponse = await page.request.get(`${base}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  check((sitemap.match(/<loc>/g) || []).length === 15, "sitemap has 15 approved URLs");
  check(
    !/<loc>[^<]+\/(?:blog\/|cancel-solar-contract\/|cancel-[^<]+-solar-contract|solar-contract-laws\/[a-z])/.test(sitemap),
    "sitemap excludes withheld detail URLs",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  check(dimensions.scroll <= dimensions.inner + 1, `mobile overflow ${dimensions.scroll}/${dimensions.inner}`);
  check(await page.getByRole("heading", { level: 1 }).isVisible(), "mobile h1 visible");

  const unexpectedRuntimeConsoleErrors = consoleErrors.filter(message => !(
    message.includes("404 (Not Found)")
    && message.includes("/definitely-not-a-real-route-qa")
  ));
  check(
    unexpectedRuntimeConsoleErrors.length === 0,
    `runtime console errors: ${unexpectedRuntimeConsoleErrors.join(" | ")}`,
  );
  if (failures.length) {
    throw new Error(`QA failures (${failures.length}): ${failures.join("; ")}`);
  }
  return {
    status: "passed",
    consoleErrors: unexpectedRuntimeConsoleErrors.length,
    expected404ConsoleEvents: consoleErrors.length - unexpectedRuntimeConsoleErrors.length,
    approvedSitemapUrls: (sitemap.match(/<loc>/g) || []).length,
    initialMp4Requests,
    mobileViewport: dimensions,
  };
}
