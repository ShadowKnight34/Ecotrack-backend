import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/ui/Button';

export default function ResultsScreen({ route, navigation }) {
    const { score, total } = route.params;
    const percentage = (score / total) * 100;

    let message = "Keep Learning!";
    if (percentage >= 80) message = "SDG Champion!";
    else if (percentage >= 50) message = "Well Done!";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quiz Complete!</Text>

            <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{score}</Text>
                <Text style={styles.totalText}>out of {total}</Text>
            </View>

            <Text style={[
                styles.message,
                { color: percentage >= 80 ? '#10B981' : '#374151' }
            ]}>
                {message}
            </Text>

            <View style={styles.buttonContainer}>
                <Button
                    variant="default"
                    style={{ marginBottom: 16 }}
                    // This clears the quiz/results and takes you back to the SDG list
                    onPress={() => navigation.popToTop()}
                >
                    Continue Learning
                </Button>
                <Button
                    variant="outline"
                    onPress={() => navigation.navigate('Home')}
                >
                    Back to Home
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#10B981', marginBottom: 30 },
    scoreCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    scoreText: { fontSize: 48, fontWeight: 'bold', color: '#1F2937' },
    totalText: { fontSize: 18, color: '#6B7280' },
    message: { fontSize: 20, fontWeight: '600', color: '#374151', marginBottom: 40 },
    buttonContainer: { width: '80%' }
});