/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true }] },
  testMatch: ["**/__tests__/**/*.test.ts"],
};
