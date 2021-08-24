module.exports = {
  roots: ['./src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  collectCoverage: true,
  coverageReporters: ['json-summary'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/ported/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['./node_modules/reflect-metadata/Reflect.js'],
  testEnvironment: 'node'
};
