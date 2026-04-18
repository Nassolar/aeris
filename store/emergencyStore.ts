import { create } from 'zustand';

type EmergencyState = 'IDLE' | 'COUNTDOWN' | 'SENDING' | 'SENT';

interface EmergencyStore {
  status: EmergencyState;
  sosType: 'POLICE' | 'AMBULANCE' | 'FIRE' | null;
  countdown: number;
  setStatus: (status: EmergencyState) => void;
  setSOSType: (type: 'POLICE' | 'AMBULANCE' | 'FIRE' | null) => void;
  setCountdown: (value: number) => void;
  decrementCountdown: () => void;
  reset: () => void;
}

export const useEmergencyStore = create<EmergencyStore>((set) => ({
  status: 'IDLE',
  sosType: null,
  countdown: 10,
  setStatus: (status) => set({ status }),
  setSOSType: (type) => set({ sosType: type }),
  setCountdown: (value) => set({ countdown: value }),
  decrementCountdown: () => set((state) => ({ countdown: state.countdown - 1 })),
  reset: () => set({ status: 'IDLE', sosType: null, countdown: 10 }),
}));