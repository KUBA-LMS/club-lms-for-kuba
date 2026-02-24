import React, { useState, useCallback, useRef } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
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
import { SearchIcon, ArrowUpCircleIcon, CheckIcon } from "../../components/icons";
import AddressSearchBottomSheet from "../../components/admin/AddressSearchBottomSheet";
import { listEvents } from "../../services/events";
import { EventWithStatus } from "../../types/event";

type NavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "AdminCreateEvent"
>;

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
          placeholderTextColor="#1E1E1E"
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
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    event_type: undefined,
    cost_type: undefined,
  });

  const mapRef = useRef<NaverMapViewRef>(null);

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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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

  const handleNext = useCallback(async () => {
    // Validate required fields
    if (!formData.title) {
      Alert.alert("Error", "Please enter event name");
      return;
    }
    if (!formData.event_date) {
      Alert.alert("Error", "Please select event date");
      return;
    }
    if (!formData.event_type) {
      Alert.alert("Error", "Please select event type");
      return;
    }
    if (!formData.cost_type) {
      Alert.alert("Error", "Please select cost type");
      return;
    }
    if (!formData.registration_start || !formData.registration_end) {
      Alert.alert("Error", "Please set registration period");
      return;
    }
    if (!formData.max_slots) {
      Alert.alert("Error", "Please enter number of spots");
      return;
    }
    if (!formData.club_id) {
      Alert.alert("Error", "Please select provider");
      return;
    }

    // Navigate to poster upload
    navigation.navigate("AdminUploadPoster", { eventData: formData });
  }, [formData, navigation]);

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
          <Text style={styles.backButtonText}>{"<"}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Poster Upload Card */}
        <View
          style={[styles.posterCardWrapper, { marginTop: insets.top + 60 }]}
        >
          {/* Main Image Selector - Square thumbnail upload */}
          <TouchableOpacity
            style={styles.mainImageBox}
            onPress={handlePickMainImage}
          >
            {mainImageUri ? (
              <>
                <Image
                  source={{ uri: mainImageUri }}
                  style={styles.mainImagePreview}
                />
                <View style={styles.mainBadgeOverlay}>
                  <Text style={styles.mainBadgeText}>main</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>main</Text>
                </View>
                <Text style={styles.mainImagePlus}>+</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Poster Card */}
          <View style={styles.posterCard}>
            <TouchableOpacity
              style={styles.posterCardInner}
              onPress={() =>
                navigation.navigate("AdminUploadPoster", {
                  eventData: formData,
                })
              }
            >
              <ArrowUpCircleIcon size={75} color="#000000" />
              <Text style={styles.posterCardText}>Upload Poster(Ticket)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={[
            styles.formContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Event Name */}
          <FormInput
            label="Enter Event Name"
            value={formData.title || ""}
            onChangeText={(text) => updateFormData("title", text)}
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
              value={formData.cost_amount?.toString() || ""}
              onChangeText={(text) =>
                updateFormData("cost_amount", parseInt(text) || undefined)
              }
              keyboardType="numeric"
              rightIcon={<Text style={styles.currencyText}>KRW</Text>}
            />
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
                  placeholderTextColor="#1E1E1E"
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

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
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
  backButtonText: {
    fontSize: 28,
    color: "#000000",
    fontWeight: "300",
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
    fontFamily: "OpenSans-SemiBold",
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
  },
  mainImageBox: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#C5C5C5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  mainImagePlus: {
    fontSize: 32,
    color: "#000000",
    fontWeight: "300",
    marginTop: 4,
  },
  mainImagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  mainBadgeOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  posterCard: {
    width: 250,
    height: 324,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#C5C5C5",
  },
  posterCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  posterCardText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    color: "#000000",
    marginTop: 16,
  },
  formContainer: {
    flex: 1,
    marginTop: 20,
  },
  formContent: {
    paddingHorizontal: screenPadding.horizontal,
    gap: 10,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C5C5C5",
    paddingHorizontal: 14,
    height: 42,
    justifyContent: "center",
  },
  multilineContainer: {
    minHeight: 100,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 15,
    color: "#1E1E1E",
    flex: 1,
  },
  placeholderText: {
    color: "#1E1E1E",
  },
  textInput: {
    fontFamily: "OpenSans-Regular",
    fontSize: 15,
    color: "#1E1E1E",
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
    fontFamily: "OpenSans-Regular",
    fontSize: 15,
    color: "#8E8E93",
  },
  nextButton: {
    backgroundColor: "#000000",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  nextButtonText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  relatedContainer: {
    zIndex: 10,
  },
  clearIcon: {
    fontFamily: "OpenSans-Bold",
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
    fontFamily: "OpenSans-Regular",
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
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    color: "#1E1E1E",
    flex: 1,
    marginRight: 8,
  },
  relatedDropdownItemTextSelected: {
    fontFamily: "OpenSans-Bold",
    color: "#3B82F6",
  },
});
