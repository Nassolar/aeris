import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface TrackedReport {
    id: string;
    reportId: string;
    status: string;
    category: string;
    isAnonymous: boolean;
    timestamp: { seconds: number } | null;
}

const theme = {
    bg: '#F1F5F9',
    card: '#fff',
    text: '#1e293b',
    textDim: '#64748b',
    primary: '#0B1121',
    border: '#e2e8f0',
    warning: '#F59E0B',
};

export default function TrackReportScreen() {
    const [reportId, setReportId] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<TrackedReport | null>(null);

    const handleTrack = async () => {
        if (!reportId.trim()) {
            Alert.alert('Required', 'Please enter a valid Report ID');
            return;
        }

        setLoading(true);
        setReportData(null);

        try {
            const docSnap = await firestore().collection('reports').doc(reportId.trim().toUpperCase()).get();

            if (docSnap.exists) {
                const data = docSnap.data() as any;
                setReportData({
                    id: docSnap.id,
                    reportId: (data.reportId as string) || docSnap.id,
                    status: (data.status as string) || 'pending',
                    category: (data.category as string) || 'general',
                    isAnonymous: (data.isAnonymous as boolean) || false,
                    timestamp: data.timestamp as { seconds: number } | null,
                });
            } else {
                Alert.alert('Not Found', 'No report found with this ID. Please check the ID and try again.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch report status. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const normalized = status?.toLowerCase() || 'pending';
        if (['pending'].includes(normalized)) return '#F59E0B';
        if (['accepted', 'assigned', 'investigating', 'responding', 'on_route', 'on_scene'].includes(normalized)) return '#3B82F6';
        if (['resolved', 'completed', 'done', 'finished'].includes(normalized)) return '#10B981';
        return '#64748b'; // generic / cancelled
    };

    const renderTimeline = () => {
        if (!reportData) return null;

        const status = reportData.status?.toLowerCase() || 'pending';
        const submittedTime = reportData.timestamp?.seconds ? new Date(reportData.timestamp.seconds * 1000).toLocaleString() : 'Unknown';

        return (
            <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>Report: {reportData.reportId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.statusBadgeText}>{reportData.status?.toUpperCase() || 'PENDING'}</Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Submitted:</Text>
                    <Text style={styles.detailsValue}>{submittedTime}</Text>
                </View>
                <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Category:</Text>
                    <Text style={styles.detailsValue}>{reportData.category?.toUpperCase() || 'GENERAL'}</Text>
                </View>

                <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>Timeline:</Text>

                    <View style={styles.timelineStep}>
                        <View style={styles.timelineDotActive} />
                        <Text style={styles.timelineStepText}>✅ Submitted - {submittedTime}</Text>
                    </View>

                    {['accepted', 'assigned', 'investigating', 'responding', 'on_route', 'on_scene', 'resolved', 'completed', 'done', 'finished'].includes(status) && (
                        <View style={styles.timelineStep}>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineDotActive} />
                            <Text style={styles.timelineStepText}>✅ Received & Assigned</Text>
                        </View>
                    )}

                    {['resolved', 'completed', 'done', 'finished'].includes(status) ? (
                        <View style={styles.timelineStep}>
                            <View style={styles.timelineLine} />
                            <View style={styles.timelineDotActive} />
                            <Text style={styles.timelineStepText}>✅ Resolution - Complete</Text>
                        </View>
                    ) : (
                        <View style={styles.timelineStep}>
                            <View style={styles.timelineLineInactive} />
                            <View style={styles.timelineDotInactive} />
                            <Text style={styles.timelineStepTextInactive}>⏳ Resolution - Pending</Text>
                        </View>
                    )}
                </View>

                {reportData.isAnonymous && (
                    <View style={styles.anonymousBanner}>
                        <Ionicons name="lock-closed" size={16} color={theme.warning} style={{ marginRight: 6 }} />
                        <Text style={styles.anonymousBannerText}>Reported anonymously</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Track Report',
                headerStyle: { backgroundColor: theme.primary },
                headerTintColor: '#fff',
            }} />

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Text style={styles.label}>Enter your Report ID:</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. RPT-123456"
                            placeholderTextColor={theme.textDim}
                            value={reportId}
                            onChangeText={setReportId}
                            autoCapitalize="characters"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btnPrimary, !reportId.trim() && styles.btnDisabled]}
                        onPress={handleTrack}
                        disabled={!reportId.trim() || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Track Report</Text>}
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={16} color={theme.textDim} style={{ marginRight: 6 }} />
                        <Text style={styles.infoText}>Report IDs are provided after submission and usually consist of letters and numbers.</Text>
                    </View>
                </View>

                {renderTimeline()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg,
    },
    content: {
        padding: 20,
    },
    searchContainer: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12,
    },
    inputWrapper: {
        borderWidth: 2,
        borderColor: theme.border,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#f8fafc',
    },
    input: {
        padding: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        letterSpacing: 2,
    },
    btnPrimary: {
        backgroundColor: theme.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    btnDisabled: {
        opacity: 0.5,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        color: theme.textDim,
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    resultCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailsLabel: {
        width: 80,
        color: theme.textDim,
        fontSize: 14,
    },
    detailsValue: {
        color: theme.text,
        fontSize: 14,
        fontWeight: '600',
    },
    timelineContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    timelineDotActive: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        marginRight: 12,
        zIndex: 2,
    },
    timelineDotInactive: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.border,
        marginRight: 12,
        zIndex: 2,
    },
    timelineLine: {
        position: 'absolute',
        top: -16,
        left: 5,
        width: 2,
        height: 20,
        backgroundColor: '#10B981',
        zIndex: 1,
    },
    timelineLineInactive: {
        position: 'absolute',
        top: -16,
        left: 5,
        width: 2,
        height: 20,
        backgroundColor: theme.border,
        zIndex: 1,
    },
    timelineStepText: {
        color: theme.text,
        fontSize: 14,
        fontWeight: '500',
    },
    timelineStepTextInactive: {
        color: theme.textDim,
        fontSize: 14,
    },
    anonymousBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    anonymousBannerText: {
        color: '#92400e',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
