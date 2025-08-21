import { Stack } from "expo-router";

export default function RootLayout() {
    return <Stack 
        screenOptions={{
            headerShown: true,
            title: 'Hourly Weather',
            headerStyle: {
              backgroundColor: '#25292e',
            },
            headerTintColor: '#F5D547',
            headerTitleAlign: 'center',

            /*
            headerBackground: () => (
                <Image
                  style={StyleSheet.absoluteFill}
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg' }}
                />
            )
            */
        }}/>;
}
