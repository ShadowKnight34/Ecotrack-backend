import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet, Text, View, FlatList,
    ActivityIndicator, TouchableOpacity,
    Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, Plus, X, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ForumScreen() {
    const { user } = useContext(AuthContext);
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [forumTab, setForumTab] = useState('General Feed');
    const [selectedFormLevel, setSelectedFormLevel] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSelectImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.didCancel) return;
            if (response.errorMessage) {
                Alert.alert('Error', response.errorMessage);
                return;
            }
            if (response.assets && response.assets.length > 0) {
                setImageUri(response.assets[0]);
            }
        });
    };

    const fetchDiscussions = async () => {
        try {
            let formParam = '';
            if (user?.role === 'teacher') {
                formParam = `?formLevel=${selectedFormLevel}`;
            } else if (user?.formLevel) {
                formParam = `?formLevel=${user.formLevel}`;
            }
            const response = await api.get(`/discussions${formParam}`);
            setDiscussions(response.data);
        } catch (error) {
            console.error('Error fetching discussions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDiscussions();
    }, [selectedFormLevel]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDiscussions();
    };

    const handleCreatePost = async () => {
        if (!newContent.trim()) {
            Alert.alert('Missing field', 'Please enter content for your post.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: newContent.trim().substring(0, 40) || 'Discussion Post',
                content: newContent.trim(),
                category: forumTab
            };

            await api.post('/discussions', payload);

            setNewContent('');
            setImageUri(null);
            setModalVisible(false);
            handleRefresh();
        } catch (error) {
            console.error('Error creating post:', error.response?.data || error.message);
            Alert.alert('Error', 'Could not create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = (id) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/discussions/${id}`);
                            handleRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete post.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isStudent = item.role === 'student';
        const cohortBadgeText = isStudent ? `Form ${item.formLevel || 1}` : item.role === 'teacher' ? 'Teacher' : 'Admin';
        return (
            <Card style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                            <Text style={styles.authorText}>@{item.username}</Text>
                            <Badge variant={item.role === 'teacher' ? 'default' : 'outline'} style={styles.cohortBadge}>
                                {cohortBadgeText}
                            </Badge>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    {(user?.role === 'teacher' || user?.userID === item.userID) && (
                        <TouchableOpacity onPress={() => handleDeletePost(item.postID)} style={styles.deleteButton}>
                            <Trash2 color="#EF4444" size={20} />
                        </TouchableOpacity>
                    )}
                </View>
                {item.title && item.title !== 'Discussion Post' && item.title !== item.content.substring(0, 40) ? (
                    <Text style={styles.postTitle}>{item.title}</Text>
                ) : null}
                <Text style={styles.postContent}>
                    {item.content}
                </Text>
            </Card>
        );
    };

    const filteredDiscussions = discussions.filter(post => post.sdgCategory === forumTab);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MessageSquare color="#10B981" size={28} strokeWidth={2.5} style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Community</Text>
                </View>
                {user?.role === 'teacher' && (
                    <View style={styles.pickerWrapper}>
                        <TouchableOpacity 
                            style={styles.pickerButton} 
                            onPress={() => setShowDropdown(!showDropdown)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.pickerButtonText}>Form {selectedFormLevel}</Text>
                            <Text style={styles.pickerArrow}>▼</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {user?.role === 'teacher' && showDropdown && (
                <View style={styles.dropdownContainer}>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.dropdownItem, 
                                selectedFormLevel === level && styles.dropdownItemActive
                            ]}
                            onPress={() => {
                                setSelectedFormLevel(level);
                                setShowDropdown(false);
                            }}
                        >
                            <Text style={[
                                styles.dropdownItemText, 
                                selectedFormLevel === level && styles.dropdownItemTextActive
                            ]}>
                                Form {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Segmented Toggles */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, forumTab === 'General Feed' && styles.tabButtonActive]}
                    onPress={() => setForumTab('General Feed')}
                >
                    <Text style={[styles.tabButtonText, forumTab === 'General Feed' && styles.tabButtonTextActive]}>
                        General Feed
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, forumTab === 'Q&A Help' && styles.tabButtonActive]}
                    onPress={() => setForumTab('Q&A Help')}
                >
                    <Text style={[styles.tabButtonText, forumTab === 'Q&A Help' && styles.tabButtonTextActive]}>
                        Q&A Help
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : filteredDiscussions.length === 0 ? (
                <View style={styles.centered}>
                    <MessageSquare color="#D1D5DB" size={48} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>No posts yet.</Text>
                    <Text style={styles.emptySubText}>Be the first to share something in {forumTab}!</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDiscussions}
                    keyExtractor={(item) => item.postID?.toString() || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Plus color="#FFFFFF" size={28} strokeWidth={3} />
            </TouchableOpacity>

            {/* Create Post Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Post ({forumTab})</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <X color="#6B7280" size={24} />
                            </TouchableOpacity>
                        </View>

                        {/* Content Input */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={styles.label}>Message</Text>
                            <TouchableOpacity onPress={handleSelectImage} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ImageIcon color="#10B981" size={20} />
                                <Text style={{ color: '#10B981', marginLeft: 4, fontWeight: 'bold' }}>Add Image</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={newContent}
                            onChangeText={setNewContent}
                            placeholder="Share your thoughts, tips, or questions..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />

                        {imageUri && (
                            <View style={{ position: 'relative', marginBottom: 16 }}>
                                <Image source={{ uri: imageUri.uri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                                <TouchableOpacity 
                                    onPress={() => setImageUri(null)} 
                                    style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#EF4444', borderRadius: 12, padding: 2 }}
                                >
                                    <X color="#FFF" size={16} />
                                </TouchableOpacity>
                            </View>
                        )}

                        <Button
                            onPress={handleCreatePost}
                            disabled={submitting}
                            style={{ marginTop: 8 }}
                        >
                            {submitting ? 'Posting...' : 'Create Post'}
                        </Button>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        zIndex: 1000,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4B5563',
    },
    emptySubText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // extra padding for FAB
    },
    postCard: {
        padding: 20,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    tabButtonTextActive: {
        color: '#111827',
    },
    cohortBadge: {
        marginLeft: 8,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    deleteButton: {
        padding: 4,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
    },
    authorText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    postTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    postContent: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 110,
        zIndex: 999,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
        marginBottom: 20,
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    categoryPillActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    categoryPillText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    categoryPillTextActive: {
        color: '#064E3B',
    },
    pickerWrapper: {
        position: 'relative',
        zIndex: 1000,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pickerButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    pickerArrow: {
        fontSize: 10,
        color: '#6B7280',
        marginLeft: 2,
    },
    dropdownContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 10,
        zIndex: 9999,
        padding: 4,
    },
    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    dropdownItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    dropdownItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    dropdownItemTextActive: {
        color: '#10B981',
        fontWeight: '700',
    },
});
