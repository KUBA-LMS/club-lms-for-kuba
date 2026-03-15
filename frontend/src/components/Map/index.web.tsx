import React from "react";
import { View, Text } from "react-native";

export const NaverMapMarkerOverlay = (_props: any) => null;
export type NaverMapViewRef = any;

export const NaverMapView = (props: any) => {
  return (
    <View
      style={[
        props.style,
        {
          backgroundColor: "#e0e0e0",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ color: "#666", fontFamily: "Inter-Regular" }}>
        Naver Map is only available on iOS/Android.
      </Text>
    </View>
  );
};
