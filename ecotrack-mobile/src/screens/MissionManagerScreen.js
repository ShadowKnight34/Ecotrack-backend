import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, Alert, Modal, SafeAreaView
} from 'react-native';
import { Target, FileText, X, Check } from 'lucide-react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function MissionManagerScreen() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Editing modal states
    const [selectedModule, setSelectedModule] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [coreMission, setCoreMission] = useState('');
    const [keyTargets, setKeyTargets] = useState('');
    const [localRelevance, setLocalRelevance] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        try {
            // We use the existing GET /modules route which is accessible to all logged-in roles
            const response = await api.get('/modules');
            setModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            Alert.alert('Error', 'Failed to load modules list.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectModule = (mod) => {
        setSelectedModule(mod);
        setCoreMission(mod.coreMission || '');
        setKeyTargets(mod.keyTargets || '');
        setLocalRelevance(mod.localRelevance || '');
        setModalVisible(true);
    };

    const handleSaveMission = async () => {
        if (!coreMission.trim() || !keyTargets.trim() || !localRelevance.trim()) {
            Alert.alert('Missing Fields', 'All fields (Core Mission, Key Targets, and Local Relevance) are required.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                coreMission: coreMission.trim(),
                keyTargets: keyTargets.trim(),
                localRelevance: localRelevance.trim()
            };

            await api.put(`/admin/modules/${selectedModule.moduleID}/mission`, payload);
            
            Alert.alert('Success', 'Module missions assigned successfully.');
            setModalVisible(false);
            fetchModules();
        } catch (error) {
            console.error('Error updating mission:', error);
            Alert.alert('Error', 'Failed to assign module missions.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Assign Module Missions</Text>
                <Text style={styles.subtitle}>Select an SDG module to define its core missions.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {modules.map((mod) => (
                    <TouchableOpacity 
                        key={mod.moduleID} 
                        onPress={() => handleSelectModule(mod)}
                        activeOpacity={0.8}
                    >
                        <Card style={styles.moduleCard}>
                            <View style={styles.iconContainer}>
                                <Target color="#D4AF37" size={24} />
                            </View>
                            <View style={styles.moduleInfo}>
                                <Text style={styles.categoryText}>SDG {mod.moduleID} • {mod.category}</Text>
                                <Text style={styles.titleText}>{mod.title}</Text>
                                <Text style={styles.missionText} numberOfLines={2}>
                                    {mod.coreMission ? `Mission: ${mod.coreMission}` : 'No mission assigned yet.'}
                                </Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Edit Mission Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={1}>Assign Missions: SDG {selectedModule?.moduleID}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#9CA3AF" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Core Mission Summary</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the main goal of this SDG campaign..."
                                placeholderTextColor="#6B7280"
                                value={coreMission}
                                onChangeText={setCoreMission}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            <Text style={styles.label}>Key Targets (Bulleted list format)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. • Target 1\n• Target 2"
                                placeholderTextColor="#6B7280"
                                value={keyTargets}
                                onChangeText={setKeyTargets}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <Text style={styles.label}>Local Relevance (Malaysia Policy context)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. Aligns with local STR welfare plans..."
                                placeholderTextColor="#6B7280"
                                value={localRelevance}
                                onChangeText={setLocalRelevance}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <Button 
                                style={{ marginTop: 12 }} 
                                onPress={handleSaveMission} 
                                disabled={submitting}
                            >
                                {submitting ? 'Assigning...' : 'Assign Missions'}
                            </Button>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
    },
    scrollContent: {
        padding: 20,
    },
    moduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1B1B1B',
        borderColor: '#333333',
        borderWidth: 1,
        marginBottom: 12,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleInfo: {
        flex: 1,
        marginLeft: 14,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#D4AF37',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 2,
    },
    missionText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '85%',
        backgroundColor: '#1B1B1B',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333333',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#D4AF37',
        marginBottom: 6,
        fontWeight: '600',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#121212',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#E5E7EB',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#333333',
    },
    textArea: {
        minHeight: 80,
    },
});
