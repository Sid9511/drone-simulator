import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import citiesData from '../data/Cities.json';
import { getDirections } from './MapTools';
import { FaLocationCrosshairs,} from "react-icons/fa6";
import { FaRedoAlt } from "react-icons/fa";
import { GiDeliveryDrone } from "react-icons/gi";


const Map1 = () => {
  
  const [viewport, setViewport] = useState({
    longitude: 73.8567,
    latitude: 18.5204,
    zoom: 3,
  });


  const [curLocation, setCurLocation] = useState(null);

  const [startCitySgstn, setStartCitySgstn] = useState(-1);
  const [destCitySgstn, setDestCitySgstn] = useState(-1);
  const [fltrStartCity, setFltrStartCity] = useState([]);
  const [fltrDestCity, setFltrDestCity] = useState([]);
  const [startCity, setstartCity] = useState('');
  const [destCity, setdestCity] = useState('');

  const directionsRef = useRef(null);
  const mapRef = useRef(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routes, setRoutes] = useState([]);

  const [objectPosition, setObjectPosition] = useState(null);
  const [directionsMapped, setDirectionsMapped] = useState(false);
  const [simulation, setSimulation] = useState(false);

  const mapboxAccessToken = 'pk.eyJ1Ijoic2lkZGhhbnQ5NTExIiwiYSI6ImNtMTg0OWoxZDB6OWgyanM4aTVwNGhrM2MifQ.5GCuU6h-QDhSUJVddrE2hw';



  useEffect(() => {
    if (startCity.length > 0) {
      const results = citiesData.filter(city =>
        city.city_ascii && city.city_ascii.toLowerCase().startsWith(startCity.toLowerCase())
      );
      setFltrStartCity(results);
    } 
    else {
      setFltrStartCity([]);
    }
    setStartCitySgstn(-1);
  }, [startCity]);  



  useEffect(() => {
    if (destCity.length > 0) {
      const results = citiesData.filter(city =>
        city.city_ascii && city.city_ascii.toLowerCase().startsWith(destCity.toLowerCase())
      );
      setFltrDestCity(results);
    } 
    else {
      setFltrDestCity([]);
    }
    setDestCitySgstn(-1);
  }, [destCity]);



  useEffect(() => {
    if (routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      setViewport({
        longitude: lastRoute.end.lng,
        latitude: lastRoute.end.lat,
        zoom: 12,
      });
    } 
    else if (curLocation) {
      setViewport({
        longitude: curLocation.longitude,
        latitude: curLocation.latitude,
        zoom: 12,
      });
    }
  }, [routes, curLocation]);



  useEffect(() => {
    if (mapRef.current && curLocation && showDirections) {
      const directions = new MapboxDirections({
        accessToken: mapboxAccessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
      });

      mapRef.current.addControl(directions, 'top-left');
      directionsRef.current = directions;

      if (routes.length > 0) {
        const lastRoute = routes[routes.length - 1];
        directions.setOrigin([lastRoute.start.lng, lastRoute.start.lat]);
        directions.setDestination([lastRoute.end.lng, lastRoute.end.lat]);
      }

      return () => {
        if (mapRef.current && directionsRef.current) {
          mapRef.current.removeControl(directionsRef.current);
          directionsRef.current = null;
        }
      };
    }
  }, [curLocation, routes, showDirections]);





  const getCurLocation = () => {
    navigator.geolocation.getCurrentPosition(handleCurLocation, handleError);
  };
  
  const handleCurLocation = (position) => {
    const { latitude, longitude } = position.coords;
    setCurLocation({ latitude, longitude });
    setViewport(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: 12,
    }));
  };

  const handleError = (error) => {
      console.error('Error getting location:', error);
  };


  const handleStartInputChange = (e) => {
    setstartCity(e.target.value);
  };



  const handleDestInputChange = (e) => {
    setdestCity(e.target.value);
  };




  const handleStartInput = (e, city = null) => {
    if (city) {
      setstartCity(city.city_ascii);
      setFltrStartCity([]);
    } 
    else if (e) {

      if (e.key === 'ArrowDown') {
        setStartCitySgstn(prev => prev < fltrStartCity.length - 1 ? prev + 1 : prev);
      } 
      else if (e.key === 'ArrowUp') {
        setStartCitySgstn(prev => (prev > 0 ? prev - 1 : 0));
      } 
      else if (e.key === 'Enter' && startCitySgstn >= 0) {
        setstartCity(fltrStartCity[startCitySgstn].city_ascii);
        setFltrStartCity([]);
      }
    }
  };
  


  const handleDestInput = (e, city = null) => {
    if (city) {

      setdestCity(city.city_ascii);
      setFltrDestCity([]);
    } 
    else if (e) {

      if (e.key === 'ArrowDown') {
        setDestCitySgstn(prev => prev < fltrDestCity.length - 1 ? prev + 1 : prev);
      } 
      else if (e.key === 'ArrowUp') {
        setDestCitySgstn(prev => (prev > 0 ? prev - 1 : 0));
      } 
      else if (e.key === 'Enter' && destCitySgstn >= 0) {
        setdestCity(fltrDestCity[destCitySgstn].city_ascii);
        setFltrDestCity([]); 
      } 
      else if (e.key === 'Enter' && startCity && destCity) {
        getDirections();
      }
    }
  };
  


  const handleGetDirections = async () => {
    await getDirections(startCity, destCity, setRoutes, setCurLocation, setShowDirections);
    setstartCity('');
    setdestCity('');
    setDirectionsMapped(true);
  };


  const handleSimulation = () => {
    if (directionsMapped && routes.length > 0) { 
      const lastRoute = routes[routes.length - 1];
      const startPoint = lastRoute.start; 
      const endPoint = lastRoute.end;
  
      const steps = 100; 
      const stepLat = (endPoint.lat - startPoint.lat) / steps;
      const stepLng = (endPoint.lng - startPoint.lng) / steps;
  
      let currentStep = 0;
  
      const interval = setInterval(() => {
        if (currentStep < steps) {
          setObjectPosition({
            lat: startPoint.lat + stepLat * currentStep,
            lng: startPoint.lng + stepLng * currentStep,
          });
          currentStep++;
        } 
        else {
          clearInterval(interval);
          setSimulation(false);
        }
      }, 100); 
    }
  };


   const handleReset = () => {
    setDirectionsMapped(false);
    setSimulation(false);
    setObjectPosition(null);
    setRoutes([]); 
    setCurLocation(null); 
    setViewport(prev => ({
        ...prev,
        longitude: 73.8567,
        latitude: 18.5204,
        zoom: 3,
    }));
  };
  


  return (
    <>
      <div className="fixed flex top-0 left-0 right-0 mx-auto w-full z-50 bg-transparent">
        <div className="flex flex-col py-2 bg-black w-[50%] mx-auto mt-2 rounded-lg opacity-80 hover:opacity-100 z-0">
          <div className="flex">
            {!directionsMapped && (
              <>
                <div className="relative flex flex-col px-3 w-1/2 m-1">
                  <label className="text-white text-base mb-1">Start:</label>
                  <div className="relative w-full">
                    <input
                      className="w-full h-10 p-2 rounded bg-white text-black text-sm"
                      type="text"
                      placeholder="Enter City, Co-ordinates"
                      value={startCity}
                      onChange={handleStartInputChange}
                      onKeyDown={handleStartInput}
                    />

                    <input
                      className="absolute top-0 right-4 w-[90px] h-10 p-2 rounded bg-white text-black text-xs z-10 cursor-pointer"
                      type="file"
                      accept=".csv, .json"
                    />

                    {fltrStartCity.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                        {fltrStartCity.map((city, index) => (
                          <div
                            key={city.id}
                            className={`p-2 cursor-pointer ${index === startCitySgstn ? 'bg-gray-200' : ''}`}
                            onClick={() => handleStartInput(city)}
                          >
                            {city.city_ascii} ({city.country})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative flex flex-col px-3 w-1/2 m-1">
                  <label className="text-white text-base mb-1">Destination:</label>
                  <div className="relative w-full">
                    <input
                      className="w-full h-10 p-2 rounded bg-white text-black text-sm"
                      type="text"
                      placeholder="Enter City, Co-ordinates"
                      value={destCity}
                      onChange={handleDestInputChange}
                      onKeyDown={handleDestInput}
                    />

                    <input
                      className="absolute top-0 right-4 w-[90px] h-10 p-2 rounded bg-white text-black text-xs z-10 cursor-pointer"
                      type="file"
                      accept=".csv, .json"
                    />

                    {fltrDestCity.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                        {fltrDestCity.map((city, index) => (
                          <div
                            key={city.id}
                            className={`p-2 cursor-pointer ${index === destCitySgstn ? 'bg-gray-200' : ''}`}
                            onClick={() => handleDestInput(city)}
                          >
                            {city.city_ascii} ({city.country})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {directionsMapped && (
              <div className="flex w-full justify-around">
                <button
                  onClick={handleSimulation}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Start Simulation
                </button>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reset Location
                </button>
              </div>
            )}
          </div>

          {!directionsMapped && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleGetDirections}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!startCity || !destCity}
              >
                Get Directions
              </button>
            </div>
          )}
        </div>
        
         <div className="locateBtns flex flex-col h-24 absolute top-10 right-10 space-y-2">
           <button 
            className="h-12 w-12 bg-gray-900 rounded-full flex items-center justify-center text-slate-200 hover:text-white text-2xl z-60"
            onClick={getCurLocation}>
            <FaLocationCrosshairs />
          </button>

          <button 
            className="h-12 w-12 bg-gray-900 rounded-full flex items-center justify-center text-slate-200 hover:text-white text-2xl z-60"
            onClick={handleReset}>
            <FaRedoAlt />
          </button>
        </div>
      </div>


      <div className="absolute w-screen h-screen z-0">
        <Map
          mapLib={mapboxgl}
          viewState={viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/siddhant9511/cm17on9ux021801pj6y786ci0"
          mapboxAccessToken={mapboxAccessToken}
          onMove={(evt) => setViewport(evt.viewState)}
          interactive={true}
          ref={mapRef}
        >
           
          {routes.map((route) => (
            <React.Fragment key={route.id}>
              {route.start && (
                <Marker longitude={route.start.lng} latitude={route.start.lat} color="blue" />
              )}
              {route.end && (
                <Marker longitude={route.end.lng} latitude={route.end.lat} color="red" />
              )}
            </React.Fragment>
          ))}

              {objectPosition && (
                <Marker
                  longitude={objectPosition.lng}
                  latitude={objectPosition.lat}
                  anchor="bottom"
                >
                  <GiDeliveryDrone className="text-black text-5xl" />
                </Marker>
              )}

              {curLocation && !isNaN(curLocation.longitude) && !isNaN(curLocation.latitude) && (
                <Marker latitude={curLocation.latitude} longitude={curLocation.longitude} color="red" />
              )}

        </Map>
      </div>
    </>
  );
};

export default Map1;