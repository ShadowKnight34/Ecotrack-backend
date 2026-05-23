import React, { useState, useCallback, useContext, useEffect, useLayoutEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator,
    TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Award, Target, BookOpen, Edit2, X, ChevronRight, Settings, Download, Users, FileText, LogOut } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ALL_BADGES = [
    { id: 1, icon: '🌱', name: 'First Steps' },
    { id: 2, icon: '⭐', name: 'Rising Star' },
    { id: 3, icon: '🏆', name: 'Eco Champion' },
    { id: 4, icon: '💯', name: 'Perfect Score' },
    { id: 5, icon: '✅', name: 'Passing Grade' },
];

export default function ProfileScreen({ navigation }) {
    const { user, setUser, setIsAuthenticated } = useContext(AuthContext);
    const [loading, setLoading] = useState(!user);
    const [modalVisible, setModalVisible] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [editFormLevel, setEditFormLevel] = useState(user?.formLevel || 1);
    const [isSaving, setIsSaving] = useState(false);
    const [teacherStats, setTeacherStats] = useState({ monitoredClassesCount: 0, totalAttemptsCount: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [schoolNameInput, setSchoolNameInput] = useState(user?.schoolName || '');
    const [classNameInput, setClassNameInput] = useState(user?.className || '');

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                    if (response.data) {
                        setSearchQuery(response.data.schoolName || '');
                    }
                    if (response.data && response.data.role === 'teacher') {
                        const statsRes = await api.get('/teacher/dashboard-stats?className=All%20Classes');
                        const classes = statsRes.data.availableClasses || [];
                        const monitoredClassesCount = classes.filter(c => c !== 'All Classes').length;
                        const breakdown = statsRes.data.categoryBreakdown || [];
                        const totalAttemptsCount = breakdown.reduce((acc, curr) => acc + (curr.totalAttempts || 0), 0);
                        setTeacherStats({
                            monitoredClassesCount,
                            totalAttemptsCount
                        });
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [])
    );

    const handleAccountSettings = () => {
        setNewClassName(user.className || '');
        setEditFormLevel(user.formLevel || 1);
        setSearchQuery(user.schoolName || '');
        setModalVisible(true);
    };

    const handleExportGradebook = async () => {
        Alert.alert("Debug Check", "Export function started successfully!");
        try {
            const response = await api.get('/teacher/students');
            const students = response.data || [];
            
            let csvContent = 'Student ID,Username,School Name,Class Name,Level,XP,Score\n';
            students.forEach(item => {
                if (!item) return;
                const userID = item.userID || 'N/A';
                const username = item.username || 'N/A';
                const schoolName = item.schoolName || 'Unassigned';
                const className = item.className || 'No Class';
                const level = (item.level !== null && item.level !== undefined) ? item.level : 1;
                const xp = (item.xp !== null && item.xp !== undefined) ? item.xp : 0;
                const score = item.score !== undefined && item.score !== null ? item.score : '0';
                csvContent += `${userID},"${username}","${schoolName}","${className}",${level},${xp},${score}\n`;
            });
            
            const fileUri = `${FileSystem.documentDirectory}gradebook.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
            
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert("Environment Error", "Sharing services are not available or enabled on this emulator system.");
                return;
            }
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            console.log("FULL EXPORT ERROR:", error);
            Alert.alert("Server Error", error.message);
        }
    };

    const handleSystemDocOverview = () => {
        Alert.alert(
            'System Documentation Overview',
            'Welcome to the Teacher Administration System.\n\n' +
            '• Dashboard: View student list and performance charts.\n' +
            '• Module Management: Create, edit, and delete modules and quiz questions.\n' +
            '• Forum: Access class discussion feeds and filter by Form cohort.\n' +
            '• Profile: Manage account settings and export records.',
            [{ text: 'Close', style: 'cancel' }]
        );
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

    if (loading || !user) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const handleUpdateProfile = async () => {
        if (!newClassName.trim()) {
            Alert.alert('Validation Error', 'Class Name cannot be empty');
            return;
        }

        setIsSaving(true);
        try {
            const updatePayload = {
                className: newClassName.trim(),
                formLevel: user.role === 'student' ? editFormLevel : null,
                schoolName: user.role === 'student' ? searchQuery.trim() : user.schoolName
            };
            await api.put('/auth/profile', updatePayload);
            setUser(prev => ({
                ...prev,
                className: newClassName.trim(),
                formLevel: prev.role === 'student' ? editFormLevel : null,
                schoolName: searchQuery
            }));
            Alert.alert('Success', 'Profile Updated');
            setModalVisible(false);
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTeacherProfile = async () => {
        const classesArray = classNameInput.split(',').map(item => item.trim()).filter(item => item !== '');
        if (classesArray.length === 0) {
            Alert.alert('Validation Error', 'Class Name cannot be empty');
            return;
        }

        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };

    const nextLevelXP = user.level * 200;
    const xpProgress = user.xp / nextLevelXP;

    const badges = ALL_BADGES.map(b => ({
        ...b,
        earned: user.earnedBadges && user.earnedBadges.includes(b.id)
    }));
    const earnedCount = badges.filter(b => b.earned).length;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* ── Avatar & Identity ── */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarRing}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>{user.role === 'teacher' ? '👨‍🏫' : '🧑‍🎓'}</Text>
                    </View>
                </View>
                <Text style={styles.username}>{user.username}</Text>
                <View style={styles.classContainer}>
                    {user.role === 'teacher' ? (
                        <Text style={styles.classLabel}>Teacher</Text>
                    ) : user.className ? (
                        <Text style={styles.classLabel}>
                            {user.role === 'student' && user.formLevel ? `Form ${user.formLevel} - ` : ''}{user.className}
                        </Text>
                    ) : (
                        <Text style={styles.classLabelWarning}>Class: Not Assigned</Text>
                    )}
                </View>
                <Text style={styles.schoolSubtitleText}>{user.schoolName || 'No School Assigned'}</Text>
                <Text style={styles.email}>{user.email}</Text>
                
                {user.role !== 'teacher' && (
                    <TouchableOpacity 
                        style={styles.editProfileButton}
                        onPress={() => {
                            setNewClassName(user.className || '');
                            setEditFormLevel(user.formLevel || 1);
                            setSearchQuery(user.schoolName || '');
                            setModalVisible(true);
                        }}
                    >
                        <Edit2 color="#27AE60" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                )}

                {user.role === 'teacher' && (
                    <TouchableOpacity 
                        style={styles.editProfileButton}
                        onPress={() => {
                            setSchoolNameInput(user.schoolName || '');
                            setClassNameInput(user.className || '');
                            setIsEditModalVisible(true);
                        }}
                    >
                        <Edit2 color="#27AE60" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                )}
                
                {user.role !== 'teacher' && (
                    <TouchableOpacity 
                        style={[styles.editProfileButton, { marginTop: 8, borderColor: '#3B82F6' }]}
                        onPress={() => navigation.navigate('Modules', { screen: 'StudentReport', params: { userID: user.userID, studentName: user.username } })}
                    >
                        <BookOpen color="#3B82F6" size={16} style={{ marginRight: 6 }} />
                        <Text style={[styles.editProfileText, { color: '#3B82F6' }]}>View Full Report</Text>
                    </TouchableOpacity>
                )}
            </View>

            {user.role === 'teacher' ? (
                // ── Teacher-Specific View ──
                <>
                    <View style={styles.teacherStatsRow}>
                        <TouchableOpacity
                            style={styles.teacherStatCard}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Users color="#10B981" size={28} style={{ marginBottom: 6 }} />
                            <Text style={styles.teacherStatValue}>{teacherStats.monitoredClassesCount}</Text>
                            <Text style={styles.teacherStatLabel}>Monitored Classes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.teacherStatCard}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('StudentList')}
                        >
                            <FileText color="#3B82F6" size={28} style={{ marginBottom: 6 }} />
                            <Text style={styles.teacherStatValue}>{teacherStats.totalAttemptsCount}</Text>
                            <Text style={styles.teacherStatLabel}>Total Class Records</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Administrative Actions</Text>
                    <Card style={styles.actionListCard}>
                        <TouchableOpacity style={styles.actionRow} onPress={handleAccountSettings}>
                            <View style={styles.actionRowLeft}>
                                <Settings color="#4B5563" size={20} style={{ marginRight: 12 }} />
                                <Text style={styles.actionRowText}>Account Settings</Text>
                            </View>
                            <ChevronRight color="#9CA3AF" size={20} />
                        </TouchableOpacity>

                        <View style={styles.rowDivider} />

                        <TouchableOpacity style={styles.actionRow} onPress={handleExportGradebook}>
                            <View style={styles.actionRowLeft}>
                                <Download color="#2563EB" size={20} style={{ marginRight: 12 }} />
                                <Text style={styles.actionRowText}>Export Grade Book (CSV)</Text>
                            </View>
                            <ChevronRight color="#9CA3AF" size={20} />
                        </TouchableOpacity>

                        <View style={styles.rowDivider} />

                        <TouchableOpacity style={styles.actionRow} onPress={handleSystemDocOverview}>
                            <View style={styles.actionRowLeft}>
                                <BookOpen color="#059669" size={20} style={{ marginRight: 12 }} />
                                <Text style={styles.actionRowText}>System Documentation Overview</Text>
                            </View>
                            <ChevronRight color="#9CA3AF" size={20} />
                        </TouchableOpacity>
                    </Card>
                </>
            ) : (
                // ── Student-Specific View ──
                <>
                    <Card style={styles.levelCard}>
                        <View style={styles.levelHeader}>
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelBadgeText}>LVL</Text>
                                <Text style={styles.levelNumber}>{user.level}</Text>
                            </View>
                            <View style={styles.xpInfo}>
                                <Text style={styles.xpTitle}>Experience Points</Text>
                                <Text style={styles.xpNumbers}>
                                    {user.xp} <Text style={styles.xpDivider}>/ {nextLevelXP} XP</Text>
                                </Text>
                            </View>
                        </View>

                        <ProgressBar progress={xpProgress} color="#FBBF24" height={16} />
                        <Text style={styles.xpRemaining}>
                            {nextLevelXP - user.xp} XP to Level {user.level + 1}
                        </Text>
                    </Card>

                    <View style={styles.statsRow}>
                        <Card style={styles.statCard}>
                            <BookOpen color="#10B981" size={24} style={{ marginBottom: 8 }} />
                            <Text style={styles.statValue}>{user.quizCount || 0}</Text>
                            <Text style={styles.statLabel}>Quizzes</Text>
                        </Card>
                        <Card style={styles.statCard}>
                            <Target color="#EF4444" size={24} style={{ marginBottom: 8 }} />
                            <Text style={styles.statValue}>{user.avgScore || 0}%</Text>
                            <Text style={styles.statLabel}>Avg Score</Text>
                        </Card>
                        <Card style={styles.statCard}>
                            <Award color="#FBBF24" size={24} style={{ marginBottom: 8 }} />
                            <Text style={styles.statValue}>{earnedCount}</Text>
                            <Text style={styles.statLabel}>Badges</Text>
                        </Card>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Achievements</Text>
                        <Badge variant="secondary"> {earnedCount} / {badges.length} </Badge>
                    </View>

                    <View style={[styles.badgeGrid, { marginBottom: 100 }]}>
                        {badges.map((badge) => (
                            <Card
                                key={badge.id}
                                style={[styles.badgeItem, !badge.earned && styles.badgeLocked]}
                            >
                                <Text style={[styles.badgeIcon, !badge.earned && styles.badgeIconLocked]}>
                                    {badge.earned ? badge.icon : '🔒'}
                                </Text>
                                <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
                                    {badge.name}
                                </Text>
                            </Card>
                        ))}
                    </View>
                </>
            )}

            {/* ── Edit Profile Modal ── */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Class Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., CS101"
                            value={newClassName}
                            onChangeText={setNewClassName}
                            autoCapitalize="characters"
                        />

                        {user.role === 'student' && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.inputLabel}>School Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your school name..."
                                    value={searchQuery}
                                    onChangeText={(text) => setSearchQuery(text)}
                                />
                            </View>
                        )}

                        {user.role === 'student' && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={styles.inputLabel}>Secondary Form Cohort</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <TouchableOpacity
                                            key={level}
                                            style={[
                                                styles.formPill,
                                                editFormLevel === level && styles.formPillActive
                                            ]}
                                            onPress={() => setEditFormLevel(level)}
                                        >
                                            <Text style={[styles.formPillText, editFormLevel === level && styles.formPillTextActive]}>
                                                Form {level}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.saveButton}
                            onPress={handleUpdateProfile}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Edit Teacher Profile Modal ── */}
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
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
    },

    // ── Avatar ──
    avatarSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    avatarRing: {
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 4,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        backgroundColor: '#D1FAE5',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#34D399',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 46,
    },
    username: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    classLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27AE60',
        marginTop: 4,
    },
    classLabelWarning: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E74C3C',
        marginTop: 4,
    },
    schoolSubtitleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 4,
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#27AE60',
        borderRadius: 20,
    },
    editProfileText: {
        color: '#27AE60',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // ── Level Card ──
    levelCard: {
        marginBottom: 24,
        backgroundColor: '#10B981', // Emerald primary
        borderColor: '#059669',
        borderBottomColor: '#047857',
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelBadge: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#047857',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#059669',
    },
    levelBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#A7F3D0',
        letterSpacing: 1,
    },
    levelNumber: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: -2,
    },
    xpInfo: {
        flex: 1,
    },
    xpTitle: {
        fontSize: 13,
        color: '#D1FAE5',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    xpNumbers: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 2,
    },
    xpDivider: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A7F3D0',
    },
    xpRemaining: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D1FAE5',
        marginTop: 8,
        textAlign: 'right',
    },

    // ── Stats Row ──
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
        paddingVertical: 18,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // ── Achievements ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    badgeItem: {
        width: (width - 56) / 3,
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    badgeLocked: {
        opacity: 0.6,
        backgroundColor: '#F9FAFB',
        borderBottomColor: '#E5E7EB',
    },
    badgeIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    badgeIconLocked: {
        fontSize: 28,
        opacity: 0.5,
    },
    badgeName: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4B5563',
        textAlign: 'center',
    },
    badgeNameLocked: {
        color: '#9CA3AF',
    },

    // ── Modal ──
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
    },
    formPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    formPillActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    formPillText: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: '600',
    },
    formPillTextActive: {
        color: '#FFFFFF',
    },
    teacherStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    teacherStatCard: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 6,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    teacherStatValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#111827',
    },
    teacherStatLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    actionListCard: {
        padding: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 80,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    actionRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionRowText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
});
