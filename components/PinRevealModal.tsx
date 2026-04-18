import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinRevealModalProps {
  visible: boolean;
  pin: string;
  onClose: () => void;
}

export function PinRevealModal({ visible, pin, onClose }: PinRevealModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="lock-open" size={32} color="#000" />
            <Text style={styles.title}>Job Completion Key</Text>
          </View>
          
          <Text style={styles.instructions}>
            Please show this PIN to your partner to verify the job is done and release payment.
          </Text>

          {/* THE DIGITAL KEY */}
          <View style={styles.pinContainer}>
            {pin.split('').map((digit, index) => (
              <View key={index} style={styles.digitBox}>
                <Text style={styles.digitText}>{digit}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  card: { 
    backgroundColor: '#FFF', 
    width: '100%', 
    maxWidth: 320, 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center' 
  },
  header: { 
    marginBottom: 16, 
    alignItems: 'center', 
    // gap: 12, <-- REMOVED (Causing Android wiggles)
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    textAlign: 'center',
    marginTop: 12 // Replaces gap in header
  },
  instructions: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 32, 
    lineHeight: 20 
  },
  
  pinContainer: { 
    flexDirection: 'row', 
    marginBottom: 32,
    // gap: 12, <-- REMOVED (The culprit)
    justifyContent: 'center'
  },
  digitBox: { 
    width: 50, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: '#F5F5F5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#000',
    marginHorizontal: 6 // <-- ADDED: The stable fix
  },
  digitText: { 
    fontSize: 28, 
    fontWeight: '800' 
  },

  closeBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 32 
  },
  closeText: { 
    fontWeight: '700', 
    color: '#666', 
    letterSpacing: 1 
  }
});