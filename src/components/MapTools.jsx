import axios from 'axios';


const mapboxAccessToken = 'pk.eyJ1Ijoic2lkZGhhbnQ5NTExIiwiYSI6ImNtMTg0OWoxZDB6OWgyanM4aTVwNGhrM2MifQ.5GCuU6h-QDhSUJVddrE2hw';


export const getDirections = async (startSearch, destSearch, setRoutes, setCurLocation, setShowDirections) => {
    
    const parseCoordinates = (input) => {
        const coordinates = /^([-+]?\d{1,2}(?:\.\d+)?)°?\s*([NS])?,?\s*([-+]?\d{1,3}(?:\.\d+)?)°?\s*([EW])?$/i;
        const match = input.trim().match(coordinates);

        if (match) {
            let lat = parseFloat(match[1]);
            let lng = parseFloat(match[3]);

            if (match[2] && match[2].toUpperCase() === 'S') {
                lat = -lat;
            }
            if (match[4] && match[4].toUpperCase() === 'W') {
                lng = -lng;
            }

            return { lat, lng };
        }

        return null;
    };


    const fetchCoordinates = async (location) => {
        try {
            const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`, {
                params: {
                    access_token: mapboxAccessToken,
                },
            });
            const data = response.data;
            if (data.features && data.features.length > 0) {
                const { center } = data.features[0];
                return {
                    lat: center[1],
                    lng: center[0],
                };
            } else {
                throw new Error('Location not found.');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };


    let startLocation = parseCoordinates(startSearch);
    let destLocation = parseCoordinates(destSearch);

    if (!startLocation) {
        startLocation = await fetchCoordinates(startSearch);
    }
    if (!destLocation) {
        destLocation = await fetchCoordinates(destSearch);
    }

    if (startLocation && destLocation) {
        setRoutes((prevRoutes) => [
            ...prevRoutes,
            {
                id: `Route${prevRoutes.length + 1}`,
                start: startLocation,
                end: destLocation,
            },
        ]);
        setCurLocation(startLocation);
        setShowDirections(true);
    } 
    else {
        console.error('Invalid coordinates or location names for start or destination.');
    }
};









