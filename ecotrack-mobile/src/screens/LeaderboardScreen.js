import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, Dimensions, ActivityIndicator,
    ScrollView, TouchableOpacity, Modal, TextInput, Platform
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
                const medal = MEDAL[user.displayRank] || MEDAL[3];
                return (
                    <View key={user.displayRank} style={styles.podiumSlot}>
                        {/* Avatar */}
                        <View style={[styles.podiumAvatar, { borderColor: medal.ring, backgroundColor: medal.ring + '40' }]}>
                            <Text style={styles.podiumEmoji}>{medal.emoji}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, width: '100%', justifyContent: 'center' }}>
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
                                {user.displayRank}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

function LeaderRow({ item }) {
    const isTopThree = item.displayRank <= 3;
    const medal = MEDAL[item.displayRank];

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
                    {item.displayRank}
                </Text>
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.rowUsername}>{item.username}</Text>
                    {item.className && (
                        <Text style={styles.rowClass}> • {item.className}</Text>
                    ) || null}
                </View>
                <Text style={styles.rowLevel}>
                    Level {item.level} {item.schoolName ? `• ${item.schoolName}` : ''}
                </Text>
            </View>

            {/* XP */}
            <Badge variant="secondary" style={isTopThree && { backgroundColor: medal.bg }} textStyle={isTopThree && { color: medal.text }}>
                {item.xp.toLocaleString()} XP
            </Badge>
        </Card>
    );
}

