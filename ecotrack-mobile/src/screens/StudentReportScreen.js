import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';
import Card from '../components/ui/Card';


export default function StudentReportScreen({ route, navigation }) {
    const { userID, studentName } = route.params || {};
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [userID]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/teacher/students/${userID}/report`);
            console.log('[Frontend Data Bridge] Raw JSON Response:', JSON.stringify(response.data, null, 2));
            const backendReport = response.data.report || [];

            // Map the categories returned by the backend directly
            const mappedData = backendReport.map(r => ({
                category: r.category,
                bestScore: parseInt(r.bestScore || 0),
                totalAttempts: parseInt(r.totalAttempts || 0)
            }));

            setReportData(mappedData);
        } catch (error) {
            console.error('Fetch student report error:', error);
            Alert.alert('Error', 'Failed to load student report.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreStyle = (score, attempts) => {
        if (attempts === 0) return styles.scoreGray;
        if (score > 70) return styles.scoreGreen;
        if (score >= 40) return styles.scoreYellow;
        return styles.scoreRed;
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.row}
            onPress={() => navigation.navigate('AttemptHistory', { userID, category: item.category })}
        >
            <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.attemptsText}>Attempts: {item.totalAttempts}</Text>
            </View>
            <View style={styles.scoreInfo}>
                <Text style={[styles.scoreValue, getScoreStyle(item.bestScore, item.totalAttempts)]}>
                    {item.totalAttempts > 0 ? `${item.bestScore}%` : '-'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{studentName}'s Report</Text>
                <Text style={styles.headerSubtitle}>Performance across all 17 SDG Categories</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#1B263B" style={{ marginTop: 40 }} />
            ) : (
                <Card style={styles.cardContainer}>
                    <FlatList
                        data={reportData}
                        keyExtractor={(item) => item.category}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </Card>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 20,
        backgroundColor: '#1B263B',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#D1D5DB',
        marginTop: 4,
    },
    cardContainer: {
        flex: 1,
        margin: 16,
        padding: 0,
        overflow: 'hidden',
    },
    listContainer: {
        paddingBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    categoryInfo: {
        flex: 1,
        paddingRight: 16,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    attemptsText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    scoreInfo: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        width: 60,
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scoreGreen: {
        color: '#10B981', // > 70%
    },
    scoreYellow: {
        color: '#F59E0B', // 40 - 70%
    },
    scoreRed: {
        color: '#EF4444', // < 40%
    },
    scoreGray: {
        color: '#9CA3AF', // 0 attempts
    }
});
