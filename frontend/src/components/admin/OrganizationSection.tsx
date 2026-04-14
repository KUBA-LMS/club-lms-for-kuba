import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors, font } from '../../constants';
import { ChevronRightIcon } from '../icons';
import Avatar from '../common/Avatar';
import { resolveImageUrl } from '../../utils/image';
import { AdminOrganization, SubgroupCard } from '../../services/adminHub';

interface OrganizationSectionProps {
  orgData: AdminOrganization | null;
  orgLoading: boolean;
  selectedClubId: string;
  onSubgroupPress: (subgroupId: string, subgroupName: string) => void;
}

export default function OrganizationSection({
  orgData,
  orgLoading,
  selectedClubId,
  onSubgroupPress,
}: OrganizationSectionProps) {
  if (orgLoading || !orgData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <>
      {/* My Profile Card */}
      <View style={styles.orgProfileCard}>
        {/* Top row: label + badges */}
        <View style={styles.orgProfileTopRow}>
          <Text style={styles.orgProfileLabel}>My Profile:</Text>
          <View style={styles.orgBadges}>
            <View style={styles.orgBadge}>
              <Text style={styles.orgBadgeText}>
                Supervisor: {orgData.supervisor_names.length > 0
                  ? orgData.supervisor_names.join(', ')
                  : 'None'}
              </Text>
            </View>
            <View style={styles.orgBadgeLead}>
              <Text style={styles.orgBadgeText}>
                Lead: {orgData.lead_name || 'None'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom row: avatar + username | separator | legal info */}
        <View style={styles.orgProfileRow}>
          <Avatar
            uri={orgData.my_profile.profile_image}
            size={50}
            name={orgData.my_profile.username}
          />
          <Text style={styles.orgUsername}>{orgData.my_profile.username}</Text>
          <View style={styles.orgProfileSeparator} />
          <View style={styles.orgLegalInfo}>
            {orgData.my_profile.legal_name && (
              <Text style={styles.orgLegalName}>{orgData.my_profile.legal_name}</Text>
            )}
            {orgData.my_profile.student_id && (
              <Text style={styles.orgStudentId}>#{orgData.my_profile.student_id}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{orgData.stats.subgroups}</Text>
          <Text style={styles.statLabel}>Subgroups</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{orgData.stats.admins}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{orgData.stats.normal_users}</Text>
          <Text style={styles.statLabel}>Normal Users</Text>
        </View>
      </View>

      {/* Subgroup Cards */}
      {orgData.subgroups.map((sg: SubgroupCard) => (
        <TouchableOpacity
          key={sg.id}
          style={styles.subgroupCard}
          onPress={() => onSubgroupPress(sg.id, sg.name)}
          activeOpacity={0.7}
        >
          {/* Arrow at top-right */}
          <View style={styles.subgroupArrowWrap}>
            <ChevronRightIcon size={16} color={colors.gray500} />
          </View>
          <View style={styles.subgroupCardRow}>
            {/* Logo */}
            {sg.logo_image ? (
              <Image source={{ uri: resolveImageUrl(sg.logo_image)! }} style={styles.subgroupLogo} />
            ) : (
              <View style={[styles.subgroupLogo, styles.subgroupLogoPlaceholder]}>
                <Text style={styles.subgroupLogoText}>{sg.name.charAt(0)}</Text>
              </View>
            )}

            {/* Name + Members */}
            <View style={styles.subgroupCardInfo}>
              <Text style={styles.subgroupCardName}>{sg.name}</Text>
              <Text style={styles.subgroupCardMembers}>
                {sg.member_count} ({sg.admin_count}+{sg.normal_count}) Members
              </Text>
            </View>

            {/* Separator */}
            <View style={styles.subgroupCardSeparator} />

            {/* Leads */}
            <View style={styles.subgroupLeadCol}>
              {sg.leads.length > 0 ? (
                <>
                  <Text style={styles.leadNames}>
                    {sg.leads.map((l) => l.username).join(', ')}
                  </Text>
                  <View style={styles.subgroupLeadRow}>
                    {sg.leads.map((lead) =>
                      lead.profile_image ? (
                        <Image
                          key={lead.id}
                          source={{ uri: resolveImageUrl(lead.profile_image)! }}
                          style={styles.leadAvatar}
                        />
                      ) : (
                        <View key={lead.id} style={[styles.leadAvatar, styles.leadAvatarPlaceholder]}>
                          <Text style={styles.leadAvatarText}>{lead.username.charAt(0)}</Text>
                        </View>
                      ),
                    )}
                    <View style={styles.leadBadge}>
                      <Text style={styles.leadBadgeText}>Lead</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.leadNames}>No Lead</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  orgProfileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  orgProfileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orgProfileLabel: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.gray500,
  },
  orgBadges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orgBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orgBadgeLead: {
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orgBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  orgProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgUsername: {
    fontFamily: font.bold,
    fontSize: 17,
    color: '#1C1C1E',
    marginLeft: 10,
  },
  orgProfileSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: colors.gray100,
    marginHorizontal: 12,
  },
  orgLegalInfo: {
    flex: 1,
  },
  orgLegalName: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#1C1C1E',
  },
  orgStudentId: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: font.bold,
    fontSize: 20,
    color: '#1C1C1E',
  },
  statLabel: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  subgroupCard: {
    position: 'relative',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  subgroupArrowWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  subgroupCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subgroupLogo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray100,
  },
  subgroupLogoPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subgroupLogoText: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.gray500,
  },
  subgroupCardInfo: {
    marginLeft: 10,
  },
  subgroupCardName: {
    fontFamily: font.bold,
    fontSize: 20,
    color: '#1C1C1E',
  },
  subgroupCardMembers: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginTop: 2,
  },
  subgroupCardSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: colors.gray100,
    marginHorizontal: 12,
  },
  subgroupLeadCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  subgroupLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  leadAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  leadAvatarPlaceholder: {
    backgroundColor: '#E8E8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.gray500,
  },
  leadNames: {
    fontFamily: font.regular,
    fontSize: 11,
    color: '#1C1C1E',
  },
  leadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leadBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
});
