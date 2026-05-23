'use client';

import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { flightSearchSchema, type FlightSearchInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { AirportCombobox } from '@/components/ui/AirportCombobox';

export function FlightSearchForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [cabinClass, setCabinClass] = useState<string>('Economy');
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const passengerRef = useRef<HTMLDivElement>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FlightSearchInput>({
    resolver: zodResolver(flightSearchSchema),
    defaultValues: {
      passengers: 1,
      date: new Date().toISOString().split('T')[0] ?? '',
      origin: '',
      destination: '',
    },
  });

  const passengersCount = watch('passengers') || 1;
  const originVal = watch('origin');
  const destinationVal = watch('destination');

  // Swap Origin and Destination
  const handleSwapAirports = () => {
    setValue('origin', destinationVal);
    setValue('destination', originVal);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit: SubmitHandler<FlightSearchInput> = (data) => {
    const params = new URLSearchParams({
      origin:      data.origin,
      destination: data.destination,
      date:        data.date,
      passengers:  String(data.passengers),
      class:       cabinClass,
      tripType,
    });
    router.push(`/flights?${params.toString()}`);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Tab Selectors (Trip Type & Cabin Class) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
          <button
            type="button"
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tripType === 'oneway' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setTripType('oneway')}
          >
            One Way
          </button>
          <button
            type="button"
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tripType === 'roundtrip' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setTripType('roundtrip')}
          >
            Round Trip
          </button>
        </div>

        {/* Cabin Class Selection */}
        <div className="inline-flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Cabin:</span>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Economy">Economy</option>
            <option value="Premium">Premium Economy</option>
            <option value="Business">Business Class</option>
            <option value="First">First Class</option>
          </select>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        aria-label="Flight search form"
        noValidate
      >
        {/* Origin field */}
        <div className="relative">
          <Controller
            name="origin"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <AirportCombobox
                label="From"
                placeholder="Origin Airport"
                value={field.value}
                onChange={field.onChange}
                error={errors.origin?.message}
                required
              />
            )}
          />

          {/* Interactive Swap Icon Button */}
          <button
            type="button"
            onClick={handleSwapAirports}
            className="absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 shadow-md transition-all hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       top-1/2 -translate-y-1/2 right-[-14px] sm:top-[38px] sm:translate-y-0 sm:right-[-14px] lg:top-[38px]"
            aria-label="Swap origin and destination"
          >
            <svg className="h-3.5 w-3.5 transform transition-transform duration-200 hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Destination field */}
        <div className="relative sm:pl-1">
          <Controller
            name="destination"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <AirportCombobox
                label="To"
                placeholder="Destination Airport"
                value={field.value}
                onChange={field.onChange}
                error={errors.destination?.message}
                required
              />
            )}
          />
        </div>

        {/* Date picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Departure Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('date')}
            min={new Date().toISOString().split('T')[0] ?? ''}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          {errors.date?.message && (
            <p className="text-xs text-red-400 font-medium" role="alert">
              {errors.date.message}
            </p>
          )}
        </div>

        {/* Passengers picker (Dropdown modal replacement) */}
        <div className="flex flex-col gap-1.5 relative" ref={passengerRef}>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Passengers <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-left text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <span>
              {passengersCount} passenger{passengersCount > 1 ? 's' : ''}
            </span>
            <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showPassengerDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Premium dropdown pane */}
          {showPassengerDropdown && (
            <div className="absolute top-[68px] left-0 z-50 w-64 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between gap-6 py-1">
                <div>
                  <p className="text-xs font-bold text-slate-200">Adults</p>
                  <p className="text-[10px] text-slate-500 font-medium">Age 12+</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={passengersCount <= 1}
                    onClick={() => setValue('passengers', passengersCount - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-850 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-900 hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-slate-200">{passengersCount}</span>
                  <button
                    type="button"
                    disabled={passengersCount >= 9}
                    onClick={() => setValue('passengers', passengersCount + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-850 bg-slate-900 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-900 hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-900 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Maximum 9 passengers allowed per reservation.</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit search button */}
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          className="sm:col-span-2 lg:col-span-4 shadow-lg shadow-indigo-600/10 h-10 py-0"
        >
          Search Flights
        </Button>
      </form>
    </div>
  );
}
