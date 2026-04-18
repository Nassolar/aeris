import { create } from 'zustand';

interface KycState {
  idType: string;
  idFront: string | null;
  idBack: string | null;
  selfie: string | null;
  residenceDocType: string;
  residenceDoc: string | null;
  dependents: number;
  hasSenior: boolean;
  hasPwd: boolean;
  pwdType: string;
  homeAddress: string;
  setField: <K extends keyof Omit<KycState, 'setField' | 'reset'>>(
    key: K,
    value: KycState[K]
  ) => void;
  reset: () => void;
}

const defaultState: Omit<KycState, 'setField' | 'reset'> = {
  idType: '',
  idFront: null,
  idBack: null,
  selfie: null,
  residenceDocType: '',
  residenceDoc: null,
  dependents: 0,
  hasSenior: false,
  hasPwd: false,
  pwdType: '',
  homeAddress: '',
};

export const useKycStore = create<KycState>((set) => ({
  ...defaultState,
  setField: (key, value) => set({ [key]: value }),
  reset: () => set(defaultState),
}));
