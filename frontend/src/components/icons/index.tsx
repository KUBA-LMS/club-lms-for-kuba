import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export { default as OnePassLogo } from './OnePassLogo';

// Search Icon - Figma exact SVG
export function SearchIcon({ size = 20, color = '#212121' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Groups Icon - Figma exact SVG
export function GroupsIcon({ size = 25, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 25 12.5" fill="none">
      <Path
        d="M0 12.5V10.8594C0 10.1128 0.381944 9.50521 1.14583 9.03646C1.90972 8.56771 2.91667 8.33333 4.16667 8.33333C4.39236 8.33333 4.60937 8.33767 4.81771 8.34635C5.02604 8.35503 5.22569 8.37674 5.41667 8.41146C5.17361 8.77604 4.99132 9.15799 4.86979 9.55729C4.74826 9.9566 4.6875 10.3733 4.6875 10.8073V12.5H0ZM6.25 12.5V10.8073C6.25 10.2517 6.40191 9.74392 6.70573 9.28385C7.00955 8.82378 7.43924 8.42014 7.99479 8.07292C8.55035 7.72569 9.21441 7.46528 9.98698 7.29167C10.7595 7.11806 11.5972 7.03125 12.5 7.03125C13.4201 7.03125 14.2665 7.11806 15.0391 7.29167C15.8116 7.46528 16.4757 7.72569 17.0312 8.07292C17.5868 8.42014 18.0122 8.82378 18.3073 9.28385C18.6024 9.74392 18.75 10.2517 18.75 10.8073V12.5H6.25ZM20.3125 12.5V10.8073C20.3125 10.3559 20.2561 9.93056 20.1432 9.53125C20.0304 9.13194 19.8611 8.75868 19.6354 8.41146C19.8264 8.37674 20.0217 8.35503 20.2214 8.34635C20.421 8.33767 20.625 8.33333 20.8333 8.33333C22.0833 8.33333 23.0903 8.56337 23.8542 9.02344C24.6181 9.48351 25 10.0955 25 10.8594V12.5H20.3125ZM8.46354 10.4167H16.5625C16.3889 10.0694 15.9071 9.76562 15.1172 9.50521C14.3273 9.24479 13.4549 9.11458 12.5 9.11458C11.5451 9.11458 10.6727 9.24479 9.88281 9.50521C9.09288 9.76562 8.61979 10.0694 8.46354 10.4167ZM4.16667 7.29167C3.59375 7.29167 3.1033 7.08767 2.69531 6.67969C2.28733 6.2717 2.08333 5.78125 2.08333 5.20833C2.08333 4.61806 2.28733 4.12326 2.69531 3.72396C3.1033 3.32465 3.59375 3.125 4.16667 3.125C4.75694 3.125 5.25174 3.32465 5.65104 3.72396C6.05035 4.12326 6.25 4.61806 6.25 5.20833C6.25 5.78125 6.05035 6.2717 5.65104 6.67969C5.25174 7.08767 4.75694 7.29167 4.16667 7.29167ZM20.8333 7.29167C20.2604 7.29167 19.77 7.08767 19.362 6.67969C18.954 6.2717 18.75 5.78125 18.75 5.20833C18.75 4.61806 18.954 4.12326 19.362 3.72396C19.77 3.32465 20.2604 3.125 20.8333 3.125C21.4236 3.125 21.9184 3.32465 22.3177 3.72396C22.717 4.12326 22.9167 4.61806 22.9167 5.20833C22.9167 5.78125 22.717 6.2717 22.3177 6.67969C21.9184 7.08767 21.4236 7.29167 20.8333 7.29167ZM12.5 6.25C11.6319 6.25 10.8941 5.94618 10.2865 5.33854C9.67882 4.7309 9.375 3.99306 9.375 3.125C9.375 2.23958 9.67882 1.4974 10.2865 0.898437C10.8941 0.299479 11.6319 0 12.5 0C13.3854 0 14.1276 0.299479 14.7266 0.898437C15.3255 1.4974 15.625 2.23958 15.625 3.125C15.625 3.99306 15.3255 4.7309 14.7266 5.33854C14.1276 5.94618 13.3854 6.25 12.5 6.25ZM12.5 4.16667C12.7951 4.16667 13.0425 4.06684 13.2422 3.86719C13.4418 3.66753 13.5417 3.42014 13.5417 3.125C13.5417 2.82986 13.4418 2.58247 13.2422 2.38281C13.0425 2.18316 12.7951 2.08333 12.5 2.08333C12.2049 2.08333 11.9575 2.18316 11.7578 2.38281C11.5582 2.58247 11.4583 2.82986 11.4583 3.125C11.4583 3.42014 11.5582 3.66753 11.7578 3.86719C11.9575 4.06684 12.2049 4.16667 12.5 4.16667Z"
        fill={color}
      />
    </Svg>
  );
}

// Bookmark Icon - Figma exact SVG (ribbon bookmark shape)
export function StarsIcon({ size = 16, color = '#1E1E1E', filled = false }: { size?: number; color?: string; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12.6673 14L8.00065 10.6667L3.33398 14V3.33333C3.33398 2.97971 3.47446 2.64057 3.72451 2.39052C3.97456 2.14048 4.3137 2 4.66732 2H11.334C11.6876 2 12.0267 2.14048 12.2768 2.39052C12.5268 2.64057 12.6673 2.97971 12.6673 3.33333V14Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

// Share Icon - Figma exact SVG
export function ShareIcon({ size = 14, color = '#000000' }: { size?: number; color?: string }) {
  const viewBoxWidth = 11.7;
  const viewBoxHeight = 12.8667;
  const aspectRatio = viewBoxHeight / viewBoxWidth;
  return (
    <Svg width={size} height={size * aspectRatio} viewBox="0 0 11.7 12.8667" fill="none">
      <Path
        d="M3.86083 7.31417L7.845 9.63583M7.83917 3.23083L3.86083 5.5525M11.1 2.35C11.1 3.3165 10.3165 4.1 9.35 4.1C8.3835 4.1 7.6 3.3165 7.6 2.35C7.6 1.3835 8.3835 0.6 9.35 0.6C10.3165 0.6 11.1 1.3835 11.1 2.35ZM4.1 6.43333C4.1 7.39983 3.3165 8.18333 2.35 8.18333C1.3835 8.18333 0.6 7.39983 0.6 6.43333C0.6 5.46683 1.3835 4.68333 2.35 4.68333C3.3165 4.68333 4.1 5.46683 4.1 6.43333ZM11.1 10.5167C11.1 11.4832 10.3165 12.2667 9.35 12.2667C8.3835 12.2667 7.6 11.4832 7.6 10.5167C7.6 9.55017 8.3835 8.76667 9.35 8.76667C10.3165 8.76667 11.1 9.55017 11.1 10.5167Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Loader Icon - Figma exact SVG
export function LoaderIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13.0667 13.0667" fill="none">
      <Path
        d="M6.53333 0.7V3.03333M6.53333 10.0333V12.3667M2.40917 2.40917L4.06 4.06M9.00667 9.00667L10.6575 10.6575M0.7 6.53333H3.03333M10.0333 6.53333H12.3667M2.40917 10.6575L4.06 9.00667M9.00667 4.06L10.6575 2.40917"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Tab Bar Icons

// Home Tab Icon
export function HomeIcon({ size = 24, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12H15V22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Calendar Tab Icon
export function CalendarIcon({ size = 24, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

// Chat Tab Icon
export function ChatIcon({ size = 24, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// User/Profile Tab Icon
export function UserIcon({ size = 24, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
      <Path
        d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Compass/Explore Icon - for bottom tab bar
export function CompassIcon({ size = 24, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Clock Icon - for search history
export function ClockIcon({ size = 16, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Path
        d="M12 7V12L15 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Close Icon - small X for delete buttons
export function CloseIcon({ size = 16, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Map Pin Icon - for search result items
export function MapPinIcon({ size = 16, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

// Arrow Back Icon - for navigation back
export function ArrowBackIcon({ size = 24, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Plus Icon - for add/create actions
export function PlusIcon({ size = 24, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Dollar Sign Icon - for payment-related messages
export function DollarSignIcon({ size = 16, color = '#FFB800' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M12 6V18M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17C10.34 17 9 15.88 9 14.5"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Send Arrow Icon - green circle with up arrow for chat send button
export function SendArrowIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="16" fill="#34C759" />
      <Path
        d="M16 22V10M16 10L11 15M16 10L21 15"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Gift Icon - for ticket gift/transfer bubble
export function GiftIcon({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="4" rx="1" stroke={color} strokeWidth={2} />
      <Path d="M12 8V21" stroke={color} strokeWidth={2} />
      <Path d="M3 12H21V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12Z" stroke={color} strokeWidth={2} />
      <Path
        d="M12 8C12 8 12 5 9.5 4C7 3 7 5 7.5 6C8 7 12 8 12 8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8C12 8 12 5 14.5 4C17 3 17 5 16.5 6C16 7 12 8 12 8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Ticket Icon - for ticket-related messages
export function TicketIcon({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 9V6C2 5.44772 2.44772 5 3 5H21C21.5523 5 22 5.44772 22 6V9C20.8954 9 20 9.89543 20 11C20 12.1046 20.8954 13 22 13V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V15C3.10457 15 4 14.1046 4 13C4 11.8954 3.10457 11 2 11V9Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 5V19" stroke={color} strokeWidth={2} strokeDasharray="2 2" />
    </Svg>
  );
}

// Trash Icon - for swipe-to-delete in split modal
export function TrashIcon({ size = 20, color = '#FF3B30' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H5H21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Chevron Right Icon - for navigation arrows in lists
export function ChevronRightIcon({ size = 20, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Clipboard List Icon - for payment request/completed bubbles
export function ClipboardListIcon({ size = 20, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12H15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M9 16H13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Arrow Right Icon - for transfer ticket list items
export function ArrowRightIcon({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Bell/Notification Icon - for header
export function BellIcon({ size = 24, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Edit Pencil Icon - small edit icon for profile
export function EditPencilIcon({ size = 12, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Chevron Down Icon - for expand/collapse
export function ChevronDownIcon({ size = 20, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Check Icon - checkmark for status
export function CheckIcon({ size = 16, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Alert Triangle Icon - for no-show status
export function AlertTriangleIcon({ size = 24, color = '#FF383C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// Arrow Up Circle Icon - for upload actions
export function ArrowUpCircleIcon({ size = 75, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 75 75" fill="none">
      <Circle cx="37.5" cy="37.5" r="35" stroke={color} strokeWidth={2} />
      <Path
        d="M37.5 50V25M37.5 25L27.5 35M37.5 25L47.5 35"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// QR Code Icon
export function QRCodeIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.5} />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth={1.5} />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth={1.5} />
      <Rect x="5.5" y="5.5" width="2" height="2" rx={0.5} fill={color} />
      <Rect x="16.5" y="5.5" width="2" height="2" rx={0.5} fill={color} />
      <Rect x="5.5" y="16.5" width="2" height="2" rx={0.5} fill={color} />
      <Path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" fill={color} />
    </Svg>
  );
}

// Exit/Leave Icon (arrow exiting a box)
export function ExitIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Plus Circle Icon
export function PlusCircleIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// Gear/Settings Icon
export function GearIcon({ size = 24, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Upload Icon (arrow up from tray)
export function UploadIcon({ size = 24, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
