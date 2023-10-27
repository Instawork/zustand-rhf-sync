import { deepCompareDifferences } from "../src/utils";

it("deepCompareDifferences should return an empty array when the objects are the same", () => {
  expect(deepCompareDifferences({ a: 1 }, { a: 1 })).toEqual([]);
});

it("deepCompareDifferences should return the path and new value when the objects are different", () => {
  expect(deepCompareDifferences({ a: 1 }, { a: 2 })).toEqual([["a", 1]]);
});

it("deepCompareDifferences should work with nested objects", () => {
  expect(deepCompareDifferences({ a: { b: 1 } }, { a: { b: 2 } })).toEqual([
    ["a.b", 1],
  ]);
});

it("deepCompareDifferences should work with arrays", () => {
  expect(deepCompareDifferences({ a: [1, 2] }, { a: [1, 3] })).toEqual([
    ["a.1", 2],
  ]);
});

it("deepCompareDifferences should work with arrays of objects", () => {
  expect(
    deepCompareDifferences(
      { a: [{ b: 1 }, { b: 2 }] },
      { a: [{ b: 1 }, { b: 3 }] },
    ),
  ).toEqual([["a.1.b", 2]]);
});

it("deepCompareDifferences should work with arrays of arrays", () => {
  expect(deepCompareDifferences({ a: [[1], [2]] }, { a: [[1], [3]] })).toEqual([
    ["a.1.0", 2],
  ]);
});

it("deepCompareDifferences should work objects with arrays", () => {
  expect(deepCompareDifferences({ a: { b: [1] } }, { a: { b: [2] } })).toEqual([
    ["a.b.0", 1],
  ]);
});

it("deepCompareDifferences should work with multiple differences", () => {
  expect(
    deepCompareDifferences(
      { a: { b: [1, 2], c: 3 } },
      { a: { b: [1, 3], c: 4 } },
    ),
  ).toEqual([
    ["a.b.1", 2],
    ["a.c", 3],
  ]);
});
