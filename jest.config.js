/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  preset: "ts-jest",
  testEnvironment: "jsdom",
};
