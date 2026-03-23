import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, font } from '../../constants';
import { SearchIcon, CheckIcon } from '../icons';
import { AdminTask, AdminTaskListResponse } from '../../services/adminHub';

interface TaskListSectionProps {
  taskData: AdminTaskListResponse | null;
  tasksLoading: boolean;
  taskSearch: string;
  onTaskSearchChange: (text: string) => void;
  onSubmitSearch: () => void;
  onApprove: (registrationId: string) => void;
  onDecline: (registrationId: string) => void;
  onViewDetails: (eventId: string) => void;
}

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatRelativeDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimeout = (seconds: number) => {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function TaskCard({
  task,
  isCurrent,
  onApprove,
  onViewDetails,
}: {
  task: AdminTask;
  isCurrent: boolean;
  onApprove: (registrationId: string) => void;
  onViewDetails: (eventId: string) => void;
}) {
  return (
    <View key={task.registration_id} style={styles.taskCard}>
      <View style={styles.taskRow}>
        {/* Left: text content */}
        <View style={styles.taskLeftCol}>
          <Text style={styles.taskText}>
            <Text style={styles.taskUsername}>{task.user.username}</Text>
            {' requested registration for:'}
          </Text>
          <Text style={styles.taskEventTitle}>
            {task.event.title}({formatEventDate(task.event.event_date)})
          </Text>
          <View style={styles.taskBadgeRow}>
            <View
              style={[
                styles.eventBadge,
                task.event.event_type === 'official' ? styles.badgeOfficial : styles.badgePrivate,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {task.event.event_type === 'official' ? 'Official' : 'Private'}
              </Text>
            </View>
            <View
              style={[
                styles.eventBadge,
                task.event.cost_type === 'free'
                  ? styles.badgeFree
                  : task.event.cost_type === 'one_n'
                    ? styles.badgeOneN
                    : styles.badgePaid,
              ]}
            >
              <Text style={styles.eventBadgeText}>
                {task.event.cost_type === 'free'
                  ? 'Free'
                  : task.event.cost_type === 'one_n'
                    ? '1/N'
                    : 'Prepaid'}
              </Text>
            </View>
          </View>
          <Text style={styles.taskTimeout}>
            Timeout : {formatTimeout(task.timeout_seconds)}
          </Text>
        </View>

        {/* Separator */}
        <View style={styles.taskSeparator} />

        {/* Right: date + action + details */}
        <View style={styles.taskRightCol}>
          <Text style={styles.taskRelDate}>
            {formatRelativeDate(task.created_at)}
          </Text>
          {isCurrent ? (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => onApprove(task.registration_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          ) : task.status === 'confirmed' ? (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedBadgeText}>Approved</Text>
              <CheckIcon size={12} color={colors.white} />
            </View>
          ) : (
            <View style={styles.declinedBadge}>
              <Text style={styles.declinedBadgeText}>Declined</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.detailsLink}
            onPress={() => onViewDetails(task.event.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLinkText}>details {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function TaskListSection({
  taskData,
  tasksLoading,
  taskSearch,
  onTaskSearchChange,
  onSubmitSearch,
  onApprove,
  onDecline,
  onViewDetails,
}: TaskListSectionProps) {
  if (tasksLoading || !taskData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.taskSearchContainer}>
        <TextInput
          style={styles.taskSearchInput}
          value={taskSearch}
          onChangeText={onTaskSearchChange}
          onSubmitEditing={onSubmitSearch}
          placeholder="Enter Username or Event Name"
          placeholderTextColor={colors.gray300}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {taskSearch ? (
          <TouchableOpacity
            onPress={() => onTaskSearchChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearButton}>{'\u2715'}</Text>
          </TouchableOpacity>
        ) : (
          <SearchIcon size={18} color={colors.gray500} />
        )}
      </View>

      {taskData.current.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Current Tasks</Text>
          {taskData.current.map((t) => (
            <TaskCard
              key={t.registration_id}
              task={t}
              isCurrent={true}
              onApprove={onApprove}
              onViewDetails={onViewDetails}
            />
          ))}
        </>
      )}
      {taskData.history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>History</Text>
          {taskData.history.map((t) => (
            <TaskCard
              key={t.registration_id}
              task={t}
              isCurrent={false}
              onApprove={onApprove}
              onViewDetails={onViewDetails}
            />
          ))}
        </>
      )}
      {taskData.current.length === 0 && taskData.history.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tasks found</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.gray500,
  },
  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  taskSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  taskSearchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    color: '#1C1C1E',
    padding: 0,
  },
  clearButton: {
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.gray500,
    paddingHorizontal: 4,
  },
  taskCard: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  taskRow: {
    flexDirection: 'row',
  },
  taskLeftCol: {
    flex: 1,
  },
  taskText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#1C1C1E',
  },
  taskUsername: {
    fontFamily: font.bold,
  },
  taskEventTitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: '#1C1C1E',
    marginTop: 2,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  eventBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOfficial: {
    backgroundColor: '#1C1C1E',
  },
  badgePrivate: {
    backgroundColor: colors.success,
  },
  badgeFree: {
    backgroundColor: colors.success,
  },
  badgeOneN: {
    backgroundColor: colors.primary,
  },
  badgePaid: {
    backgroundColor: '#FF69B4',
  },
  eventBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.white,
  },
  taskTimeout: {
    fontFamily: font.regular,
    fontSize: 12,
    color: '#FF383C',
    marginTop: 4,
  },
  taskSeparator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.gray100,
    marginHorizontal: 10,
  },
  taskRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 90,
  },
  taskRelDate: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
    marginBottom: 6,
  },
  approveButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  approveButtonText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: colors.white,
  },
  detailsLink: {
    marginTop: 6,
  },
  detailsLinkText: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.gray500,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approvedBadgeText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: colors.white,
  },
  declinedBadge: {
    borderWidth: 1,
    borderColor: '#FF383C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  declinedBadgeText: {
    fontFamily: font.bold,
    fontSize: 12,
    color: '#FF383C',
  },
});
