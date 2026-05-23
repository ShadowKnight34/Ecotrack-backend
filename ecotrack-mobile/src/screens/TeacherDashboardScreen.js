import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { LogOut, BookOpen, Users, TrendingUp, BarChart2, ChevronRight, Settings, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { LineChart, StackedBarChart, BarChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

export default function TeacherDashboardScreen({ navigation }) {
    const { user, setIsAuthenticated, setUser } = useContext(AuthContext);
    const [stats, setStats] = useState({ totalStudents: 0, overallAvgScore: 0, categoryBreakdown: [] });
    const [availableClasses, setAvailableClasses] = useState(['All Classes']);
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [schoolNameInput, setSchoolNameInput] = useState(user?.schoolName || '');
    const [classNameInput, setClassNameInput] = useState(user?.className || '');

    useEffect(() => {
        if (isFocused) {
            fetchDashboardStats();
        }
    }, [selectedClass, isFocused, user]);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/teacher/dashboard-stats?className=${selectedClass}`);
            setStats(response.data);
            if (response.data.availableClasses) {
                setAvailableClasses(response.data.availableClasses);
            }
        } catch (error) {
            console.error('Failed to load stats', error);
            // Alert.alert('Error', 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        setIsAuthenticated(false);
        setUser(null);
    };

    const handleSaveTeacherProfile = async () => {
        const classesArray = classNameInput.split(',').map(item => item.trim()).filter(item => item !== '');
        if (classesArray.length === 0) {
            Alert.alert('Validation Error', 'Class Name cannot be empty');
            return;
        }

        try {
            const updatePayload = {
                schoolName: schoolNameInput.trim(),
                classes: classesArray
            };
            await api.put('/auth/profile', updatePayload);
            setUser(prev => ({
                ...prev,
                schoolName: schoolNameInput.trim(),
                className: classesArray.join(', '),
                classes: classesArray
            }));
            setIsEditModalVisible(false);
            Alert.alert('Success', 'Profile Updated');
        } catch (error) {
            console.error('Failed to update teacher profile', error);
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const getBarChartData = () => {
        if (!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) {
            return {
                labels: ["No Data", ""],
                datasets: [{ 
                    data: [0, 100],
                    colors: [
                        (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        () => `rgba(0, 0, 0, 0)`
                    ]
                }]
            };
        }

        const labels = stats.categoryBreakdown.map(c => c.category.length > 14 ? c.category.substring(0, 12) + '..' : c.category);
        const data = stats.categoryBreakdown.map(c => c.avgScore || 0);

        // Add dummy point to enforce a true 100% max Y-axis
        labels.push("");
        data.push(100);

        const colors = stats.categoryBreakdown.map(() => (opacity = 1) => `rgba(16, 185, 129, ${opacity})`);
        colors.push(() => `rgba(0, 0, 0, 0)`); // Transparent color for dummy point

        return {
            labels: labels,
            datasets: [{ data: data, colors: colors }]
        };
    };

    const barChartData = getBarChartData();
    const barChartWidth = Math.max(screenWidth - 64, barChartData.labels.length * 85);

    return (
        <>
        <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: 120 }]}>
            <View style={styles.headerRow}>
                <Text style={styles.welcomeText} numberOfLines={2}>Welcome, {user?.username} (Teacher)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                        onPress={() => {
                            setSchoolNameInput(user?.schoolName || '');
                            setClassNameInput(user?.className || '');
                            setIsEditModalVisible(true);
                        }} 
                        style={[styles.logoutButton, { marginRight: 8 }]}
                    >
                        <Settings color="#4B5563" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <LogOut color="#EF4444" size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Filter by Class</Text>
            <View style={{ marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                    {availableClasses.map((cls, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.filterChip, selectedClass === cls && styles.filterChipActive]}
                            onPress={() => setSelectedClass(cls)}
                        >
                            <Text style={[styles.filterChipText, selectedClass === cls && styles.filterChipTextActive]}>
                                {cls}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.statsContainer}>
                <Card style={styles.statCard}>
                    <Users color="#1B263B" size={32} style={styles.icon} />
                    <Text style={styles.statValue}>{stats.totalStudents}</Text>
                    <Text style={styles.statLabel}>Total Students</Text>
                </Card>
                
                <Card style={styles.statCard}>
                    <TrendingUp color="#1B263B" size={32} style={styles.icon} />
                    <Text style={styles.statValue}>{stats.overallAvgScore}%</Text>
                    <Text style={styles.statLabel}>Avg Quiz Score</Text>
                </Card>
            </View>

            {user?.role === 'teacher' && (
                <>
                    <Text style={styles.sectionTitle}>Report Analytics</Text>
                    <Card style={styles.reportPanel}>
                        <TouchableOpacity 
                            style={styles.reportHeader} 
                            onPress={() => navigation.navigate('StudentList')}
                        >
                            <View style={styles.reportHeaderLeft}>
                                <BarChart2 color="#092c1d" size={24} />
                                <Text style={styles.reportTitle}>View Student List</Text>
                            </View>
                            <ChevronRight color="#092c1d" size={24} />
                        </TouchableOpacity>

                        <Text style={styles.chartTitle}>STUDENT SCORE OVER TIME</Text>
                        <LineChart
                            data={{
                                labels: ["May", "Jun", "Jul", "Aug", "Sep"],
                                datasets: [{ data: [65, 70, 78, 85, 92] }]
                            }}
                            width={screenWidth - 64} // Padding compensation
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // #10b981
                                labelColor: (opacity = 1) => `rgba(9, 44, 29, ${opacity})`, // #092c1d
                                style: { borderRadius: 16 }
                            }}
                            bezier
                            style={styles.chart}
                        />

                        <Text style={styles.chartTitle}>PERFORMANCE BY CATEGORY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={barChartData}
                                width={barChartWidth}
                                height={220}
                                yAxisSuffix="%"
                                fromZero={true}
                                segments={4}
                                withCustomBarColorFromData={true}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(9, 44, 29, ${opacity})`,
                                    formatYLabel: (yValue) => Math.round(yValue),
                                }}
                                style={styles.chart}
                                showValuesOnTopOfBars
                            />
                        </ScrollView>
                    </Card>
                </>
            )}

            <Text style={styles.sectionTitle}>Tools</Text>
            {['teacher', 'admin'].includes(user?.role) && (
                <TouchableOpacity 
                    style={styles.actionCard} 
                    onPress={() => navigation.navigate('ContentManager')}
                >
                    <BookOpen color="#1B263B" size={28} />
                    <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>Module Management</Text>
                        <Text style={styles.actionSubtitle}>Create, read, update, and delete modules and questions.</Text>
                    </View>
                </TouchableOpacity>
            )}

        </ScrollView>
        <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                            <X color="#6B7280" size={24} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>School Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter school name..."
                        value={schoolNameInput}
                        onChangeText={setSchoolNameInput}
                    />

                    <Text style={styles.inputLabel}>Class Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., CS101"
                        value={classNameInput}
                        onChangeText={setClassNameInput}
                        autoCapitalize="characters"
                    />
                    <Text style={styles.helperText}>Enter classes separated by commas (e.g., 4 Beta, 5 Gamma, 3 Amanah)</Text>

                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveTeacherProfile}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    contentContainer: {
        padding: 16,
        flexGrow: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    logoutButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
        paddingVertical: 20,
    },
    icon: {
        marginBottom: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    filterContainer: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#1B263B',
    },
    filterChipText: {
        color: '#4B5563',
        fontWeight: 'bold',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    reportPanel: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 24,
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 16,
    },
    reportHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#092c1d',
        marginLeft: 8,
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 12,
        marginTop: 8,
        letterSpacing: 1,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        alignSelf: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: -16,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    saveButton: {
        backgroundColor: '#27AE60',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
