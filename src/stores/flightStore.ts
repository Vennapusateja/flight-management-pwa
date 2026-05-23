'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Flight } from '@/types';

export interface PassengerFormDetails {
  title: string;
  first_name: string;
  last_name: string;
  passport_number?: string;
  date_of_birth?: string;
}

export interface PassengerFormData {
  contact_email: string;
  passengers: PassengerFormDetails[];
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

interface FlightState {
  activeSearchQuery: FlightSearchQuery | null;
  selectedFlight: Flight | null;
  selectedSeat: string | null;
  selectedSeats: string[];
  currentBookingStep: number;
  passengerFormData: PassengerFormData | null;

  // Actions
  setActiveSearchQuery: (query: FlightSearchQuery | null) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSelectedSeats: (seats: string[]) => void;
  setCurrentBookingStep: (step: number) => void;
  setPassengerFormData: (data: PassengerFormData | null) => void;
  resetFlightStore: () => void;
}

const initialState = {
  activeSearchQuery: null,
  selectedFlight: null,
  selectedSeat: null,
  selectedSeats: [],
  currentBookingStep: 1,
  passengerFormData: null,
};

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      ...initialState,
      setActiveSearchQuery: (query) => set({ activeSearchQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      setSelectedSeats: (seats) => set({ selectedSeats: seats }),
      setCurrentBookingStep: (step) => set({ currentBookingStep: step }),
      setPassengerFormData: (data) => set({ passengerFormData: data }),
      resetFlightStore: () => set(initialState),
    }),
    {
      name: 'sa-flight-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude passport numbers & sensitive details from local storage
      partialize: (state) => ({
        activeSearchQuery: state.activeSearchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        selectedSeats: state.selectedSeats,
        currentBookingStep: state.currentBookingStep,
        passengerFormData: state.passengerFormData
          ? {
              contact_email: state.passengerFormData.contact_email,
              passengers: state.passengerFormData.passengers.map((p) => ({
                title: p.title,
                first_name: p.first_name,
                last_name: p.last_name,
                // passport_number and date_of_birth are sensitive PII, excluded from localStorage
              })),
            }
          : null,
      }),
    }
  )
);
