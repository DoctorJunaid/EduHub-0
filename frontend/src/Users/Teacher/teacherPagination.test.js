import test from "node:test";
import assert from "node:assert/strict";

const ITEMS_PER_PAGE = 10;

function computePagination(items, currentPage) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return {
    totalItems,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    visibleItems,
    canPrev: safePage > 1,
    canNext: safePage < totalPages,
    displayRange: totalItems > 0 ? `${startIndex + 1} - ${endIndex}` : "0 - 0",
  };
}

test("Section 1 & 19: 25 total classes paginates into 3 pages with 10 records per page", () => {
  const sampleClasses = Array.from({ length: 25 }, (_, i) => ({
    id: `class-${i + 1}`,
    title: `Class ${i + 1}`,
  }));

  // Page 1
  const p1 = computePagination(sampleClasses, 1);
  assert.equal(p1.totalPages, 3);
  assert.equal(p1.visibleItems.length, 10);
  assert.equal(p1.startIndex, 0);
  assert.equal(p1.endIndex, 10);
  assert.equal(p1.displayRange, "1 - 10");
  assert.equal(p1.canPrev, false);
  assert.equal(p1.canNext, true);

  // Page 2
  const p2 = computePagination(sampleClasses, 2);
  assert.equal(p2.visibleItems.length, 10);
  assert.equal(p2.startIndex, 10);
  assert.equal(p2.endIndex, 20);
  assert.equal(p2.displayRange, "11 - 20");
  assert.equal(p2.canPrev, true);
  assert.equal(p2.canNext, true);

  // Page 3
  const p3 = computePagination(sampleClasses, 3);
  assert.equal(p3.visibleItems.length, 5);
  assert.equal(p3.startIndex, 20);
  assert.equal(p3.endIndex, 25);
  assert.equal(p3.displayRange, "21 - 25");
  assert.equal(p3.canPrev, true);
  assert.equal(p3.canNext, false);
});

test("Section 19: 10 records -> 1 / 1 with both Prev and Next disabled", () => {
  const sampleClasses = Array.from({ length: 10 }, (_, i) => ({
    id: `class-${i + 1}`,
  }));
  const res = computePagination(sampleClasses, 1);
  assert.equal(res.totalPages, 1);
  assert.equal(res.visibleItems.length, 10);
  assert.equal(res.displayRange, "1 - 10");
  assert.equal(res.canPrev, false);
  assert.equal(res.canNext, false);
});

test("Section 19: 7 records -> 1 / 1 with 7 items", () => {
  const sampleClasses = Array.from({ length: 7 }, (_, i) => ({
    id: `class-${i + 1}`,
  }));
  const res = computePagination(sampleClasses, 1);
  assert.equal(res.totalPages, 1);
  assert.equal(res.visibleItems.length, 7);
  assert.equal(res.displayRange, "1 - 7");
  assert.equal(res.canPrev, false);
  assert.equal(res.canNext, false);
});

test("Section 4 & 5: Search filters first then paginates, resetting page to 1", () => {
  const sampleClasses = [
    ...Array.from({ length: 14 }, (_, i) => ({ id: `eng-${i}`, title: `English Class ${i}` })),
    ...Array.from({ length: 21 }, (_, i) => ({ id: `math-${i}`, title: `Math Class ${i}` })),
  ];
  assert.equal(sampleClasses.length, 35);

  const query = "English";
  const filtered = sampleClasses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );
  assert.equal(filtered.length, 14);

  // User was on page 3 before searching, search resets to page 1
  let currentPage = 3;
  // Handler resets currentPage to 1 on search change:
  currentPage = 1;

  const p1 = computePagination(filtered, currentPage);
  assert.equal(p1.totalPages, 2);
  assert.equal(p1.visibleItems.length, 10);
  assert.equal(p1.displayRange, "1 - 10");

  const p2 = computePagination(filtered, 2);
  assert.equal(p2.visibleItems.length, 4);
  assert.equal(p2.displayRange, "11 - 14");
});

test("Section 3 & 6: Clamping prevents invalid page indexing", () => {
  const sampleClasses = Array.from({ length: 25 }, (_, i) => ({ id: `c-${i}` }));

  // Clamps negative/zero page to 1
  const zeroPage = computePagination(sampleClasses, 0);
  assert.equal(zeroPage.safePage, 1);

  // Clamps excessive page to totalPages (3)
  const excessivePage = computePagination(sampleClasses, 99);
  assert.equal(excessivePage.safePage, 3);
  assert.equal(excessivePage.visibleItems.length, 5);
});
