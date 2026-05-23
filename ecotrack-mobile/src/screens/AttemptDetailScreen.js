import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../services/api';

export default function AttemptDetailScreen({ route }) {
    const { resultId } = route.params;
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/analytics/attempt/${resultId}`);
                setDetails(response.data);
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [resultId]);

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    // Legacy Handling: If no details are found, show a message
    if (details.length === 0) {
        return (
            <View style={styles.center}><Text>Detailed breakdown unavailable for legacy attempts.</Text></View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={details}
                keyExtractor={(item) => item.answerID.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.card, item.isCorrect ? styles.correct : styles.incorrect]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                            <Text style={[styles.question, { flex: 1, marginRight: 10 }]}>{item.questionText}</Text>
                            <Text style={{ fontWeight: 'bold', color: item.isCorrect ? '#059669' : '#DC2626' }}>
                                {item.isCorrect ? 'Correct' : 'Incorrect'}
                            </Text>
                        </View>
                        <Text>Your Answer: {item.selectedOption}</Text>
                        {!item.isCorrect && <Text style={styles.correctAnswer}>Correct Answer: {item.correctAnswer}</Text>}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { padding: 15, marginBottom: 10, borderRadius: 8, borderWidth: 1 },
    correct: { backgroundColor: '#D1FAE5', borderColor: '#10B981' }, // Green for correct
    incorrect: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }, // Red for incorrect
    question: { fontWeight: 'bold', marginBottom: 5 },
    correctAnswer: { color: '#B91C1C', marginTop: 5 }
});