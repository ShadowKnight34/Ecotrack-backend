import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, Modal, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Edit2, Trash2, X, User as UserIcon, Upload, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';

export default function UserManagementScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('student');
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);

    const handleImportCSV = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'text/comma-separated-values' });

            if (result.canceled) {
                return;
            }

            const asset = result.assets && result.assets[0];
            if (!asset) {
                return;
            }

            setImporting(true);
            const fileUri = asset.uri;

            // Fetch local file content as text
            const response = await fetch(fileUri);
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    if (results.errors && results.errors.length > 0) {
                        Alert.alert('CSV Parsing Error', 'Failed to parse CSV file content.');
                        setImporting(false);
                        return;
                    }

                    // Map columns to student fields
                    const records = results.data.map((row) => {
                        return {
                            username: row.username || row.Username || row.name || row.Name || '',
                            email: row.email || row.Email || '',
                            password: row.password || row.Password || '',
                            schoolName: row.schoolName || row.SchoolName || row.school || row.School || '',
                            className: row.className || row.ClassName || row.class || row.Class || '',
                            formLevel: row.formLevel || row.FormLevel || row.level || row.Level || '',
                        };
                    });

                    if (records.length === 0) {
                        Alert.alert('Empty File', 'No records found in the selected CSV file.');
                        setImporting(false);
                        return;
                    }

                    try {
                        const importRes = await api.post('/admin/users/import', { users: records });
                        setImportResult(importRes.data);
                        setImportModalVisible(true);
                        fetchUsers(); // Refresh list
                    } catch (apiErr) {
                        console.error('CSV import API error:', apiErr);
                        Alert.alert(
                            'Import Failed',
                            apiErr?.response?.data?.message || 'An error occurred during bulk import.'
                        );
                    } finally {
                        setImporting(false);
                    }
                },
                error: (parseErr) => {
                    console.error('CSV parse error:', parseErr);
                    Alert.alert('CSV Parse Error', 'Could not read CSV file contents.');
                    setImporting(false);
                }
            });

        } catch (err) {
            setImporting(false);
            console.error('Document picker error:', err);
            Alert.alert('File Selection Error', 'Failed to select CSV file.');
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.headerTitle}>User Management</Text>
                    <Text style={styles.headerSubtitle}>Manage user roles and bulk import student records</Text>
                </View>
            </View>
            <TouchableOpacity 
                style={styles.importButton} 
                onPress={handleImportCSV}
                activeOpacity={0.8}
            >
                <Upload color="#121212" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.importButtonText}>Import Users via CSV</Text>
            </TouchableOpacity>
        </View>
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Fetch users error:', error);
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user) => {
        setEditingUser(user);
        setSelectedRole(user.role || 'student');
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingUser(null);
    };

    const handleSaveRole = async () => {
        try {
            await api.put(`/admin/users/${editingUser.userID}/role`, { role: selectedRole });
            Alert.alert('Success', 'User role updated successfully');
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            console.error('Save role error:', error);
            Alert.alert('Error', 'Failed to update role');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this user? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/admin/users/${id}`);
                            Alert.alert('Deleted', 'User removed');
                            fetchUsers();
                        } catch (error) {
                            console.error('Delete user error:', error?.response?.data?.message || error.message);
                            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const renderRoleOption = (roleValue, label) => (
        <TouchableOpacity 
            style={[styles.roleOption, selectedRole === roleValue && styles.roleOptionSelected]}
            onPress={() => setSelectedRole(roleValue)}
        >
            <Text style={[styles.roleOptionText, selectedRole === roleValue && styles.roleOptionTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => (
        <Card style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <UserIcon color="#D4AF37" size={24} />
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.username}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userRole}>Role: {item.role}</Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconButton}>
                    <Edit2 color="#3B82F6" size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.userID)} style={[styles.iconButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.userID.toString()}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Role</Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        {editingUser && (
                            <Text style={styles.editingUserInfo}>
                                User: {editingUser.username} ({editingUser.email})
                            </Text>
                        )}

                        <Text style={styles.sectionLabel}>Select New Role:</Text>
                        
                        {renderRoleOption('student', 'Student')}
                        {renderRoleOption('teacher', 'Teacher')}
                        {renderRoleOption('admin', 'Admin')}

                        <Button 
                            onPress={handleSaveRole} 
                            style={styles.saveButton}
                        >
                            Save Role
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* CSV Import Results Modal */}
            <Modal visible={importModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Import Results</Text>
                            <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        {importResult && (
                            <View style={{ flex: 1 }}>
                                <View style={styles.summaryContainer}>
                                    <View style={styles.summaryBox}>
                                        <CheckCircle color="#10B981" size={28} />
                                        <Text style={styles.summaryCount}>
                                            {importResult.summary.totalCreated}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Created</Text>
                                    </View>
                                    <View style={styles.summaryBox}>
                                        <AlertCircle color="#EF4444" size={28} />
                                        <Text style={styles.summaryCount}>
                                            {importResult.summary.totalFailed}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Failed</Text>
                                    </View>
                                </View>

                                {importResult.errors && importResult.errors.length > 0 ? (
                                    <View style={{ flex: 1, marginTop: 16 }}>
                                        <Text style={styles.errorsTitle}>Validation Errors</Text>
                                        <FlatList
                                            data={importResult.errors}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <View style={styles.errorItem}>
                                                    <View style={styles.errorItemHeader}>
                                                        <Text style={styles.errorRowLabel}>Row {item.row}</Text>
                                                        <Text style={styles.errorEmail}>{item.email}</Text>
                                                    </View>
                                                    <Text style={styles.errorText}>{item.error}</Text>
                                                </View>
                                            )}
                                            contentContainerStyle={{ paddingBottom: 20 }}
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.successState}>
                                        <CheckCircle color="#10B981" size={48} />
                                        <Text style={styles.successStateText}>
                                            All student profiles imported successfully without errors!
                                        </Text>
                                    </View>
                                )}

                                <Button 
                                    onPress={() => setImportModalVisible(false)} 
                                    style={[styles.saveButton, { marginTop: 20 }]}
                                >
                                    Close Results
                                </Button>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* CSV Processing Overlay */}
            {importing && (
                <Modal transparent visible={importing} animationType="fade">
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text style={styles.loaderText}>Processing CSV & Importing Users...</Text>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#121212' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: { 
        padding: 16, 
        paddingBottom: 40 
    },
    userCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        marginBottom: 12,
        backgroundColor: '#1B1B1B',
        borderColor: '#333333',
        borderWidth: 1,
    },
    userInfo: { 
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#FFFFFF' 
    },
    userEmail: { 
        fontSize: 13, 
        color: '#9CA3AF', 
        marginTop: 2 
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#D4AF37',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    actionButtons: { 
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconButton: { 
        padding: 10, 
        marginLeft: 8, 
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: 8 
    },
    emptyText: { 
        textAlign: 'center', 
        color: '#9CA3AF', 
        marginTop: 40, 
        fontSize: 16 
    },
    modalOverlay: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)' 
    },
    modalContent: { 
        backgroundColor: '#1B1B1B', 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        padding: 24, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 24 
    },
    modalHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    modalTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#FFFFFF' 
    },
    editingUserInfo: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    roleOption: {
        padding: 16,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#121212',
    },
    roleOptionSelected: {
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    roleOptionText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    roleOptionTextSelected: {
        color: '#D4AF37',
        fontWeight: 'bold',
    },
    saveButton: { 
        marginTop: 16, 
        backgroundColor: '#D4AF37' 
    },
    headerContainer: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    importButton: {
        flexDirection: 'row',
        backgroundColor: '#D4AF37',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 16,
    },
    importButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loaderOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#121212',
        padding: 16,
        borderRadius: 16,
        marginVertical: 12,
        borderColor: '#333333',
        borderWidth: 1,
    },
    summaryBox: {
        alignItems: 'center',
        flex: 1,
    },
    summaryCount: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    summaryLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    errorsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 8,
    },
    errorItem: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    errorItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    errorRowLabel: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 13,
    },
    errorEmail: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    errorText: {
        color: '#F9FAFB',
        fontSize: 13,
    },
    successState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    successStateText: {
        color: '#9CA3AF',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '500',
    }
});
