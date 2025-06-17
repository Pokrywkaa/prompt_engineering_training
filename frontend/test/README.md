# Public Transport API Tests

## 🚀 Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run tests in browser
npm test

# Run tests with HTTP server
npm run test:serve
```

## Running the Tests

### Option 1: NPM Commands (Recommended)

```bash
# From the frontend directory
npm test                  # Open tests in browser
npm run test:serve       # Start HTTP server with tests
npm install              # Install dependencies (if needed)
```

### Option 2: Direct Script Execution

```bash
# From the test directory
./run-tests.sh           # Open tests in browser
./run-tests.sh serve     # Start HTTP server with tests

# From the frontend directory
test/run-tests.sh        # Open tests in browser
test/run-tests.sh serve  # Start HTTP server with tests
```

### Option 3: Manual Browser Opening

```bash
# Direct file opening (no server)
open test/SpecRunner.html
# or double-click the file
```

### Option 4: HTTP Server Mode

```bash
# Serves tests at http://localhost:3001/test/SpecRunner.html
npm run test:serve
```Jasmine tests for the PublicTransportAPI class.

## Quick Start

1. **Run Tests in Browser:**
   - Open `SpecRunner.html` in your web browser
   - Tests will run automatically and show results

2. **Test Structure:**
   - `spec/publicTransportApiSpec.js` - Main test file for PublicTransportAPI
   - `SpecRunner.html` - HTML test runner that loads Jasmine and runs tests

## Test Coverage

The tests cover:

### ✅ `getClosestDepartures()` method

- ✅ Successful API calls with correct parameters
- ✅ Error handling for HTTP errors (404, 500, etc.)
- ✅ Network error handling
- ✅ URL parameter encoding

### ✅ `getTripDetails()` method

- ✅ Successful API calls with trip ID
- ✅ Error handling for HTTP errors
- ✅ Network error handling

### ✅ URL Construction

- ✅ Proper parameter encoding
- ✅ Correct API endpoint usage

## Running the Tests

### Option 1: Browser (Recommended for Development)

```bash
# From the frontend directory
open test/SpecRunner.html
# or
firefox test/SpecRunner.html
# or simply double-click the file
```

### Option 2: Live Server (if you have one running)

```bash
# If you have a local server running on localhost:3000
# Navigate to: http://localhost:3000/test/SpecRunner.html
```

## Test Structure

Each test follows the **Arrange-Act-Assert** pattern:

```javascript
it('should do something', async function() {
    // Arrange - Set up test data and mocks
    const mockData = { /* ... */ };
    spyOn(window, 'fetch').and.returnValue(/* mock response */);

    // Act - Call the method being tested
    const result = await PublicTransportAPI.someMethod();

    // Assert - Verify the results
    expect(result).toEqual(expectedResult);
});
```

## Mock Strategy

The tests use **Jasmine spies** to mock the `fetch` API:

- No real HTTP requests are made during testing
- Tests run fast and don't depend on external services
- Different response scenarios can be easily simulated

## Adding New Tests

To add tests for new API methods:

1. Add the method to the `PublicTransportAPI` class in `SpecRunner.html`
2. Create a new `describe` block in `publicTransportApiSpec.js`
3. Add individual test cases with proper mocks

Example:

```javascript
describe('newMethod', function() {
    it('should handle success case', async function() {
        // Test implementation
    });

    it('should handle error case', async function() {
        // Error test implementation
    });
});
```
