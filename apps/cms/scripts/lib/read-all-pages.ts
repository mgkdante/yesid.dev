export type PageReadDecision = "continue" | "stop";

export interface PageReadWindow<PageSize extends number = number> {
  readonly limit: PageSize;
  readonly offset: number;
}

export async function readAllPages<
  const PageSize extends number,
  Page,
>(input: {
  readonly pageSize: PageSize;
  readonly readPage: (
    window: Readonly<PageReadWindow<PageSize>>,
  ) => Promise<Page>;
  readonly visitPage: (page: Page) => PageReadDecision;
}): Promise<void> {
  if (!Number.isSafeInteger(input.pageSize) || input.pageSize <= 0) {
    throw new TypeError("Page size must be a positive safe integer");
  }

  for (let offset = 0; ; offset += input.pageSize) {
    const page = await input.readPage({ limit: input.pageSize, offset });
    if (input.visitPage(page) === "stop") return;
  }
}
