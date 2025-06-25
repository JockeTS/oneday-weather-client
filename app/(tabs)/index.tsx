import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, ActivityIndicator, View, Text, Image, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

export default function WeatherScreen() {
    // States
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState([]);

    const scrollViewRef = useRef<ScrollView>(null);

    const today = new Date();
    const currentHour: number = today.getHours();

    // Fetch weather data after component has rendered
    useEffect(() => {
        async function getCurrentLocation() {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        }

        // Get user location after component has mounted
        getCurrentLocation();
    }, []);

    // Fetch weather data and set forecast state after location state update
    useEffect(() => {
        // console.log(location);

        const fetchWeather = async () => {
            try {
                // Get coordinates from location state
                const lat = location?.coords.latitude;
                const lon = location?.coords.longitude;

                if (!lat || !lon) {
                    return;
                }

                // const response = await fetch("http://localhost:3000/");
                // IP address for wired connection (?)
                // const response = await fetch(`http://192.168.10.109:3000/weather/?lat=${lat}&lon=${lon}`);
                const response = await fetch(`https://oneday-weather.onrender.com/weather?lat=${lat}&lon=${lon}`);

                if (!response.ok) {
                    console.warn(`Weather API error ${response.status}`);
                    setForecast([]);
                    return;
                }

                const data = await response.json();

                // Create weather groups from hoursArray and update forecast state

                // const hoursArray = await response.json();
                const hoursArray = data?.forecast?.forecastday[0]?.hour;
                const locationName = data?.location?.name;
                console.log(locationName);

                const weatherGroups = createWeatherGroups(hoursArray);
                setForecast(weatherGroups);
            } catch (error) {
                console.error('Error fetching weather (in-app):', error);
            } finally {
                setLoading(false);

                // Scroll to approximate location
                const scrollTo = currentHour * 50 / 2;
                scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
            }
        };

        if (location?.coords) {
            fetchWeather();
        }
    }, [location]);

    if (errorMsg) {
        return (
            <Text>{errorMsg}</Text>
        );
    } else if (location) {
        return (
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.innerScrollView}>
                {loading ? (
                    <ActivityIndicator size="large" color="#4A90E2" />
                ) : (
                    // After fetching data - use weather groups state to create a view for each item
                    forecast.map((weatherGroup: {startHour: string, endHour: string, weather: string, minTemp: string, maxTemp: string, icon: string},index: number) => (
                        createWeatherGroupView(weatherGroup, index)
                    ))
                )}
            </ScrollView>
    );
    }
}

const createWeatherGroupView = (weatherGroup: {startHour: string, endHour: string, weather: string, minTemp: string, maxTemp: string, icon: string}, index: number) => {
    const today = new Date();
    const currentHour = today.getHours();

    // Display a single temperature for each weather group or a range if temperature varies within
    let displayTemp = weatherGroup.minTemp + " °C";

    if (weatherGroup.maxTemp !== weatherGroup.minTemp) {
        displayTemp = weatherGroup.minTemp + " - " + weatherGroup.maxTemp + " °C";
    }

    // Return a highlighted weatherGroupView if currentHour matches
    if (currentHour >= parseInt(weatherGroup.startHour) && currentHour < parseInt(weatherGroup.endHour) ) {
        return (
            <View key={index} style={[styles.weatherGroup, styles.activeBackground, { flex: (parseInt(weatherGroup.endHour) - parseInt(weatherGroup.startHour)) / 24 }]}>
                <Text style={[styles.text, styles.activeText]}>
                    {weatherGroup.startHour}
                </Text>

                <View style={styles.iconContainer}>
                    <Image style={styles.icon} source={{uri: "https:" + weatherGroup.icon}} alt={weatherGroup.weather}/>
                </View>

                <Text style={[styles.text, styles.activeText]}>
                    {displayTemp}
                </Text>
            </View>
    );
    }

    // Return a regular weatherGroupView
    return (
        <View key={index} style={[styles.weatherGroup, { flex: (parseInt(weatherGroup.endHour) - parseInt(weatherGroup.startHour)) / 24 }]}>
            <Text style={styles.text}>
                {weatherGroup.startHour}
            </Text>
            
            <View style={styles.iconContainer}>
                <Image style={styles.icon} source={{uri: "https:" + weatherGroup.icon}} alt={weatherGroup.weather}/>
            </View>

            <Text style={styles.text}>
                {displayTemp}
            </Text>
        </View>
    );
};

function createWeatherGroups(hoursArray: any) {
    const weatherGroups: any = [];

    // Current group object with following keys: startHour, endHour, minTemp, maxTemp, weather
    let currentGroup = { 
        startHour: hoursArray[0].time.substr(-5, 5),
        endHour: String(parseInt(hoursArray[0].time.substr(-5, 5)) + 1).padStart(2, '0') + ':00', // hoursArray[0].time.substr(-5, 5),
        minTemp: hoursArray[0].temp_c,
        maxTemp: hoursArray[0].temp_c,
        weather: hoursArray[0].condition.text.trim(),
        icon: hoursArray[0].condition.icon
    };

    // Loop through weatherData array
    for (let i = 1; i < hoursArray.length; i++) {
        const current = hoursArray[i];

        // Check if the temperature difference of current data item exceeds 5 in either direction
        const tempDifference = Math.abs(current.temp_c - currentGroup.minTemp) > 5 || Math.abs(current.temp_c - currentGroup.maxTemp) > 5;

        // If current data items fits into current group (same weather type and less than 5 temperature difference)
        if (current.condition.text.trim() === currentGroup.weather && !tempDifference) {
            // Update the current group to include the current data item
            currentGroup.minTemp = Math.min(currentGroup.minTemp, current.temp_c);
            currentGroup.maxTemp = Math.max(currentGroup.maxTemp, current.temp_c);
        } else {
            // If current item doesn't fit - push the contents of the previous current group onto the mergedData array
            weatherGroups.push({ ...currentGroup });

            // Create a new current group from the current data item
            currentGroup = {
                startHour: current.time.substr(-5, 5),
                endHour: current.time.substr(-5, 5),
                minTemp: current.temp_c,
                maxTemp: current.temp_c,
                weather: current.condition.text.trim(),
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
    innerScrollView: {
        backgroundColor: '#4A90E2',
        height: 24 * 50,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    weatherGroup: {
        backgroundColor: '#F4F6F9',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        borderRadius: 8,
    },
    text: {
        flex: 1,
        fontSize: 18,
        color: '#333',
        textAlign: 'center'
    },
    iconContainer: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    icon: {
        width: 50,
        height: 50,
    },
    activeBackground: {
        backgroundColor: 'rgba(52, 211, 153, 1)'
    },
    activeText: {
        color: '#FFF'
    }
});