import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function AttemptHistoryScreen({ route, navigation }) {
    const { userID, category } = route.params;
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/analytics/user/${userID}/category/${category}/attempts`);
                setAttempts(response.data);
            } catch (error) {
                console.error('Error fetching attempts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [userID, category]);

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={attempts}
                keyExtractor={(item) => item.resultID.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate('AttemptDetail', { resultId: item.resultID })}
                    >
                        <Text style={styles.moduleText}>Module: {item.moduleTitle}</Text>
                        <Text style={styles.scoreText}>Score: {item.score}%</Text>
                        <Text style={styles.dateText}>Date: {new Date(item.dateTaken).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No attempts found for this category.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    item: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    moduleText: { fontSize: 16, fontWeight: 'bold', color: '#1B263B' },
    scoreText: { fontSize: 14, color: '#374151', marginVertical: 4 },
    dateText: { fontSize: 12, color: '#6B7280' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280' }
});