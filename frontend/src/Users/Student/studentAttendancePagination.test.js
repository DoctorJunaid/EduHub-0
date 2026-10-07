import test from "node:test";
import assert from "node:assert/strict";

const ITEMS_PER_PAGE = 10;

function computeAttendancePagination(items, currentPage, itemLabel = "subjects") {
  const totalItems = (items || []).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const visibleItems = (items || []).slice(startIndex, endIndex);

  const itemWord = totalItems === 1 ? itemLabel.replace(/s$/, "") : itemLabel;
  const text = `Showing ${startIndex + 1} - ${endIndex} of ${totalItems} total ${itemWord}`;

  return {
    totalItems,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    visibleItems,
    canPrev: safePage > 1,
    canNext: safePage < totalPages,
    pageIndicator: `${safePage} / ${totalPages}`,
    text,
    shouldShowFooter: totalItems > 0,
  };
}

const UMAIR_ALI_COURSES = [
  "English Language",
  "Urdu Literature",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Pakistan Studies",
  "Islamiat & Ethics",
  "Urdu Compulsory",
  "English Compulsory",
  "Mutala-e-Quran-e-Hakeem",
  "Islamic Studies (Islamiat)",
];

test("Daily Attendance Progress: 13 enrolled subjects paginates with 10 on Page 1 and 3 on Page 2", () => {
  // Page 1
  const p1 = computeAttendancePagination(UMAIR_ALI_COURSES, 1, "subjects");
  assert.equal(p1.totalItems, 13);
  assert.equal(p1.totalPages, 2);
  assert.equal(p1.safePage, 1);
  assert.equal(p1.visibleItems.length, 10);
  assert.equal(p1.visibleItems[0], "English Language");
  assert.equal(p1.visibleItems[9], "Urdu Compulsory");
  assert.equal(p1.text, "Showing 1 - 10 of 13 total subjects");
  assert.equal(p1.canPrev, false);
  assert.equal(p1.canNext, true);
  assert.equal(p1.pageIndicator, "1 / 2");
  assert.equal(p1.shouldShowFooter, true);

  // Page 2
  const p2 = computeAttendancePagination(UMAIR_ALI_COURSES, 2, "subjects");
  assert.equal(p2.safePage, 2);
  assert.equal(p2.visibleItems.length, 3);
  assert.deepEqual(p2.visibleItems, [
    "English Compulsory",
    "Mutala-e-Quran-e-Hakeem",
    "Islamic Studies (Islamiat)",
  ]);
  assert.equal(p2.text, "Showing 11 - 13 of 13 total subjects");
  assert.equal(p2.canPrev, true);
  assert.equal(p2.canNext, false);
  assert.equal(p2.pageIndicator, "2 / 2");
});

test("Out of bounds clamping works correctly for course pages", () => {
  // Negative or zero page clamps to 1
  const p0 = computeAttendancePagination(UMAIR_ALI_COURSES, 0, "subjects");
  assert.equal(p0.safePage, 1);
  assert.equal(p0.visibleItems.length, 10);

  // Page index beyond total pages clamps to last valid page (2)
  const p99 = computeAttendancePagination(UMAIR_ALI_COURSES, 99, "subjects");
  assert.equal(p99.safePage, 2);
  assert.equal(p99.visibleItems.length, 3);
});

test("Daily Attendance Log: Empty state (0 records) hides pagination footer", () => {
  const pEmpty = computeAttendancePagination([], 1, "records");
  assert.equal(pEmpty.totalItems, 0);
  assert.equal(pEmpty.visibleItems.length, 0);
  assert.equal(pEmpty.shouldShowFooter, false);
});

test("Daily Attendance Log: Populated state (24 records) paginates dynamically", () => {
  const sampleLogs = Array.from({ length: 24 }, (_, i) => ({ id: `rec-${i + 1}` }));

  // Page 1
  const p1 = computeAttendancePagination(sampleLogs, 1, "records");
  assert.equal(p1.totalItems, 24);
  assert.equal(p1.totalPages, 3);
  assert.equal(p1.visibleItems.length, 10);
  assert.equal(p1.text, "Showing 1 - 10 of 24 total records");
  assert.equal(p1.canPrev, false);
  assert.equal(p1.canNext, true);
  assert.equal(p1.pageIndicator, "1 / 3");

  // Page 3
  const p3 = computeAttendancePagination(sampleLogs, 3, "records");
  assert.equal(p3.visibleItems.length, 4);
  assert.equal(p3.text, "Showing 21 - 24 of 24 total records");
  assert.equal(p3.canPrev, true);
  assert.equal(p3.canNext, false);
  assert.equal(p3.pageIndicator, "3 / 3");
});

test("Single subject/record wording uses singular form", () => {
  const single = ["Mathematics"];
  const res = computeAttendancePagination(single, 1, "subjects");
  assert.equal(res.text, "Showing 1 - 1 of 1 total subject");
  assert.equal(res.canPrev, false);
  assert.equal(res.canNext, false);
});
