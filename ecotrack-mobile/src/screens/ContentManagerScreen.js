import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus, Edit2, Trash2, X } from 'lucide-react-native';

export default function ContentManagerScreen({ navigation }) {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', category: '' });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        try {
            const response = await api.get('/modules');
            setModules(response.data);
        } catch (error) {
            console.error('Fetch modules error', error);
            Alert.alert('Error', 'Failed to fetch modules');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (module = null) => {
        if (module) {
            setEditingModule(module);
            setFormData({ title: module.title, content: module.content, category: module.category });
        } else {
            setEditingModule(null);
            setFormData({ title: '', content: '', category: '' });
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingModule(null);
        setFormData({ title: '', content: '', category: '' });
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content || !formData.category) {
            Alert.alert('Validation Error', 'All fields are required');
            return;
        }

        try {
            if (editingModule) {
                // Update
                await api.put(`/modules/${editingModule.moduleID}`, formData);
                Alert.alert('Success', 'Module updated successfully');
            } else {
                // Create
                await api.post('/modules', formData);
                Alert.alert('Success', 'Module created successfully');
            }
            handleCloseModal();
            fetchModules();
        } catch (error) {
            console.error('Save module error', error);
            Alert.alert('Error', 'Failed to save module');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this module? This will also delete all associated quizzes and results.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/modules/${id}`);
                            Alert.alert('Deleted', 'Module removed');
                            fetchModules();
                        } catch (error) {
                            console.error('Delete module error', error);
                            Alert.alert('Error', 'Failed to delete module');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <Card style={styles.moduleCard}>
            <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>{item.title}</Text>
                <Text style={styles.moduleCategory}>{item.category}</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.iconButton}>
                    <Edit2 color="#3B82F6" size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.moduleID)} style={styles.iconButton}>
                    <Trash2 color="#EF4444" size={20} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Content Manager</Text>
                <Button onPress={() => handleOpenModal()} style={styles.addButton}>
                    <Plus color="#FFF" size={20} />
                </Button>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={modules}
                    keyExtractor={(item) => item.moduleID.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.emptyText}>No modules found.</Text>}
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingModule ? 'Edit Module' : 'Add Module'}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModal}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={formData.title}
                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Category"
                            value={formData.category}
                            onChangeText={(text) => setFormData({ ...formData, category: text })}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Content"
                            value={formData.content}
                            onChangeText={(text) => setFormData({ ...formData, content: text })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <Button onPress={handleSave} style={styles.saveButton}>
                            Save Module
                        </Button>

                        {editingModule && (
                            <Button 
                                onPress={() => {
                                    handleCloseModal();
                                    navigation.navigate('QuizEditor', { 
                                        moduleID: editingModule.moduleID,
                                        moduleTitle: editingModule.title
                                    });
                                }} 
                                style={[styles.saveButton, { backgroundColor: '#1B263B', marginTop: 12 }]}
                            >
                                Edit Quiz Questions
                            </Button>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    addButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    moduleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    moduleInfo: {
        flex: 1,
        paddingRight: 10,
    },
    moduleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    moduleCategory: {
        fontSize: 14,
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconButton: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 20,
        fontSize: 16,
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
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: {
        minHeight: 120,
    },
    saveButton: {
        marginTop: 8,
    },
});
