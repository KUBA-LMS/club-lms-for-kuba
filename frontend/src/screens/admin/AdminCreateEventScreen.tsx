import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NaverMapView, NaverMapMarkerOverlay, NaverMapViewRef } from "../../components/Map";
import MapPin from "../../components/Map/MapPin";
import { LinearGradient } from "expo-linear-gradient";
import { MainStackParamList, EventFormData } from "../../navigation/types";
import { screenPadding } from "../../constants";
import DatePickerBottomSheet from "../../components/admin/DatePickerBottomSheet";
import TypeSelectorBottomSheet from "../../components/admin/TypeSelectorBottomSheet";
import RegistrationPeriodBottomSheet from "../../components/admin/RegistrationPeriodBottomSheet";
import ProviderSelectorBottomSheet from "../../components/admin/ProviderSelectorBottomSheet";
import PostVisibilityBottomSheet from "../../components/admin/PostVisibilityBottomSheet";
import { SearchIcon, ArrowUpCircleIcon, CheckIcon, ArrowBackIcon } from "../../components/icons";
import AddressSearchBottomSheet from "../../components/admin/AddressSearchBottomSheet";
import { listEvents } from "../../services/events";
import { EventWithStatus } from "../../types/event";
import api from "../../services/api";
import { uploadImage } from "../../services/upload";

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "AdminCreateEvent"
>;
type RoutePropType = RouteProp<MainStackParamList, "AdminCreateEvent">;

// Form input component
interface FormInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: "default" | "numeric";
  rightIcon?: React.ReactNode;
  multiline?: boolean;
}

function FormInput({
  label,
  value,
  onChangeText,
  onPress,
  placeholder,
  editable = true,
  keyboardType = "default",
  rightIcon,
  multiline = false,
}: FormInputProps) {
  const inputRef = useRef<TextInput>(null);

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.inputRow}>
          <Text style={[styles.inputText, !value && styles.placeholderText]}>
            {value || placeholder || label}
          </Text>
          {rightIcon}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.inputContainer, multiline && styles.multilineContainer]}
      onPress={() => inputRef.current?.focus()}
      activeOpacity={0.9}
    >
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor="#AEAEB2"
          editable={editable}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
        {rightIcon}
      </View>
    </TouchableOpacity>
  );
}

