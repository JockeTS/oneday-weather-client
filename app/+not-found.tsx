import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from "react-native";

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops! I did it again'}}/>

            <View style={styles.container}>
                <Link href="/" style={styles.button}>Go back to Homo screen!</Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        color: '#fff'
    },
    button: {
        fontSize: 20,
        textDecorationLine: 'underline',
        color: '#fff'
    }
});