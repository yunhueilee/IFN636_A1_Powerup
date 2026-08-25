import React, { ReactNode } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FitnessClass } from '../../types';
import ClassCard from './ClassCard';
import { EmptyState } from '../common/StateViews';

interface ClassListProps {
  classes: FitnessClass[];
  emptyMessage: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  canBook?: boolean;
  processingClassId?: string | null;
  onBook?: (classId: string) => void;
  onCancel?: (classId: string) => void;
  onViewMembers?: (fitnessClass: FitnessClass) => void;
  onEdit?: (fitnessClass: FitnessClass) => void;
  onCancelClass?: (fitnessClass: FitnessClass) => void;
  editingClassId?: string | null;
  listHeader?: ReactNode;
  expandedClassId?: string | null;
  expandedContent?: ReactNode;
}

const ClassList = ({
  classes,
  emptyMessage,
  refreshing = false,
  onRefresh,
  canBook = false,
  processingClassId = null,
  onBook,
  onCancel,
  onViewMembers,
  onEdit,
  onCancelClass,
  editingClassId = null,
  listHeader,
  expandedClassId = null,
  expandedContent,
}: ClassListProps) => (
  <FlatList
    data={classes}
    keyExtractor={(item) => item._id}
    renderItem={({ item }) => (
      <React.Fragment>
        <ClassCard
          fitnessClass={item}
          canBook={canBook}
          isProcessing={processingClassId === item._id}
          onBook={() => onBook?.(item._id)}
          onCancel={() => onCancel?.(item._id)}
          onViewMembers={onViewMembers ? () => onViewMembers(item) : undefined}
          onEdit={onEdit ? () => onEdit(item) : undefined}
          onCancelClass={onCancelClass ? () => onCancelClass(item) : undefined}
          isEditing={editingClassId === item._id}
        />
        {expandedClassId === item._id && expandedContent}
      </React.Fragment>
    )}
    contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
    ListHeaderComponent={listHeader ? <>{listHeader}</> : undefined}
    ListEmptyComponent={<EmptyState message={emptyMessage} />}
    refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
  />
);

export default ClassList;