export default function AdminCreateEventScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const eventId = (route.params as any)?.eventId as string | undefined;
  const isEditMode = !!eventId;
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    event_type: undefined,
    cost_type: undefined,
  });
  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);

  const mapRef = useRef<NaverMapViewRef>(null);

  // Load existing event data when in edit mode
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        const ev = res.data;
        setFormData({
          title: ev.title || '',
          description: ev.description || '',
          event_type: ev.event_type,
          cost_type: ev.cost_type,
          cost_amount: ev.cost_amount ? Number(ev.cost_amount) : undefined,
          bank_name: ev.bank_name || undefined,
          bank_account_number: ev.bank_account_number || undefined,
          account_holder_name: ev.account_holder_name || undefined,
          event_date: ev.event_date ? new Date(ev.event_date) : undefined,
          registration_start: ev.registration_start ? new Date(ev.registration_start) : undefined,
          registration_end: ev.registration_end ? new Date(ev.registration_end) : undefined,
          event_location: ev.event_location || undefined,
          latitude: ev.latitude ?? undefined,
          longitude: ev.longitude ?? undefined,
          max_slots: ev.max_slots,
          club_id: ev.club?.id,
          visibility_type: ev.visibility_type || undefined,
          visibility_club_id: ev.visibility_club_id || undefined,
          related_event_id: ev.related_event_id || undefined,
        });
        if (ev.club?.name) setProviderName(ev.club.name);
        if (ev.visibility_type === 'friends_only') {
          setVisibilityName('Only to my friends');
        } else if (ev.visibility_type === 'club' && ev.visibility_club_id) {
          setVisibilityName(ev.club?.name || 'Club');
        }
        if (ev.related_event_id) {
          try {
            const relRes = await api.get(`/events/${ev.related_event_id}`);
            const relTitle = relRes.data.title || '';
            setSelectedRelatedEvent({ id: ev.related_event_id, title: relTitle });
            setRelatedSearchText(relTitle);
          } catch {
            // related event fetch failed, leave blank
          }
        }
        if (ev.images?.length > 0) setMainImageUri(ev.images[0]);
        if (ev.images?.length > 1) setPosterUri(ev.images[1]);
        if (ev.latitude != null && ev.longitude != null) {
          setTimeout(() => {
            mapRef.current?.animateCameraTo({
              latitude: ev.latitude,
              longitude: ev.longitude,
              duration: 300,
            });
          }, 500);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load event data');
      } finally {
        setIsLoadingEvent(false);
      }
    })();
  }, [eventId]);

  // Bottom sheet visibility
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showCostTypePicker, setShowCostTypePicker] = useState(false);
  const [showRegistrationPeriod, setShowRegistrationPeriod] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [showPostVisibility, setShowPostVisibility] = useState(false);

  // Provider/visibility display names
  const [providerName, setProviderName] = useState('');
  const [visibilityName, setVisibilityName] = useState('');

  // Main image state
  const [mainImageUri, setMainImageUri] = useState<string | null>(null);

  const handlePickMainImage = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library.",
      );
      return;
    }

    // Event main image displays full-bleed in the feed — let the user pick
    // any aspect and crop freely. Do not lock to [1,1].
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setMainImageUri(result.assets[0].uri);
    }
  }, []);

  const updateFormData = useCallback((key: keyof EventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Related events search
  const [relatedSearchText, setRelatedSearchText] = useState("");
  const [relatedSearchResults, setRelatedSearchResults] = useState<EventWithStatus[]>([]);
  const [relatedSearchLoading, setRelatedSearchLoading] = useState(false);
  const [showRelatedDropdown, setShowRelatedDropdown] = useState(false);
  const [selectedRelatedEvent, setSelectedRelatedEvent] = useState<{ id: string; title: string } | null>(null);
  const relatedSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relatedInputRef = useRef<TextInput>(null);

  const fetchRelatedEvents = useCallback(async (searchText: string) => {
    setRelatedSearchLoading(true);
    try {
      const params: { filter: "all"; search?: string; limit: number } = { filter: "all", limit: 10 };
      if (searchText.trim()) params.search = searchText.trim();
      const res = await listEvents(params);
      setRelatedSearchResults(res.data);
    } catch (err) {
      console.error("Failed to fetch related events:", err);
      setRelatedSearchResults([]);
    } finally {
      setRelatedSearchLoading(false);
    }
  }, []);

  const handleRelatedSearchChange = useCallback((text: string) => {
    setRelatedSearchText(text);
    setSelectedRelatedEvent(null);
    updateFormData("related_event_id", undefined);
    setShowRelatedDropdown(true);

    if (relatedSearchTimer.current) clearTimeout(relatedSearchTimer.current);
    relatedSearchTimer.current = setTimeout(() => fetchRelatedEvents(text), 300);
  }, [updateFormData, fetchRelatedEvents]);

  const handleSelectRelatedEvent = useCallback((event: EventWithStatus) => {
    setSelectedRelatedEvent({ id: event.id, title: event.title });
    setRelatedSearchText(event.title);
    updateFormData("related_event_id", event.id);
    setShowRelatedDropdown(false);
    relatedInputRef.current?.blur();
  }, [updateFormData]);

  const handleRelatedInputFocus = useCallback(() => {
    setShowRelatedDropdown(true);
    fetchRelatedEvents(relatedSearchText);
  }, [relatedSearchText, fetchRelatedEvents]);

  const handleClearRelatedEvent = useCallback(() => {
    setSelectedRelatedEvent(null);
    setRelatedSearchText("");
    updateFormData("related_event_id", undefined);
    setShowRelatedDropdown(false);
  }, [updateFormData]);

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRegistrationPeriod = () => {
    if (!formData.registration_start || !formData.registration_end) return "";
    const start = formData.registration_start;
    const end = formData.registration_end;
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  };

  const getEventTypeLabel = () => {
    if (!formData.event_type) return "";
    return formData.event_type === "official" ? "Official" : "Private";
  };

  const getCostTypeLabel = () => {
    if (!formData.cost_type) return "";
    switch (formData.cost_type) {
      case "free":
        return "Free";
      case "prepaid":
        return "Prepaid";
      case "one_n":
        return "1/N";
      default:
        return "";
    }
  };

  const handleCreateEvent = useCallback(async () => {
    if (!formData.title) { Alert.alert("Error", "Please enter event name"); return; }
    if (!formData.event_date) { Alert.alert("Error", "Please select event date"); return; }
    if (!formData.event_type) { Alert.alert("Error", "Please select event type"); return; }
    if (!formData.cost_type) { Alert.alert("Error", "Please select cost type"); return; }
    if (!formData.registration_start || !formData.registration_end) {
      Alert.alert("Error", "Please set registration period"); return;
    }
    if (!formData.max_slots) { Alert.alert("Error", "Please enter number of spots"); return; }
    if (!isEditMode && !formData.club_id) { Alert.alert("Error", "Please select provider"); return; }

    const toIso = (d: any): string | undefined => {
      if (!d) return undefined;
      if (typeof d === "string") return d;
      if (d instanceof Date) return d.toISOString();
      return undefined;
    };

    setIsSubmitting(true);
    try {
      const toUpload = async (uri: string | null) => {
        if (!uri) return null;
        if (uri.startsWith('file://') || uri.startsWith('ph://')) {
          return await uploadImage(uri);
        }
        return uri;
      };

      const [uploadedMainImage, uploadedPoster] = await Promise.all([
        toUpload(mainImageUri),
        toUpload(posterUri),
      ]);

      const images: string[] = [];
      if (uploadedMainImage) images.push(uploadedMainImage);
      if (uploadedPoster) images.push(uploadedPoster);

      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description || "",
        images,
        event_type: formData.event_type,
        cost_type: formData.cost_type,
        cost_amount: formData.cost_amount ?? null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        account_holder_name: formData.account_holder_name || null,
        registration_start: toIso(formData.registration_start),
        registration_end: toIso(formData.registration_end),
        event_date: toIso(formData.event_date),
        event_location: formData.event_location || null,
        max_slots: formData.max_slots,
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        visibility_type: formData.visibility_type || null,
        visibility_club_id: formData.visibility_club_id || null,
        related_event_id: formData.related_event_id || null,
      };

      if (isEditMode) {
        await api.put(`/events/${eventId}`, payload);
        Alert.alert("Success", "Event updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        payload.club_id = formData.club_id;
        await api.post("/events/", payload);
        Alert.alert("Success", "Event created successfully!", [
          { text: "OK", onPress: () => navigation.popToTop() },
        ]);
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let msg = isEditMode ? "Failed to update event" : "Failed to create event";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((e: any) => `${e.loc?.slice(-1)[0] ?? ""}: ${e.msg}`).join("\n");
      }
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, posterUri, mainImageUri, isEditMode, eventId, navigation]);

  if (isLoadingEvent) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1C1C1E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{
            latitude: formData.latitude || 37.5866076,
            longitude: formData.longitude || 127.0291003,
            zoom: 15,
          }}
          isShowLocationButton={false}
          isShowZoomControls={false}
          isShowCompass={false}
          isShowScaleBar={false}
        >
          {formData.latitude != null && formData.longitude != null && (
            <NaverMapMarkerOverlay
              latitude={formData.latitude}
              longitude={formData.longitude}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapPin status="open" />
            </NaverMapMarkerOverlay>
          )}
        </NaverMapView>
      </View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.9)", "rgba(255,255,255,1)"]}
        locations={[0, 0.3, 0.5]}
        style={styles.gradientOverlay}
      />

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Poster Upload Card */}
          <View style={[styles.posterCardWrapper, { marginTop: insets.top + 60 }]}>
            {/* Main Image Selector - Square thumbnail upload */}
            <TouchableOpacity
              style={styles.mainImageBox}
              onPress={handlePickMainImage}
            >
              {mainImageUri ? (
                <Image
                  source={{ uri: mainImageUri }}
                  style={styles.mainImagePreview}
                />
              ) : (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#C5C5C5" strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
              )}
            </TouchableOpacity>

            {/* Poster Card */}
            <TouchableOpacity
              style={styles.posterCard}
              onPress={() => navigation.navigate("AdminUploadPoster", {
                  onPosterSelected: (uri) => setPosterUri(uri || null),
                })}
              activeOpacity={0.85}
            >
              {posterUri ? (
                <>
                  <Image source={{ uri: posterUri }} style={styles.posterCardImage} resizeMode="cover" />
                  <View style={styles.posterCardOverlay}>
                    <Text style={styles.posterCardOverlayText}>Tap to change</Text>
                  </View>
                </>
              ) : (
                <View style={styles.posterCardInner}>
                  <ArrowUpCircleIcon size={48} color="#C5C5C5" />
                  <Text style={styles.posterCardText}>Upload Poster / Ticket</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* Event Name */}
          <FormInput
            label="Enter Event Name"
            value={formData.title || ""}
            onChangeText={(text) => updateFormData("title", text)}
          />

          {/* Description */}
          <FormInput
            label="Enter Description (optional)"
            value={formData.description || ""}
            onChangeText={(text) => updateFormData("description", text)}
            multiline
          />

          {/* Event Date */}
          <FormInput
            label="Enter Event Date"
            value={formatDate(formData.event_date)}
            onPress={() => setShowDatePicker(true)}
          />

          {/* Event Location */}
          <FormInput
            label="Enter Event Location"
            value={formData.event_location || ""}
            onPress={() => setShowAddressSearch(true)}
            rightIcon={<SearchIcon size={14} color="#1E1E1E" />}
          />

          {/* Event Type */}
          <FormInput
            label="Select Event Type"
            value={getEventTypeLabel()}
            onPress={() => setShowEventTypePicker(true)}
          />

          {/* Cost Type */}
          <FormInput
            label="Select Cost Type"
            value={getCostTypeLabel()}
            onPress={() => setShowCostTypePicker(true)}
          />

          {/* Price input (shown when prepaid or 1/N is selected) */}
          {(formData.cost_type === "prepaid" ||
            formData.cost_type === "one_n") && (
            <FormInput
              label="Enter Price"
              value={formData.cost_amount != null ? formData.cost_amount.toLocaleString('en-US') : ""}
              onChangeText={(text) => {
                const raw = text.replace(/[^0-9]/g, '');
                updateFormData("cost_amount", parseInt(raw) || undefined);
              }}
              keyboardType="numeric"
              rightIcon={<Text style={styles.currencyText}>KRW</Text>}
            />
          )}

          {/* Bank info (shown only for prepaid) */}
          {formData.cost_type === "prepaid" && (
            <>
              <FormInput
                label="Bank Name (e.g. Kakao Bank)"
                value={formData.bank_name || ""}
                onChangeText={(text) => updateFormData("bank_name", text)}
              />
              <FormInput
                label="Account Number"
                value={formData.bank_account_number || ""}
                onChangeText={(text) => updateFormData("bank_account_number", text)}
                keyboardType="numeric"
              />
              <FormInput
                label="Account Holder Name"
                value={formData.account_holder_name || ""}
                onChangeText={(text) => updateFormData("account_holder_name", text)}
              />
            </>
          )}

          {/* Registration Period */}
          <FormInput
            label="Set Registration Period"
            value={formatRegistrationPeriod()}
            onPress={() => setShowRegistrationPeriod(true)}
          />

          {/* Number of Spots */}
          <FormInput
            label="Enter number of spots"
            value={formData.max_slots?.toString() || ""}
            onChangeText={(text) =>
              updateFormData("max_slots", parseInt(text) || undefined)
            }
            keyboardType="numeric"
            rightIcon={<Text style={styles.capacityIcon}>A</Text>}
          />

          {/* Link Related Events */}
          <View style={styles.relatedContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={relatedInputRef}
                  style={styles.textInput}
                  value={relatedSearchText}
                  onChangeText={handleRelatedSearchChange}
                  onFocus={handleRelatedInputFocus}
                  onBlur={() => {
                    // Delay to allow item press to register
                    setTimeout(() => setShowRelatedDropdown(false), 200);
                  }}
                  placeholder="Link Related Events"
                  placeholderTextColor="#AEAEB2"
                />
                {selectedRelatedEvent ? (
                  <TouchableOpacity onPress={handleClearRelatedEvent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.clearIcon}>x</Text>
                  </TouchableOpacity>
                ) : (
                  <SearchIcon size={14} color="#1E1E1E" />
                )}
              </View>
            </View>
            {showRelatedDropdown && (
              <View style={styles.relatedDropdown}>
                {relatedSearchLoading ? (
                  <ActivityIndicator size="small" color="#000" style={{ paddingVertical: 12 }} />
                ) : relatedSearchResults.length === 0 ? (
                  <Text style={styles.relatedDropdownEmpty}>No events found</Text>
                ) : (
                  <ScrollView
                    style={styles.relatedDropdownScroll}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled
                  >
                    {relatedSearchResults.map((event) => {
                      const isSelected = selectedRelatedEvent?.id === event.id;
                      return (
                        <TouchableOpacity
                          key={event.id}
                          style={[styles.relatedDropdownItem, isSelected && styles.relatedDropdownItemSelected]}
                          onPress={() => handleSelectRelatedEvent(event)}
                        >
                          <Text
                            style={[styles.relatedDropdownItemText, isSelected && styles.relatedDropdownItemTextSelected]}
                            numberOfLines={1}
                          >
                            {event.title}
                          </Text>
                          {isSelected && <CheckIcon size={14} color="#3B82F6" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Provider */}
          <FormInput
            label="Select Provider"
            value={providerName}
            onPress={() => setShowProviderSelector(true)}
          />

          {/* Post Visibility */}
          <FormInput
            label="Select Post Visibility"
            value={visibilityName}
            onPress={() => setShowPostVisibility(true)}
          />

          {/* Create / Save Event Button */}
          <TouchableOpacity
            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
            onPress={handleCreateEvent}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>
                {isEditMode ? "Save Changes" : "Create Event"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Sheets */}
      <DatePickerBottomSheet
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => {
          updateFormData("event_date", date);
          setShowDatePicker(false);
        }}
        selectedDate={formData.event_date}
      />

      <TypeSelectorBottomSheet
        visible={showEventTypePicker}
        onClose={() => setShowEventTypePicker(false)}
        onSelect={(type) => {
          updateFormData("event_type", type);
          setShowEventTypePicker(false);
        }}
        type="event"
        selectedValue={formData.event_type}
      />

      <TypeSelectorBottomSheet
        visible={showCostTypePicker}
        onClose={() => setShowCostTypePicker(false)}
        onSelect={(type) => {
          updateFormData("cost_type", type);
          if (type === "free") {
            updateFormData("cost_amount", undefined);
            setShowCostTypePicker(false);
          }
        }}
        type="cost"
        selectedValue={formData.cost_type}
        costAmount={formData.cost_amount}
        onCostAmountChange={(amount) => updateFormData("cost_amount", amount)}
      />

      <RegistrationPeriodBottomSheet
        visible={showRegistrationPeriod}
        onClose={() => setShowRegistrationPeriod(false)}
        onSelect={(start, end) => {
          updateFormData("registration_start", start);
          updateFormData("registration_end", end);
          setShowRegistrationPeriod(false);
        }}
        startDate={formData.registration_start}
        endDate={formData.registration_end}
        eventDate={formData.event_date}
      />

      <ProviderSelectorBottomSheet
        visible={showProviderSelector}
        onClose={() => setShowProviderSelector(false)}
        onSelect={(clubId, clubName) => {
          updateFormData("club_id", clubId);
          setProviderName(clubName);
          setShowProviderSelector(false);
        }}
        selectedClubId={formData.club_id}
      />

      <PostVisibilityBottomSheet
        visible={showPostVisibility}
        onClose={() => setShowPostVisibility(false)}
        onSelect={(type, clubId, clubName) => {
          updateFormData("visibility_type", type);
          updateFormData("visibility_club_id", clubId);
          if (type === 'friends_only') {
            setVisibilityName('Only to my friends');
          } else if (clubName) {
            setVisibilityName(clubName);
          }
          setShowPostVisibility(false);
        }}
        selectedType={formData.visibility_type}
        selectedClubId={formData.visibility_club_id}
      />

      <AddressSearchBottomSheet
        visible={showAddressSearch}
        onClose={() => setShowAddressSearch(false)}
        onSelect={({ address, latitude, longitude, detailAddress }) => {
          const fullAddress = detailAddress ? `${address}, ${detailAddress}` : address;
          setFormData((prev) => ({
            ...prev,
            event_location: fullAddress,
            latitude,
            longitude,
            detail_address: detailAddress,
          }));
          setShowAddressSearch(false);
          mapRef.current?.animateCameraTo({
            latitude,
            longitude,
            duration: 500,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    marginLeft: 8,
    gap: 4,
  },
  mainBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mainBadgeText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  plusButtonText: {
    fontSize: 20,
    color: "#000000",
    fontWeight: "400",
  },
  contentContainer: {
    flex: 1,
  },
  posterCardWrapper: {
    alignSelf: "center",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  mainImageBox: {
    width: 72,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  mainImagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  posterCard: {
    width: 225,
    height: 300,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D5",
    overflow: "hidden",
  },
  posterCardImage: {
    width: "100%",
    height: "100%",
  },
  posterCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
  },
  posterCardOverlayText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  posterCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  posterCardText: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: "#8E8E93",
    letterSpacing: 0.2,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 12,
  },
  inputContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 14,
    borderWidth: 0,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  multilineContainer: {
    minHeight: 110,
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: "#1C1C1E",
    flex: 1,
  },
  placeholderText: {
    color: "#AEAEB2",
  },
  textInput: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: "#1C1C1E",
    flex: 1,
    padding: 0,
  },
  multilineInput: {
    minHeight: 60,
  },
  capacityIcon: {
    fontSize: 16,
    color: "#3B82F6",
  },
  currencyText: {
    fontFamily: "Inter-Regular",
    fontSize: 15,
    color: "#8E8E93",
  },
  nextButton: {
    backgroundColor: "#1C1C1E",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  nextButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  relatedContainer: {
    zIndex: 10,
  },
  clearIcon: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: "#8E8E93",
    paddingHorizontal: 4,
  },
  relatedDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C5C5C5",
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  relatedDropdownScroll: {
    maxHeight: 180,
  },
  relatedDropdownEmpty: {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    paddingVertical: 16,
  },
  relatedDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  relatedDropdownItemSelected: {
    backgroundColor: "#F0F5FF",
  },
  relatedDropdownItemText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#1E1E1E",
    flex: 1,
    marginRight: 8,
  },
  relatedDropdownItemTextSelected: {
    fontFamily: "Inter-SemiBold",
    color: "#3B82F6",
  },
  createButton: {
    backgroundColor: "#1C1C1E",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
