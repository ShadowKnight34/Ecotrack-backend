import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, Dimensions, ActivityIndicator
} from 'react-native';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const { width } = Dimensions.get('window');

// ── Medal colors for top 3 ──
const MEDAL = {
    1: { bg: '#FBBF24', text: '#78350F', emoji: '🥇', ring: '#F59E0B' },
    2: { bg: '#9CA3AF', text: '#111827', emoji: '🥈', ring: '#6B7280' },
    3: { bg: '#D97706', text: '#451A03', emoji: '🥉', ring: '#B45309' },
};

function TopThreePodium({ data }) {
    if (!data || data.length === 0) return null;
    const top3 = data.slice(0, 3);
    
    const ordered = [];
    if (top3.length > 1) ordered.push({ user: top3[1], height: 100 });
    if (top3.length > 0) ordered.push({ user: top3[0], height: 140 });
    if (top3.length > 2) ordered.push({ user: top3[2], height: 80 });

    return (
        <View style={styles.podiumContainer}>
            {ordered.map(({ user, height }) => {
                const medal = MEDAL[user.rank] || MEDAL[3];
                return (
                    <View key={user.rank} style={styles.podiumSlot}>
                        {/* Avatar */}
                        <View style={[styles.podiumAvatar, { borderColor: medal.ring, backgroundColor: medal.ring + '40' }]}>
                            <Text style={styles.podiumEmoji}>{medal.emoji}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.podiumUsername} numberOfLines={1}>
                                {user.username}
                            </Text>
                            {user.className && (
                                <Text style={styles.podiumClass}> ({user.className})</Text>
                            )}
                        </View>
                        <Text style={styles.podiumXP}>{user.xp} XP</Text>
                        {/* Podium bar */}
                        <View
                            style={[
                                styles.podiumBar,
                                { height: height, backgroundColor: medal.bg },
                            ]}
                        >
                            <Text style={[styles.podiumRank, { color: medal.text }]}>
                                {user.rank}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

function LeaderRow({ item }) {
    const isTopThree = item.rank <= 3;
    const medal = MEDAL[item.rank];

    return (
        <Card style={[
            styles.row, 
            { 
                borderLeftWidth: 5, 
                borderLeftColor: isTopThree ? medal.bg : 'transparent',
                backgroundColor: '#FFFFFF'
            }
        ]}>
            {/* Rank */}
            <View
                style={[
                    styles.rankBadge,
                    isTopThree && { backgroundColor: medal.bg, borderColor: medal.ring },
                ]}
            >
                <Text
                    style={[
                        styles.rankText,
                        isTopThree && { color: medal.text },
                    ]}
                >
                    {item.rank}
                </Text>
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.rowUsername}>{item.username}</Text>
                    {item.className && (
                        <Text style={styles.rowClass}> • {item.className}</Text>
                    )}
                </View>
                <Text style={styles.rowLevel}>Level {item.level}</Text>
            </View>

            {/* XP */}
            <Badge variant="secondary" style={isTopThree && { backgroundColor: medal.bg }} textStyle={isTopThree && { color: medal.text }}>
                {item.xp.toLocaleString()} XP
            </Badge>
        </Card>
    );
}

export default function LeaderboardScreen() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/leaderboard');
                const rankedData = response.data.map((user, index) => ({
                    ...user,
                    rank: index + 1
                }));
                setLeaderboardData(rankedData);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={leaderboardData.slice(3)}
                keyExtractor={(item) => item.userID ? item.userID.toString() : item.username}
                ListHeaderComponent={
                    <View>
                        <View style={styles.header}>
                            <Text style={styles.heading}>Leaderboard</Text>
                            <Text style={styles.subtitle}>Top learners this season</Text>
                        </View>
                        <TopThreePodium data={leaderboardData} />
                        <Text style={styles.allRanksTitle}>All Rankings</Text>
                    </View>
                }
                renderItem={({ item }) => <LeaderRow item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    listContent: {
        padding: 20,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 24,
    },
    heading: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#4B5563',
        fontWeight: '500',
    },

    // ── Podium ──
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    podiumSlot: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    podiumAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    podiumEmoji: {
        fontSize: 26,
    },
    podiumUsername: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111827',
    },
    podiumClass: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#27AE60',
    },
    podiumXP: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '700',
        marginBottom: 8,
    },
    podiumBar: {
        width: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    podiumRank: {
        fontSize: 32,
        fontWeight: '900',
    },

    // ── List ──
    allRanksTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        backgroundColor: '#fff',
        padding: 16,
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    rankText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#6B7280',
    },
    userInfo: {
        flex: 1,
    },
    rowUsername: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    rowClass: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#27AE60',
    },
    rowLevel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '600',
    },
});
