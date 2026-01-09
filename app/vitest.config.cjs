module.exports = {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    include: [
      'src/tests/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.test.{js,jsx,ts,tsx}'
    ]
  }
}
