import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterScreen({ route, navigation }) {
    const role = route?.params?.role || 'student';
    const isTeacher = role === 'teacher';
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [className, setClassName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [formLevel, setFormLevel] = useState(1);
    const [loading, setLoading] = useState(false);

    const { setIsAuthenticated } = React.useContext(AuthContext);

    const handleRegister = async () => {
        if (!username || !email || !password || !schoolName || !className) {
            Alert.alert('Error', 'Please fill in all fields including School and Class.');
            return;
        }

        setLoading(true);
        try {
            // Apply .trim() here to remove accidental spaces from inputs
            const userData = {
                username: username.trim(),
                email: email.trim(),
                password: password, // Don't trim password, spaces can be valid!
                role: role,
                schoolName: schoolName.trim(),
                className: className.trim(),
                formLevel: !isTeacher ? formLevel : null
            };

            // 1. Call Register Route with the cleaned data
            await api.post('/auth/register', userData);

            // 2. Automatically Login to fetch token
            const loginRes = await api.post('/auth/login', { email: userData.email, password });
            const { token } = loginRes.data;

            if (token) {
                await AsyncStorage.setItem('userToken', token);
                setIsAuthenticated(true);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Something went wrong.';
            Alert.alert('Registration Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };
    const styles = getDynamicStyles(role);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={styles.logo}>🌱</Text>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join the EcoTrack community</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="School Name"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="words"
                    value={schoolName}
                    onChangeText={setSchoolName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Class Name (e.g., CS101)"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="characters"
                    value={className}
                    onChangeText={setClassName}
                />

                {!isTeacher && (
                    <View style={{ marginBottom: 14 }}>
                        <Text style={{ color: '#A7F3D0', marginBottom: 8, fontSize: 14, fontWeight: '600', marginLeft: 4 }}>Secondary Form Cohort</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.formPill,
                                        formLevel === level && styles.formPillActive
                                    ]}
                                    onPress={() => setFormLevel(level)}
                                >
                                    <Text style={[styles.formPillText, formLevel === level && styles.formPillTextActive]}>
                                        Form {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>
                        Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const getDynamicStyles = (role) => {
    const isTeacher = role === 'teacher';

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isTeacher ? '#1B263B' : '#0B3D2E',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        backButton: {
            position: 'absolute',
            top: 60,
            left: 20,
            padding: 10,
        },
        backButtonText: {
            color: isTeacher ? '#60A5FA' : '#34D399',
            fontSize: 16,
            fontWeight: '600',
        },
        header: {
            alignItems: 'center',
            marginBottom: 40,
            marginTop: 40,
        },
        logo: {
            fontSize: 56,
            marginBottom: 8,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: isTeacher ? '#93C5FD' : '#A7F3D0',
        },
        subtitle: {
            fontSize: 14,
            color: isTeacher ? '#60A5FA' : '#6EE7B7',
            marginTop: 4,
        },
        form: {
            width: '100%',
        },
        input: {
            backgroundColor: isTeacher ? '#273859' : '#134E3A',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: '#E5E7EB',
            fontSize: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: isTeacher ? '#3A5078' : '#1F6E50',
        },

        button: {
            backgroundColor: isTeacher ? '#3B82F6' : '#10B981',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 20,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '700',
        },
        linkText: {
            color: '#9CA3AF',
            textAlign: 'center',
            fontSize: 14,
        },
        linkBold: {
            color: isTeacher ? '#60A5FA' : '#34D399',
            fontWeight: '600',
        },
        formPill: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: isTeacher ? '#273859' : '#134E3A',
            borderWidth: 1,
            borderColor: isTeacher ? '#3A5078' : '#1F6E50',
            marginRight: 8,
        },
        formPillActive: {
            backgroundColor: isTeacher ? '#3B82F6' : '#10B981',
            borderColor: isTeacher ? '#60A5FA' : '#34D399',
        },
        formPillText: {
            color: '#9CA3AF',
            fontSize: 14,
            fontWeight: '600',
        },
        formPillTextActive: {
            color: '#FFFFFF',
        },
    });
};
