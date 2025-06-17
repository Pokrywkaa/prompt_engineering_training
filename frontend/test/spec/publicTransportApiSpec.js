describe('PublicTransportAPI', function() {
    // Mock data for testing
    const mockStartCoords = { lat: 51.1079, lng: 17.0385 };
    const mockEndCoords = { lat: 51.1100, lng: 17.0400 };
    const mockStartTime = '2025-06-17T10:00:00.000Z';
    const mockLimit = '5';
    const mockTripId = 'trip123';

    const mockDeparturesResponse = {
        departures: [
            {
                route_id: '101',
                trip_id: 'trip123',
                trip_headsign: 'Dworzec Główny',
                stop: {
                    name: 'Rynek',
                    arrival_time: '2025-06-17T10:15:00.000Z',
                    departure_time: '2025-06-17T10:15:00.000Z',
                    coordinates: {
                        latitude: 51.1079,
                        longitude: 17.0385
                    }
                }
            }
        ]
    };

    const mockTripResponse = {
        trip_details: {
            trip_id: 'trip123',
            route_id: '101',
            trip_headsign: 'Dworzec Główny',
            stops: [
                { name: 'Rynek', departure_time: '10:15' },
                { name: 'Plac Dominikański', departure_time: '10:18' }
            ]
        }
    };

    beforeEach(function() {
        // Set up fetch mock
        spyOn(window, 'fetch');
    });

    describe('getClosestDepartures', function() {
        it('should make a correct API call and return departures data', async function() {
            // Arrange
            const mockResponse = {
                ok: true,
                json: jasmine.createSpy('json').and.returnValue(Promise.resolve(mockDeparturesResponse))
            };
            window.fetch.and.returnValue(Promise.resolve(mockResponse));

            // Act
            const result = await PublicTransportAPI.getClosestDepartures(
                mockStartCoords,
                mockEndCoords,
                mockStartTime,
                mockLimit
            );

            // Assert
            expect(window.fetch).toHaveBeenCalledWith(
                '/public_transport/city/Wroclaw/closest_departures?start_coordinates=51.1079%2C17.0385&end_coordinates=51.11%2C17.04&start_time=2025-06-17T10%3A00%3A00.000Z&limit=5'
            );
            expect(result).toEqual(mockDeparturesResponse);
        });

        it('should throw an error when the response is not ok', async function() {
            // Arrange
            const mockResponse = {
                ok: false,
                status: 404
            };
            window.fetch.and.returnValue(Promise.resolve(mockResponse));

            // Act & Assert
            try {
                await PublicTransportAPI.getClosestDepartures(
                    mockStartCoords,
                    mockEndCoords,
                    mockStartTime,
                    mockLimit
                );
                fail('Expected method to throw an error');
            } catch (error) {
                expect(error.message).toBe('HTTP error! status: 404');
            }
        });

        it('should handle network errors', async function() {
            // Arrange
            window.fetch.and.returnValue(Promise.reject(new Error('Network error')));

            // Act & Assert
            try {
                await PublicTransportAPI.getClosestDepartures(
                    mockStartCoords,
                    mockEndCoords,
                    mockStartTime,
                    mockLimit
                );
                fail('Expected method to throw an error');
            } catch (error) {
                expect(error.message).toBe('Network error');
            }
        });
    });

    describe('getTripDetails', function() {
        it('should make a correct API call and return trip details', async function() {
            // Arrange
            const mockResponse = {
                ok: true,
                json: jasmine.createSpy('json').and.returnValue(Promise.resolve(mockTripResponse))
            };
            window.fetch.and.returnValue(Promise.resolve(mockResponse));

            // Act
            const result = await PublicTransportAPI.getTripDetails(mockTripId);

            // Assert
            expect(window.fetch).toHaveBeenCalledWith(
                '/public_transport/city/Wroclaw/trip/trip123'
            );
            expect(result).toEqual(mockTripResponse);
        });

        it('should throw an error when the response is not ok', async function() {
            // Arrange
            const mockResponse = {
                ok: false,
                status: 500
            };
            window.fetch.and.returnValue(Promise.resolve(mockResponse));

            // Act & Assert
            try {
                await PublicTransportAPI.getTripDetails(mockTripId);
                fail('Expected method to throw an error');
            } catch (error) {
                expect(error.message).toBe('HTTP error! status: 500');
            }
        });

        it('should handle network errors', async function() {
            // Arrange
            window.fetch.and.returnValue(Promise.reject(new Error('Connection failed')));

            // Act & Assert
            try {
                await PublicTransportAPI.getTripDetails(mockTripId);
                fail('Expected method to throw an error');
            } catch (error) {
                expect(error.message).toBe('Connection failed');
            }
        });
    });

    describe('URL construction', function() {
        it('should properly encode coordinates in the URL', async function() {
            // Arrange
            const coordsWithSpecialChars = { lat: 51.1079, lng: 17.0385 };
            const mockResponse = {
                ok: true,
                json: jasmine.createSpy('json').and.returnValue(Promise.resolve(mockDeparturesResponse))
            };
            window.fetch.and.returnValue(Promise.resolve(mockResponse));

            // Act
            await PublicTransportAPI.getClosestDepartures(
                coordsWithSpecialChars,
                coordsWithSpecialChars,
                mockStartTime,
                mockLimit
            );

            // Assert
            expect(window.fetch).toHaveBeenCalledWith(
                jasmine.stringMatching(/start_coordinates=51\.1079%2C17\.0385/)
            );
        });
    });
});
