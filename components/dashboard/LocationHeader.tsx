import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { BellIcon, ChevronDownIcon } from '../icons/WireframeIcons';

interface LocationHeaderProps {
    locationText?: string;
    notificationCount?: number;
    onLocationPress?: () => void;
    onNotificationPress?: () => void;
}

export default function LocationHeader({
    locationText = 'Taguig City',
    notificationCount = 0,
    onLocationPress,
    onNotificationPress,
}: LocationHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <View style={styles.leftContent}>
                <Text style={styles.label}>CURRENT LOCATION</Text>
                <TouchableOpacity style={styles.locationRow} onPress={onLocationPress}>
                    <Text style={styles.locationText}>{locationText}</Text>
                    <View style={styles.chevronContainer}>
                        <ChevronDownIcon size={14} color={theme.colors.textSecondary} strokeWidth={2.5} />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.rightContent}>
                <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>

                <TouchableOpacity style={styles.bellBtn} onPress={onNotificationPress}>
                    <BellIcon size={22} color={theme.colors.primary} />
                    {notificationCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: theme.colors.background,
    },
    leftContent: {
        justifyContent: 'center',
    },
    label: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        letterSpacing: 1.8,
        fontFamily: 'Barlow', // Make sure this runs regardless of if Barlow is loaded properly, styling requires Barlow.
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    locationText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.primary,
        fontFamily: 'Barlow',
    },
    chevronContainer: {
        marginLeft: 4,
        marginTop: 2,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(6, 193, 103, 0.1)', // green tinted background
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.uberGreen,
        marginRight: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.uberGreen,
        letterSpacing: 0.5,
    },
    bellBtn: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: theme.colors.emergencyRed,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: theme.colors.background,
    },
    badgeText: {
        color: theme.colors.surface,
        fontSize: 8,
        fontWeight: '800',
    },
});
