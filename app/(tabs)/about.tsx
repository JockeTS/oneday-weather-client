import { Text, View, StyleSheet } from 'react-native';

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hourly Weather v1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F4F6F9',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 18,
        color: '#333'
    }
});