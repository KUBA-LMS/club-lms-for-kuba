import React from 'react';
import { NaverMapMarkerOverlay } from './index';
import MapPin from './MapPin';
import { EventWithStatus, UserRegistrationStatus } from '../../types/event';

interface EventMarkersProps {
  events: EventWithStatus[];
  selectedEventId?: string;
  onMarkerPress?: (event: EventWithStatus) => void;
}

export default function EventMarkers({ events, selectedEventId, onMarkerPress }: EventMarkersProps) {
  const geoEvents = events.filter((e) => e.latitude != null && e.longitude != null);

  return (
    <>
      {geoEvents.map((event) => {
        const isSelected = event.id === selectedEventId;
        return (
          <NaverMapMarkerOverlay
            key={event.id}
            latitude={event.latitude!}
            longitude={event.longitude!}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={isSelected ? 10 : 1}
            onTap={() => onMarkerPress?.(event)}
          >
            <MapPin
              status={event.user_status as UserRegistrationStatus}
              selected={isSelected}
            />
          </NaverMapMarkerOverlay>
        );
      })}
    </>
  );
}
