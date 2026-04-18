import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

const theme = {
    bg: '#0B1121',
    card: '#151e32',
    text: '#fff',
    textDim: '#94a3b8',
    primary: '#EF4444',
    warning: '#F59E0B',
    border: '#334155',
    success: '#10B981',
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onAgree: () => void;
}

export default function AnonymousWaiverModal({ visible, onClose, onAgree }: Props) {
    const insets = useSafeAreaInsets();
    const [hasAgreed, setHasAgreed] = useState(false);


    const handleConfirm = () => {
        if (hasAgreed) {
            onAgree();
            setHasAgreed(false);
        } else {
            Alert.alert('Please Confirm', 'You must check the box to confirm you understand the terms.');
        }
    };

    const handleCancel = () => {
        setHasAgreed(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancel}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Ionicons name="lock-closed" size={24} color={theme.warning} style={{ marginRight: 8 }} />
                        <Text style={styles.headerTitle}>Anonymous Reporting / Anonymous na Pag-report</Text>
                    </View>
                    <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color={theme.textDim} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>WHAT IT MEANS:</Text>
                        <Text style={styles.bullet}>• Your name and contact info will be hidden from responders.</Text>
                        <Text style={styles.bulletTagalog}>Nakatago ang iyong pangalan at contact info.</Text>
                        <Text style={styles.bullet}>• You will receive a Report ID to track status.</Text>
                        <Text style={styles.bulletTagalog}>Makakakuha ka ng Report ID para sa tracking.</Text>
                        <Text style={styles.bullet}>• You will NOT receive direct updates.</Text>
                        <Text style={styles.bulletTagalog}>Hindi ka makakareceive ng direktang updates.</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>YOUR PROTECTION:</Text>
                        <Text style={styles.bullet}>Your identity is protected from police, fire, medical responders, and agency admins.</Text>
                        <Text style={styles.bulletTagalog}>Nakatago ang identity mo mula sa mga pulis, bumbero, medical responders, at administrators.</Text>
                    </View>

                    <View style={styles.warningSection}>
                        <View style={styles.warningHeader}>
                            <Ionicons name="warning" size={20} color="#000" style={{ marginRight: 8 }} />
                            <Text style={styles.warningTitle}>IMPORTANT LEGAL NOTICE:</Text>
                        </View>
                        <Text style={styles.warningText}>
                            Your identity CAN be revealed ONLY if:{'\n'}
                            <Text style={styles.warningTagalog}>Ang iyong identity ay maaaring ilantad LAMANG kung:</Text>
                        </Text>
                        <Text style={styles.warningBullet}>{'\n'}• A valid court order is issued</Text>
                        <Text style={styles.warningTagalog}>   May court order</Text>
                        <Text style={styles.warningBullet}>• Required by law for criminal prosecution</Text>
                        <Text style={styles.warningTagalog}>   Kinakailangan ng batas para sa kaso</Text>
                        <Text style={styles.warningBullet}>• Requested by NBI with legal authority</Text>
                        <Text style={styles.warningTagalog}>   Hiniling ng NBI na may legal authority</Text>
                        <Text style={[styles.warningText, { marginTop: 12 }]}>
                            This is for your protection while maintaining legal accountability.{'\n'}
                            <Text style={styles.warningTagalog}>Para ito sa iyong proteksyon habang may accountability sa batas.</Text>
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>WHAT WE STORE:</Text>
                        <Text style={styles.bullet}>Even when anonymous, we securely store your encrypted contact info, device info, IP address, and timestamp.</Text>
                        <Text style={styles.bulletTagalog}>Iyong contact information (encrypted), device at location info, oras ng pag-submit.</Text>
                        <Text style={styles.bullet}>This information is ONLY accessible by AERIS admins when legally required.</Text>
                        <Text style={styles.bulletTagalog}>Access lang ng AERIS admins kung kinakailangan ng korte o batas.</Text>
                    </View>

                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        activeOpacity={0.7}
                        onPress={() => setHasAgreed(!hasAgreed)}
                    >
                        <View style={[styles.checkbox, hasAgreed && styles.checkboxChecked]}>
                            {hasAgreed && <Ionicons name="checkmark" size={16} color="#000" />}
                        </View>
                        <Text style={styles.checkboxLabel}>
                            I understand and agree to these terms / <Text style={{ fontStyle: 'italic', color: theme.textDim }}>Nauunawaan at sumasang-ayon ako.</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.btnCancel} onPress={handleCancel}>
                            <Text style={styles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnAgree, !hasAgreed && styles.btnDisabled]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.btnAgreeText}>Report Anonymously</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        flexShrink: 1,
    },
    closeBtn: {
        padding: 5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.textDim,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    bullet: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
        marginBottom: 2,
    },
    bulletTagalog: {
        fontSize: 14,
        color: theme.textDim,
        fontStyle: 'italic',
        lineHeight: 20,
        marginBottom: 12,
        paddingLeft: 14,
    },
    warningSection: {
        backgroundColor: theme.warning,
        padding: 20,
        borderRadius: 8,
        marginBottom: 24,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#000',
        flex: 1,
    },
    warningText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 20,
    },
    warningBullet: {
        fontSize: 14,
        color: '#000',
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 1,
    },
    warningTagalog: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.6)',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: theme.card,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.warning,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.warning,
    },
    checkboxLabel: {
        color: theme.text,
        fontSize: 15,
        flex: 1,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    btnCancel: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
    },
    btnCancelText: {
        color: theme.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnAgree: {
        flex: 2,
        padding: 16,
        borderRadius: 8,
        backgroundColor: theme.warning,
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.5,
    },
    btnAgreeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
