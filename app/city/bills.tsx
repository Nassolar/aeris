import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';
import { Bill } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const OVERDUE_RED = '#E84040';
const BILLS_VIEW_COUNT_KEY = 'billsViewCount';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysOverdue(ts: { seconds: number }): number {
  return Math.floor((Date.now() - ts.seconds * 1000) / (1000 * 60 * 60 * 24));
}

function getDaysDue(ts: { seconds: number }): number {
  return Math.floor((ts.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BillSection = { title: string; color: string; data: Bill[] };

type ChatMessage = { role: 'user' | 'assistant'; content: string };

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillsInboxScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);

  // Assistant card state
  const [showAssistantCard, setShowAssistantCard] = useState(false);

  // Chat modal state
  const [showAssistantChat, setShowAssistantChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! How can I help you with your bills today?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsubscribe = firestore()
      .collection('bills')
      .where('citizenUid', '==', user.uid)
      .orderBy('dueDate', 'asc')
      .onSnapshot(
        async (snapshot) => {
          if (!snapshot) { setLoading(false); return; }
          setBills(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Bill)));
          setLoading(false);

          // First-time bills view check (Trigger A)
          try {
            const raw = await AsyncStorage.getItem(BILLS_VIEW_COUNT_KEY);
            const count = raw ? parseInt(raw, 10) : 0;
            if (count === 0) {
              setShowAssistantCard(true);
              await AsyncStorage.setItem(BILLS_VIEW_COUNT_KEY, '1');
            }
          } catch (err) {
            console.error('[Bills] AsyncStorage error:', err);
          }
        },
        (err) => { console.error('[Bills] error:', err); setLoading(false); },
      );

    return () => unsubscribe();
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const overdue = bills.filter((b) => b.status === 'overdue');
  const dueSoon = bills.filter((b) => b.status === 'unpaid' || b.status === 'partial');
  const paid = bills.filter((b) => b.status === 'paid');

  const sections: BillSection[] = [
    { title: `OVERDUE (${overdue.length})`, color: OVERDUE_RED, data: overdue },
    { title: `DUE SOON (${dueSoon.length})`, color: '#FF9500', data: dueSoon },
    { title: `PAID — last 90 days (${paid.length})`, color: '#888888', data: paid },
  ].filter((s) => s.data.length > 0);

  const STATUS_COLORS: Record<string, string> = {
    overdue: OVERDUE_RED,
    unpaid: '#FF9500',
    partial: '#FF9500',
    paid: '#888888',
  };

  // ── Chat handler ──────────────────────────────────────────────────────────────

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(nextMessages);
    setChatLoading(true);

    try {
      const fn = firebase.functions().httpsCallable('askAerisAssistant');
      const firstOverdue = overdue[0] ?? null;
      const result = await fn({
        message: userMsg,
        context: {
          citizenFirstName: 'there',
          lguName: 'your LGU',
          barangay: '',
          activeBill: firstOverdue
            ? {
                description: firstOverdue.description,
                totalAmount: firstOverdue.totalAmount,
                dueDate: new Date((firstOverdue.dueDate?.seconds ?? 0) * 1000)
                  .toISOString()
                  .split('T')[0],
                daysOverdue:
                  firstOverdue.status === 'overdue'
                    ? Math.floor(
                        (Date.now() - (firstOverdue.dueDate?.seconds ?? 0) * 1000) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null,
              }
            : null,
        },
        conversationHistory: chatMessages,
      });
      const data = result.data as { response: string };
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error('[AerisAssistant] sendChatMessage error:', err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // ── Assistant card body text ──────────────────────────────────────────────────

  function getAssistantCardBody(): string {
    if (!overdue[0]) return '';
    const first = overdue[0];
    if (first.penalties > 0) {
      return `Your ${first.description} bill has penalties because it's overdue. Paying today stops further charges.`;
    }
    const s = overdue.length > 1 ? 's' : '';
    return `You have ${overdue.length} overdue bill${s}. Paying today avoids further penalties.`;
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderBillCard = ({ item: bill }: { item: Bill }) => {
    const isOverdue = bill.status === 'overdue';
    const isPaid = bill.status === 'paid';
    const badgeColor = STATUS_COLORS[bill.status] ?? '#888';

    const metaText = isOverdue
      ? `Due ${formatDate(bill.dueDate)} · ${getDaysOverdue(bill.dueDate)} days overdue`
      : isPaid
      ? `Paid ${formatDate(bill.paidAt)}`
      : `Due ${formatDate(bill.dueDate)}`;

    return (
      <TouchableOpacity
        style={styles.billCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/city/bill/[id]', params: { id: bill.id } })}
      >
        <View style={styles.billCardRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.billDesc} numberOfLines={2}>{bill.description}</Text>
            <Text style={styles.billMeta}>{metaText}</Text>
          </View>
          <View>
            <Text style={[
              styles.billAmount,
              {
                color: isPaid ? '#888' : isOverdue ? OVERDUE_RED : '#1A1A1A',
                textDecorationLine: isPaid ? 'line-through' : 'none',
              },
            ]}>
              {formatPeso(bill.totalAmount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badgeColor, alignSelf: 'flex-end', marginTop: 6 }]}>
              <Text style={styles.statusBadgeText}>{bill.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        {!isPaid && (
          <TouchableOpacity
            style={[styles.payNowBtn, { backgroundColor: isOverdue ? OVERDUE_RED : '#1A1A1A' }]}
            onPress={() => router.push({ pathname: '/city/bill/[id]', params: { id: bill.id } })}
          >
            <Text style={styles.payNowLabel}>Pay Now →</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>My Bills</Text>
        </View>
        <ActivityIndicator size="large" color={OVERDUE_RED} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>My Bills</Text>
      </View>

      {bills.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No bills found</Text>
          <Text style={styles.emptySub}>Your LGU bills will appear here once issued.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListHeaderComponent={
            showAssistantCard && overdue.length > 0 ? (
              <View style={assistantCardStyles.card}>
                <View style={assistantCardStyles.header}>
                  <Text style={assistantCardStyles.badge}>💬 AERIS</Text>
                  <TouchableOpacity onPress={() => setShowAssistantCard(false)}>
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={assistantCardStyles.body}>{getAssistantCardBody()}</Text>
                <View style={assistantCardStyles.actions}>
                  <TouchableOpacity
                    style={assistantCardStyles.primaryBtn}
                    onPress={() =>
                      router.push({ pathname: '/city/bill/[id]', params: { id: overdue[0].id } })
                    }
                  >
                    <Text style={assistantCardStyles.primaryBtnLabel}>Pay now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={assistantCardStyles.secondaryBtn}
                    onPress={() => setShowAssistantChat(true)}
                  >
                    <Text style={assistantCardStyles.secondaryBtnLabel}>Ask a question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item: section }) => (
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.sectionLabel, { color: section.color }]}>{section.title}</Text>
              {section.data.map((bill) => renderBillCard({ item: bill }))}
            </View>
          )}
        />
      )}

      {/* ── AERIS Assistant Chat Modal ──────────────────────────────────────── */}
      <Modal
        visible={showAssistantChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssistantChat(false)}
      >
        <RNSafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={chatStyles.header}>
            <TouchableOpacity onPress={() => setShowAssistantChat(false)}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={chatStyles.title}>AERIS Assistant</Text>
          </View>

          <FlatList
            ref={chatListRef}
            data={chatMessages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={chatStyles.messageList}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View
                style={[
                  chatStyles.bubble,
                  item.role === 'user' ? chatStyles.userBubble : chatStyles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    chatStyles.bubbleText,
                    item.role === 'user' ? chatStyles.userText : chatStyles.assistantText,
                  ]}
                >
                  {item.content}
                </Text>
              </View>
            )}
          />

          {chatLoading && (
            <ActivityIndicator style={{ paddingVertical: 8 }} color="#000" />
          )}

          <View style={chatStyles.inputRow}>
            <TextInput
              style={chatStyles.input}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a question..."
              placeholderTextColor="#9CA3AF"
              multiline={false}
              onSubmitEditing={sendChatMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[chatStyles.sendBtn, chatLoading && { opacity: 0.5 }]}
              onPress={sendChatMessage}
              disabled={chatLoading}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </RNSafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  billCardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  billDesc: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  billMeta: { fontSize: 12, color: '#6B7280' },
  billAmount: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },

  payNowBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payNowLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});

const assistantCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  body: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryBtnLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryBtnLabel: { color: '#374151', fontSize: 13, fontWeight: '600' },
});

const chatStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  messageList: { padding: 16, gap: 12 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 12 },
  userBubble: { backgroundColor: '#000', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  assistantText: { color: '#111827' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
