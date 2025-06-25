import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{
            // Header
            headerShown: false,

            // Tab Bar
            tabBarStyle: {
                backgroundColor: '#25292e'
            },
            tabBarActiveTintColor: '#F5D547'
    }} >
    
        <Tabs.Screen name="index" options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24}/>
            )
        }} />

        <Tabs.Screen name="about" options={{
            title: 'About',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
            ),
        }} />
    </Tabs>
  );
}