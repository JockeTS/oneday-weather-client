import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, ActivityIndicator, Button, View, Text, Image, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const today = new Date();
const currentHour: number = today.getHours();

export default function WeatherScreen() {
    // States
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState([]);
    const [locationName, setLocationName] = useState();

    const scrollViewRef = useRef<ScrollView>(null);

    // Create array of hour strings from 00:00 - 23:00
    const hours = [];

    for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, "0") + ":00";
        hours.push(hour);
    }

    // Effect: component mount -> get user location
    useEffect(() => {
        getCurrentLocation();
    }, []);

    // Effect: location state change -> fetch weather data and set forecast state
    useEffect(() => {
        if (location?.coords) {
            fetchWeather();
        }
    }, [location]);

    // Get user's location and set state (location)
    async function getCurrentLocation() {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
    }

    // Get weather forecast from server and set states (forecast, locationName)
    async function fetchWeather() {
        try {
                // Get coordinates from location state
                const lat = location?.coords.latitude;
                const lon = location?.coords.longitude;

                if (!lat || !lon) {
                    return;
                }

                // Fetch from server
                const response = await fetch(`https://oneday-weather.onrender.com/weather?lat=${lat}&lon=${lon}`);

                if (!response.ok) {
                    console.warn(`Weather API error ${response.status}`);
                    setForecast([]);
                    return;
                }

                const data = await response.json();

                // Create weather groups from hoursArray and update forecast state
                const hoursArray = data?.forecast?.forecastday[0]?.hour; console.log(hoursArray);
                const weatherGroups = createWeatherGroups(hoursArray);
                setForecast(weatherGroups);

                // Update locationName state
                const locationName = data?.location?.name;
                setLocationName(locationName);
            } catch (error) {
                console.error('Error fetching weather (in-app):', error);
            } finally {
                setLoading(false);

                // Scroll to approximate location
                const scrollTo = currentHour * 50 / 2;
                scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
            }
    }

    // Return component
    if (errorMsg) {
        return (
            <Text>{errorMsg}</Text>
        );
    } else if (location) {
        return (
            <View style={styles.container}>
                <Text style={styles.locationText}>{locationName}</Text>

                <Button 
                    onPress={getCurrentLocation} 
                    title="Refresh"
                    color="#25292e"
                    accessibilityLabel="Refresh the weather forecast."
                />

                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.innerScrollView}>
                    <View style={styles.weatherContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#F5D547" />
                            </View>
                        ) : (
                            // After fetching data - use weather groups state to create a view for each item
                            forecast.map((weatherGroup: {startHour: string, endHour: string, weather: string, minTemp: string, maxTemp: string, icon: string}, index: number) => (
                                createWeatherCard(weatherGroup, index)
                            ))
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    }
}

function createWeatherCard(weatherGroup: {startHour: string, endHour: string, weather: string, minTemp: string, maxTemp: string, icon: string}, index: number) {
    // Display a single temperature for each weather group or a range if temperature varies within
    let displayTemp = weatherGroup.minTemp + " °C";

    if (weatherGroup.maxTemp !== weatherGroup.minTemp) {
        displayTemp = weatherGroup.minTemp + " - " + weatherGroup.maxTemp + " °C";
    }

    const flexSize = (parseInt(weatherGroup.endHour) - parseInt(weatherGroup.startHour));

    // Set alternate background colors
    let backgroundColor = "#F4F6F9";
    let textColor = "#333";

    if (currentHour >= parseInt(weatherGroup.startHour) && currentHour < parseInt(weatherGroup.endHour) ) {
        backgroundColor = "#34d399";
        textColor = "#FFF";
    } 

    return (
        <View key={index} style={[styles.weatherCard, { height: 60 * flexSize, backgroundColor: backgroundColor }]}>
            <Text style={[styles.weatherText, { color: textColor }]}>
                {weatherGroup.startHour}
            </Text>
            
            {/** Weather icon */}
            <View style={styles.iconContainer}>
                <Image style={styles.icon} source={{uri: "https:" + weatherGroup.icon}} alt={weatherGroup.weather}/>
            </View>

            {/** Temperature text */}
            <Text style={[styles.weatherText, { color: textColor }]}>
                {displayTemp}
            </Text>
        </View>
    );
}

function createWeatherGroups(hoursArray: any) {
    const weatherGroups: any = [];

    // Current group object with following keys: startHour, endHour, minTemp, maxTemp, weather
    let currentGroup = { 
        startHour: hoursArray[0].time.substr(-5, 5),
        endHour: String(parseInt(hoursArray[0].time.substr(-5, 5)) + 1).padStart(2, '0') + ':00', // hoursArray[0].time.substr(-5, 5),
        minTemp: parseInt(hoursArray[0].temp_c),
        maxTemp: parseInt(hoursArray[0].temp_c),
        weather: hoursArray[0].condition.text.trim().toLowerCase(),
        icon: hoursArray[0].condition.icon
    };

    // Loop through weatherData array
    for (let i = 1; i < hoursArray.length; i++) {
        const current = hoursArray[i];

        // Check if the temperature difference of current data item exceeds 5 in either direction
        const tempDifference = Math.abs(current.temp_c - currentGroup.minTemp) > 5 || Math.abs(current.temp_c - currentGroup.maxTemp) > 5;

        // If current data items fits into current group (same weather type and less than 5 temperature difference)
        if (current.condition.text.trim().toLowerCase() === currentGroup.weather && !tempDifference) {
            // Update the current group to include the current data item
            currentGroup.minTemp = Math.min(currentGroup.minTemp, parseInt(current.temp_c));
            currentGroup.maxTemp = Math.max(currentGroup.maxTemp, parseInt(current.temp_c));
            // currentGroup.minTemp = Math.trunc(Math.min(currentGroup.minTemp, current.temp_c));
            // currentGroup.maxTemp = Math.trunc(Math.max(currentGroup.maxTemp, current.temp_c));
        } else {
            // If current item doesn't fit - push the contents of the previous current group onto the mergedData array
            weatherGroups.push({ ...currentGroup });

            // Create a new current group from the current data item
            currentGroup = {
                startHour: current.time.substr(-5, 5),
                endHour: current.time.substr(-5, 5),
                minTemp: parseInt(current.temp_c),
                maxTemp: parseInt(current.temp_c),
                weather: current.condition.text.trim().toLowerCase(),
                icon: current.condition.icon
            };
        }

        currentGroup.endHour = String(parseInt(current.time.substr(-5, 5)) + 1).padStart(2, '0') + ':00';
    }

    // push the contents of the final current group onto the mergedData array
    weatherGroups.push({ ...currentGroup });

    return weatherGroups;
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    locationText: {
        backgroundColor: '#F4F6F9',
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        padding: 8,
    },
    refreshButton: {
        backgroundColor: '#25292e',
        color: '#F5D547'
    },
    innerScrollView: {
        backgroundColor: '#4A90E2',
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center'
    },
    weatherContainer: {
        flex: 2
    },
    weatherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        borderRadius: 8
    },
    weatherText: {
        flex: 1,
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        height: 50,
        width: 50
    }
});