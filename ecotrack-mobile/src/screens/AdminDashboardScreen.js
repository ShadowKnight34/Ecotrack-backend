import React, { useState, useCallback, useContext, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Users, FileText, HelpCircle, Shield, LogOut } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/ui/Card';
import api from '../services/api';

export default function AdminDashboardScreen({ navigation }) {
    const { user, setUser, setIsAuthenticated } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const fetchStats = async () => {
        console.log('[AdminDashboard] Starting fetchStats...');
        setLoading(true);
        try {
            console.log('[AdminDashboard] Requesting /admin/dashboard-stats');
            const response = await api.get('/admin/dashboard-stats');
            console.log('[AdminDashboard] Request successful');
            setStats(response.data);
        } catch (error) {
            console.error('[AdminDashboard] Error fetching admin stats:', error);
            Alert.alert('Error', 'Failed to load dashboard. Please try again.');
        } finally {
            console.log('[AdminDashboard] fetchStats finally block: setting loading to false');
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to log out.');
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                    <LogOut color="#EF4444" size={24} />
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    if (!stats) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: '#EF4444', fontSize: 16 }}>Failed to load dashboard data.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome to Admin Control</Text>
                <Text style={styles.subtitleText}>Manage the EcoTrack ecosystem</Text>
            </View>

            <Text style={styles.sectionTitle}>System Overview</Text>
            
            <View style={styles.statsGrid}>
                <TouchableOpacity 
                    style={{ width: '48%' }} 
                    onPress={() => navigation.navigate('UserManagement')}
                    activeOpacity={0.8}
                >
                    <Card style={[styles.statCard, { width: '100%' }]}>
                        <Users color="#D4AF37" size={32} />
                        <Text style={styles.statValue}>{stats.totalUsers}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </Card>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={{ width: '48%' }} 
                    onPress={() => navigation.navigate('ContentManager')}
                    activeOpacity={0.8}
                >
                    <Card style={[styles.statCard, { width: '100%' }]}>
                        <FileText color="#D4AF37" size={32} />
                        <Text style={styles.statValue}>{stats.totalModules}</Text>
                        <Text style={styles.statLabel}>Modules</Text>
                    </Card>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    header: {
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitleText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 30,
    },
    statCard: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
        backgroundColor: '#1B1B1B',
        borderColor: '#333333',
        borderWidth: 1,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1B1B1B',
        borderColor: '#333333',
        borderWidth: 1,
    },
    toolIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolInfo: {
        flex: 1,
        marginLeft: 16,
    },
    toolTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    toolDesc: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});
