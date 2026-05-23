import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    ScrollView, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import { MessageSquare, ArrowRight, Trash2 } from 'lucide-react-native';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function ModuleDetailScreen({ route, navigation }) {
    const { user } = useContext(AuthContext);
    const { moduleID, title: initialTitle } = route.params;

    const [moduleDetails, setModuleDetails] = useState(null);

    const getDifficultyTier = () => {
        const formLevel = user?.formLevel;
        if (formLevel === 1 || formLevel === 2) {
            return 'Foundation Tier';
        } else if (formLevel === 3) {
            return 'Intermediate Tier';
        } else if (formLevel === 4 || formLevel === 5) {
            return 'Advanced Tier';
        }
        return 'Foundation Tier'; // Fallback tier
    };
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [moduleID]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [moduleRes, commentsRes] = await Promise.all([
                api.get(`/modules/${moduleID}`),
                api.get(`/comments/${moduleID}`)
            ]);
            setModuleDetails(moduleRes.data);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Error fetching module details or comments:', error);
            Alert.alert('Error', 'Failed to load content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        setSubmitting(true);
        try {
            await api.post('/comments', {
                moduleID,
                content: commentText.trim()
            });
            setCommentText(''); // Clear input
            
            // Refresh comments after posting
            const commentsRes = await api.get(`/comments/${moduleID}`);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Error posting comment:', error);
            Alert.alert('Error', 'Could not post your comment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = (commentID) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/comments/${commentID}`);
                            // Refresh comments
                            const commentsRes = await api.get(`/comments/${moduleID}`);
                            setComments(commentsRes.data);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete comment.');
                        }
                    }
                }
            ]
        );
    };

    if (loading || !moduleDetails) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ── SDG Content ── */}
                <Card style={styles.contentCard}>
                    <Badge variant="outline" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
                        {moduleDetails.category || 'Module'}
                    </Badge>
                    <Text style={styles.title}>{moduleDetails.title}</Text>
                    
                    {/* Quiz Overview Badge Row */}
                    <View style={styles.badgeRow}>
                        <Badge variant="secondary" style={styles.microBadge}>10 Questions</Badge>
                        <Badge variant="secondary" style={styles.microBadge}>No Time Limit</Badge>
                        <Badge variant="secondary" style={styles.microBadge}>{getDifficultyTier()}</Badge>
                    </View>

                    <Text style={styles.description}>
                        {moduleDetails.description}
                    </Text>

                    {/* Scrollable Educational Briefing */}
                    <View style={styles.briefingContainer}>
                        <ScrollView style={styles.briefingScroll} contentContainerStyle={styles.briefingScrollContent} nestedScrollEnabled={true}>
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>The Core Mission</Text>
                                <Text style={styles.sectionText}>
                                    {moduleDetails.coreMission && moduleDetails.coreMission.trim()
                                        ? moduleDetails.coreMission
                                        : 'The core mission of this module outlines the overarching goals and purpose behind this Sustainable Development Goal (SDG) focus.'}
                                </Text>
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Key Targets</Text>
                                <Text style={styles.sectionText}>
                                    {moduleDetails.keyTargets && moduleDetails.keyTargets.trim()
                                        ? moduleDetails.keyTargets
                                        : 'Key indicators and milestones established to track progress, raise community awareness, and measure collective impact.'}
                                </Text>
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Local Relevance (Malaysia Context)</Text>
                                <Text style={styles.sectionText}>
                                    {moduleDetails.localRelevance && moduleDetails.localRelevance.trim()
                                        ? moduleDetails.localRelevance
                                        : 'Connecting global goals to national initiatives, environmental policy, and localized action steps within Malaysian communities.'}
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                    
                    <Button 
                        variant="default"
                        style={{ marginTop: 24 }}
                        onPress={() => navigation.navigate('Quiz', { moduleID, title: moduleDetails.title })}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Take Quiz </Text>
                            <ArrowRight color="#FFF" size={20} />
                        </View>
                    </Button>
                </Card>

                {/* ── Comments Section ── */}
                <View style={styles.commentsSection}>
                    <View style={styles.commentsHeader}>
                        <MessageSquare color="#10B981" size={24} style={{ marginRight: 8 }} />
                        <Text style={styles.commentsTitle}>Discussions ({comments.length})</Text>
                    </View>

                    {comments.length === 0 ? (
                        <Text style={styles.noCommentsText}>No comments yet. Be the first to start the discussion!</Text>
                    ) : (
                        comments.map((comment) => (
                            <Card key={comment.commentID || Math.random()} style={styles.commentCard}>
                                <View style={styles.commentHeader}>
                                    <View>
                                        <Text style={styles.commentAuthor}>@{comment.username}</Text>
                                        <Text style={styles.commentDate}>
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    {user?.role === 'teacher' && (
                                        <TouchableOpacity onPress={() => handleDeleteComment(comment.commentID)} style={styles.deleteButton}>
                                            <Trash2 color="#EF4444" size={20} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.commentContent}>{comment.content || comment.commentText}</Text>
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* ── Input Field & Post Button ── */}
            <View style={styles.inputArea}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#9CA3AF"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <Button 
                    onPress={handlePostComment} 
                    disabled={!commentText.trim() || submitting}
                    style={styles.postButton}
                >
                    {submitting ? '...' : 'Post'}
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        marginTop: 4,
    },
    microBadge: {
        marginRight: 8,
        marginBottom: 8,
    },
    briefingContainer: {
        marginTop: 20,
        maxHeight: 280,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden',
    },
    briefingScroll: {
        padding: 16,
    },
    briefingScrollContent: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#374151',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    sectionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    contentCard: {
        padding: 24,
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    commentsSection: {
        marginBottom: 24,
    },
    commentsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    commentsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    noCommentsText: {
        color: '#6B7280',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    commentCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        // Less shadow for comments to distinguish from main card
        shadowOpacity: 0.05,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    deleteButton: {
        padding: 4,
    },
    commentAuthor: {
        fontWeight: '700',
        color: '#374151',
    },
    commentDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    commentContent: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 20,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'flex-end',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 48,
        maxHeight: 100,
        fontSize: 16,
        color: '#111827',
        marginRight: 12,
    },
    postButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
});
