import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, Alert, SafeAreaView
} from 'react-native';
import { Award, Plus, Trash2, Edit, X } from 'lucide-react-native';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function BadgeManagerScreen() {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal forms states
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null); // null if creating
    const [badgeName, setBadgeName] = useState('');
    const [requirement, setRequirement] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/badges');
            setBadges(response.data);
        } catch (error) {
            console.error('Error fetching badges:', error);
            Alert.alert('Error', 'Failed to load badges.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingBadge(null);
        setBadgeName('');
        setRequirement('');
        setModalVisible(true);
    };

    const handleOpenEdit = (badge) => {
        setEditingBadge(badge);
        setBadgeName(badge.badgeName);
        setRequirement(badge.requirement);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!badgeName.trim() || !requirement.trim()) {
            Alert.alert('Missing Fields', 'Please fill in both badge name and requirement.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                badgeName: badgeName.trim(),
                requirement: requirement.trim()
            };

            if (editingBadge) {
                // Update badge
                await api.put(`/admin/badges/${editingBadge.badgeID}`, payload);
                Alert.alert('Success', 'Badge updated successfully.');
            } else {
                // Create badge
                await api.post('/admin/badges', payload);
                Alert.alert('Success', 'Badge created successfully.');
            }
            setModalVisible(false);
            fetchBadges();
        } catch (error) {
            console.error('Error saving badge:', error);
            Alert.alert('Error', 'Failed to save badge.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBadge = (id, name) => {
        Alert.alert(
            'Delete Badge',
            `Are you sure you want to delete "${name}"? This will safely remove it from all users who earned it as well.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/admin/badges/${id}`);
                            Alert.alert('Success', 'Badge deleted successfully.');
                            fetchBadges();
                        } catch (error) {
                            console.error('Error deleting badge:', error);
                            Alert.alert('Error', 'Failed to delete badge.');
                        }
                    }
                }
            ]
        );
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
                <Text style={styles.title}>System Badges</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
                    <Plus color="#121212" size={20} strokeWidth={3} />
                    <Text style={styles.addButtonText}>Add Badge</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {badges.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Award color="#444444" size={64} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>No badges seeded yet.</Text>
                    </View>
                ) : (
                    badges.map((badge) => (
                        <Card key={badge.badgeID} style={styles.badgeCard}>
                            <View style={styles.badgeIconContainer}>
                                <Award color="#D4AF37" size={32} />
                            </View>
                            <View style={styles.badgeInfo}>
                                <Text style={styles.badgeNameText}>{badge.badgeName}</Text>
                                <Text style={styles.badgeReqText}>Req: {badge.requirement}</Text>
                            </View>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity 
                                    onPress={() => handleOpenEdit(badge)} 
                                    style={[styles.actionIconBtn, { marginRight: 12 }]}
                                >
                                    <Edit color="#D4AF37" size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => handleDeleteBadge(badge.badgeID, badge.badgeName)} 
                                    style={styles.actionIconBtn}
                                >
                                    <Trash2 color="#EF4444" size={20} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>

            {/* Add / Edit Badge Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingBadge ? 'Edit Badge' : 'New Badge'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color="#9CA3AF" size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Badge Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Earth Guardian"
                            placeholderTextColor="#6B7280"
                            value={badgeName}
                            onChangeText={setBadgeName}
                        />

                        <Text style={styles.label}>Requirement Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Score 100 or Level 3"
                            placeholderTextColor="#6B7280"
                            value={requirement}
                            onChangeText={setRequirement}
                            autoCapitalize="none"
                        />

                        <Button 
                            style={{ marginTop: 12 }} 
                            onPress={handleSubmit} 
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Save Badge'}
                        </Button>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4AF37',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    addButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    scrollContent: {
        padding: 20,
    },
    badgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1B1B1B',
        borderColor: '#333333',
        borderWidth: 1,
        marginBottom: 12,
    },
    badgeIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeInfo: {
        flex: 1,
        marginLeft: 16,
    },
    badgeNameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    badgeReqText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconBtn: {
        padding: 4,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: 'bold',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    label: {
        fontSize: 14,
        color: '#D4AF37',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#121212',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#E5E7EB',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
});
