import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { AuthContext } from '../context/AuthContext';
import TeacherStackNavigator from './TeacherStackNavigator';
import AdminStackNavigator from './AdminStackNavigator';

export default function AppNavigator() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Auto-login failed:', error);
                await AsyncStorage.removeItem('userToken');
            } finally {
                setIsLoading(false);
            }
        };

        checkToken();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ setIsAuthenticated, user, setUser }}>
            {!isAuthenticated 
                ? <AuthNavigator /> 
                : user?.role === 'admin'
                    ? <AdminStackNavigator />
                    : user?.role === 'teacher' 
                        ? <TabNavigator /> 
                        : <TabNavigator />
            }
        </AuthContext.Provider>
    );
}
