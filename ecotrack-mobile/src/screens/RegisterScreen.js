import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView,
    Modal, FlatList, ActivityIndicator
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
    const [schools, setSchools] = useState([]);
    const [schoolsLoading, setSchoolsLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [schoolDropdownVisible, setSchoolDropdownVisible] = useState(false);
    const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
    const [formLevel, setFormLevel] = useState(1);
    const [loading, setLoading] = useState(false);

    const { setIsAuthenticated } = React.useContext(AuthContext);

    useEffect(() => {
        let isMounted = true;
        const fetchSchools = async () => {
            try {
                const res = await api.get('/schools');
                if (isMounted) {
                    setSchools(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch schools:', err);
            } finally {
                if (isMounted) {
                    setSchoolsLoading(false);
                }
            }
        };
        fetchSchools();
        return () => { isMounted = false; };
    }, []);

    const handleRegister = async () => {
        if (!username || !email || !password || !selectedSchool || !className) {
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
                schoolID: selectedSchool.schoolID,
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
                
                <TouchableOpacity
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => setSchoolDropdownVisible(true)}
                    activeOpacity={0.8}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ 
                            color: selectedSchool ? '#E5E7EB' : '#6B7280', 
                            fontSize: 16 
                        }}>
                            {selectedSchool ? selectedSchool.schoolName : 'Choose your school'}
                        </Text>
                        {schoolsLoading ? (
                            <ActivityIndicator size="small" color={isTeacher ? '#60A5FA' : '#34D399'} />
                        ) : (
                            <Text style={{ color: isTeacher ? '#60A5FA' : '#34D399', fontSize: 14 }}>▼</Text>
                        )}
                    </View>
                </TouchableOpacity>
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

            <Modal
                visible={schoolDropdownVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSchoolDropdownVisible(false)}
            >
                <View style={dropdownStyles.modalBackdrop}>
                    <TouchableOpacity
                        style={dropdownStyles.backdropPressable}
                        activeOpacity={1}
                        onPress={() => setSchoolDropdownVisible(false)}
                    />
                    <View style={[dropdownStyles.bottomSheet, { backgroundColor: isTeacher ? '#1B263B' : '#0B3D2E' }]}>
                        <View style={dropdownStyles.handle} />

                        <View style={[dropdownStyles.header, { borderColor: isTeacher ? '#3A5078' : '#1F6E50' }]}>
                            <Text style={[dropdownStyles.headerTitle, { color: isTeacher ? '#93C5FD' : '#A7F3D0' }]}>Select School</Text>
                            <TouchableOpacity onPress={() => setSchoolDropdownVisible(false)} style={dropdownStyles.closeButton}>
                                <Text style={[dropdownStyles.closeButtonText, { color: isTeacher ? '#60A5FA' : '#34D399' }]}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[dropdownStyles.searchContainer, { backgroundColor: isTeacher ? '#273859' : '#134E3A' }]}>
                            <Text style={dropdownStyles.searchIcon}>🔍</Text>
                            <TextInput
                                style={[dropdownStyles.searchInput, { color: '#E5E7EB' }]}
                                placeholder="Search school..."
                                placeholderTextColor="#6B7280"
                                value={schoolSearchQuery}
                                onChangeText={setSchoolSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {schoolSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSchoolSearchQuery('')} style={dropdownStyles.clearButton}>
                                    <Text style={dropdownStyles.clearButtonText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {schoolsLoading ? (
                            <View style={dropdownStyles.centered}>
                                <ActivityIndicator size="large" color={isTeacher ? '#3B82F6' : '#10B981'} />
                            </View>
                        ) : (
                            <FlatList
                                data={schools.filter(opt =>
                                    opt.schoolName.toLowerCase().includes(schoolSearchQuery.toLowerCase())
                                )}
                                keyExtractor={(item) => item.schoolID.toString()}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={dropdownStyles.listContent}
                                renderItem={({ item }) => {
                                    const isSelected = selectedSchool && selectedSchool.schoolID === item.schoolID;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                dropdownStyles.optionRow,
                                                isSelected && { backgroundColor: isTeacher ? '#273859' : '#134E3A' },
                                                { borderColor: isTeacher ? '#273859' : '#134E3A' }
                                            ]}
                                            onPress={() => {
                                                setSelectedSchool(item);
                                                setSchoolDropdownVisible(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    dropdownStyles.optionText,
                                                    { color: '#E5E7EB' },
                                                    isSelected && { color: isTeacher ? '#60A5FA' : '#34D399', fontWeight: '700' }
                                                ]}
                                            >
                                                {item.schoolName}
                                            </Text>
                                            {isSelected && (
                                                <Text style={[dropdownStyles.checkmark, { color: isTeacher ? '#60A5FA' : '#34D399' }]}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <View style={dropdownStyles.emptyContainer}>
                                        <Text style={dropdownStyles.emptyText}>No registered schools available</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
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

const dropdownStyles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    backdropPressable: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    closeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    closeButtonText: {
        fontWeight: '700',
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    },
    searchIcon: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    clearButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderRadius: 8,
        marginVertical: 2,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    checkmark: {
        fontWeight: '900',
        fontSize: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    centered: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