function SearchableDropdown({
    visible,
    onClose,
    title,
    selectedValue,
    options,
    onSelect,
    searchable = false,
    placeholder = "Search..."
}) {
    const [searchQuery, setSearchQuery] = useState('');

    // Clear search query when open/close
    useEffect(() => {
        if (!visible) {
            setSearchQuery('');
        }
    }, [visible]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={dropdownStyles.modalBackdrop}>
                <TouchableOpacity
                    style={dropdownStyles.backdropPressable}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={dropdownStyles.bottomSheet}>
                    <View style={dropdownStyles.handle} />

                    <View style={dropdownStyles.header}>
                        <Text style={dropdownStyles.headerTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={dropdownStyles.closeButton}>
                            <Text style={dropdownStyles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    {searchable && (
                        <View style={dropdownStyles.searchContainer}>
                            <Text style={dropdownStyles.searchIcon}>🔍</Text>
                            <TextInput
                                style={dropdownStyles.searchInput}
                                placeholder={placeholder}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={dropdownStyles.clearButton}>
                                    <Text style={dropdownStyles.clearButtonText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <FlatList
                        data={filteredOptions}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={dropdownStyles.listContent}
                        renderItem={({ item }) => {
                            const isSelected = item === selectedValue;
                            return (
                                <TouchableOpacity
                                    style={[
                                        dropdownStyles.optionRow,
                                        isSelected && dropdownStyles.optionRowActive
                                    ]}
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                >
                                    <Text
                                        style={[
                                            dropdownStyles.optionText,
                                            isSelected && dropdownStyles.optionTextActive
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                    {isSelected && (
                                        <Text style={dropdownStyles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={dropdownStyles.emptyContainer}>
                                <Text style={dropdownStyles.emptyText}>No matches found</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
}

export default function LeaderboardScreen() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dynamic Leaders Categorization filters
    const [selectedSchool, setSelectedSchool] = useState('All Schools');
    const [selectedClass, setSelectedClass] = useState('All Classes');

    // Dropdown visibility state
    const [schoolDropdownVisible, setSchoolDropdownVisible] = useState(false);
    const [classDropdownVisible, setClassDropdownVisible] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/leaderboard');
                setLeaderboardData(response.data);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    // Compile dynamic selector targets
    const uniqueSchools = ['All Schools', ...new Set(leaderboardData.map(u => u.schoolName).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    // Dynamic dependent Class compilation
    const uniqueClasses = [
        'All Classes',
        ...new Set(
            leaderboardData
                .filter(u => selectedSchool === 'All Schools' || u.schoolName === selectedSchool)
                .map(u => u.className)
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    // Reset class when school changes
    const handleSelectSchool = (school) => {
        setSelectedSchool(school);
        setSelectedClass('All Classes');
    };

    // Dynamic Filter & Podium Rank Calculation
    const filteredRaw = leaderboardData.filter(user => {
        if (selectedSchool !== 'All Schools' && user.schoolName !== selectedSchool) return false;
        if (selectedClass !== 'All Classes' && user.className !== selectedClass) return false;
        return true;
    });

    const rankedFiltered = filteredRaw.map((user, index) => ({
        ...user,
        displayRank: index + 1
    }));

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const renderDropdownFilters = () => (
        <View style={styles.dropdownContainer}>
            {/* School Dropdown Trigger */}
            <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setSchoolDropdownVisible(true)}
            >
                <View style={styles.dropdownInfo}>
                    <Text style={styles.dropdownLabel}>School Category</Text>
                    <Text style={styles.dropdownValue} numberOfLines={1}>
                        {selectedSchool}
                    </Text>
                </View>
                <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>

            {/* Class Dropdown Trigger */}
            <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setClassDropdownVisible(true)}
            >
                <View style={styles.dropdownInfo}>
                    <Text style={styles.dropdownLabel}>Class Category</Text>
                    <Text style={styles.dropdownValue} numberOfLines={1}>
                        {selectedClass}
                    </Text>
                </View>
                <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeaderFilters = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.heading}>Leaderboard</Text>
                <Text style={styles.subtitle}>Top learners this season</Text>
            </View>

            {/* Modern Dropdown Selectors */}
            {renderDropdownFilters()}

            {rankedFiltered.length > 0 ? (
                <TopThreePodium data={rankedFiltered} />
            ) : (
                <Text style={styles.emptyText}>No users on the podium for this category.</Text>
            )}

            <Text style={styles.allRanksTitle}>All Rankings</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={rankedFiltered.slice(3)}
                keyExtractor={(item) => item.userID ? item.userID.toString() : item.username}
                ListHeaderComponent={renderHeaderFilters}
                renderItem={({ item }) => <LeaderRow item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    rankedFiltered.length <= 3 && rankedFiltered.length > 0 ? null : (
                        <Text style={styles.emptyText}>No rankings found matching these criteria.</Text>
                    )
                }
            />

            {/* School Dropdown Bottom Sheet */}
            <SearchableDropdown
                visible={schoolDropdownVisible}
                onClose={() => setSchoolDropdownVisible(false)}
                title="Select School"
                selectedValue={selectedSchool}
                options={uniqueSchools}
                onSelect={handleSelectSchool}
                searchable={true}
                placeholder="Search school..."
            />

            {/* Class Dropdown Bottom Sheet */}
            <SearchableDropdown
                visible={classDropdownVisible}
                onClose={() => setClassDropdownVisible(false)}
                title="Select Class"
                selectedValue={selectedClass}
                options={uniqueClasses}
                onSelect={setSelectedClass}
                searchable={false}
            />
        </View>
    );
}

const dropdownStyles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    backdropPressable: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '75%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
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
        borderColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
    },
    closeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    closeButtonText: {
        color: '#10B981',
        fontWeight: '700',
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    },
    searchIcon: {
        fontSize: 14,
        color: '#9CA3AF',
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    clearButtonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 8,
        paddingBottom: 16,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#F9FAFB',
    },
    optionRowActive: {
        backgroundColor: '#ECFDF5',
    },
    optionText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    optionTextActive: {
        color: '#059669',
        fontWeight: '700',
    },
    checkmark: {
        color: '#10B981',
        fontWeight: '900',
        fontSize: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 15,
        fontWeight: '600',
    },
});

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

    // ── Dropdown Selectors Row ──
    dropdownContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    dropdownTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dropdownInfo: {
        flex: 1,
        marginRight: 6,
    },
    dropdownLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dropdownValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111827',
    },
    dropdownChevron: {
        fontSize: 10,
        color: '#9CA3AF',
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
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginVertical: 20,
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'italic',
    }
});
