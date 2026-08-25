import React, { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store';
import { cancelClass, ClassPayload, createClass, getClassMembers, getClasses, updateClass } from '../../services/api/classService';
import { ClassMember, FitnessClass } from '../../types';
import ClassList from '../../components/class/ClassList';

interface FormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
  intensity: string;
}

const emptyForm: FormState = {
  title: '', description: '', date: '', startTime: '', endTime: '', location: '', capacity: '20', intensity: '3',
};

const periods = ['AM', 'PM'];

const toForm = (fitnessClass: FitnessClass): FormState => {
  const start = new Date(fitnessClass.scheduledAt);
  const end = new Date(start.getTime() + fitnessClass.durationMinutes * 60000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    title: fitnessClass.title,
    description: fitnessClass.description,
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    endTime: end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    location: fitnessClass.location,
    capacity: String(fitnessClass.capacity),
    intensity: String(fitnessClass.intensity),
  };
};

const toDateTime = (date: string, time: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
  if (!match) return new Date(NaN);

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return new Date(NaN);
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return new Date(year, month - 1, day, hour, minute);
};

const InstructorClassManagementScreen = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<FitnessClass | null>(null);
  const [reasonClass, setReasonClass] = useState<FitnessClass | null>(null);
  const [reason, setReason] = useState('');
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [periodDropdownField, setPeriodDropdownField] = useState<'startTime' | 'endTime' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const formScrollRef = useRef<ScrollView>(null);

  const loadClasses = useCallback(async () => {
    if (!token) return;
    try { setClasses(await getClasses(token)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load classes'); }
  }, [token]);

  useFocusEffect(useCallback(() => { loadClasses(); }, [loadClasses]));

  const updateField = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const openDatePicker = () => {
    const current = form.date ? new Date(`${form.date}T12:00:00`) : new Date();
    setCalendarMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setDatePickerVisible((visible) => !visible);
  };

  const selectDate = (day: number) => {
    const selected = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const pad = (value: number) => String(value).padStart(2, '0');
    updateField('date', `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`);
    setDatePickerVisible(false);
  };

  const closeDatePicker = () => {
    setDatePickerVisible(false);
  };

  const getPeriod = (field: 'startTime' | 'endTime'): string => form[field].match(/\s(AM|PM)$/i)?.[1].toUpperCase() ?? 'AM';

  const updateManualTime = (field: 'startTime' | 'endTime', value: string) => {
    const timeOnly = value.replace(/\s(AM|PM)$/i, '');
    updateField(field, `${timeOnly} ${getPeriod(field)}`);
  };

  const selectPeriod = (field: 'startTime' | 'endTime', period: string) => {
    const timeOnly = form[field].replace(/\s(AM|PM)$/i, '').trim();
    updateField(field, `${timeOnly} ${period}`);
    setPeriodDropdownField(null);
  };

  const calendarDays = () => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    const count = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  };

  const saveClass = async () => {
    if (!token) return;
    const start = toDateTime(form.date, form.startTime);
    const end = toDateTime(form.date, form.endTime);
    const capacity = Number(form.capacity);
    const intensity = Number(form.intensity);
    if (!form.title.trim() || !form.date || !form.startTime || !form.endTime || !form.location.trim()) {
      setError('Title, date, times, and location are required'); return;
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('Enter a valid date and an end time after the start time'); return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || !Number.isInteger(intensity) || intensity < 1 || intensity > 5) {
      setError('Capacity must be positive and intensity must be between 1 and 5'); return;
    }
    const payload: ClassPayload = {
      title: form.title.trim(), description: form.description.trim(), scheduledAt: start.toISOString(),
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000), location: form.location.trim(), capacity, intensity,
    };
    try {
      if (editing) await updateClass(token, editing._id, payload);
      else await createClass(token, payload);
      setEditing(null); setForm(emptyForm); setFormVisible(false); setError(null); await loadClasses();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save class'); }
  };

  const showMembers = async (fitnessClass: FitnessClass) => {
    if (expandedClassId === fitnessClass._id) {
      setExpandedClassId(null);
      return;
    }
    if (!token) return;
    setExpandedClassId(fitnessClass._id);
    setMembersLoading(true);
    try { setMembers(await getClassMembers(token, fitnessClass._id)); }
    catch { setMembers([]); }
    finally { setMembersLoading(false); }
  };

  const submitCancellation = async () => {
    if (!token || !reasonClass) return;
    if (!reason.trim()) { Alert.alert('Reason required', 'Enter a cancellation reason before continuing.'); return; }
    try { await cancelClass(token, reasonClass._id, reason); setReasonClass(null); setReason(''); await loadClasses(); }
    catch (err) { Alert.alert('Cancellation failed', err instanceof Error ? err.message : 'Unable to cancel class'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClassList
        classes={classes}
        emptyMessage="You have no assigned classes yet."
        editingClassId={editing?._id}
        onViewMembers={showMembers}
        expandedClassId={expandedClassId}
        expandedContent={(
          <View style={styles.memberSection}>
            <Text style={styles.memberHeading}>Booked Members</Text>
            {membersLoading ? <Text style={styles.meta}>Loading members...</Text> : members.length === 0 ? <Text style={styles.meta}>No active bookings.</Text> : members.map((member) => (
              <View key={member._id} style={styles.memberRow}>
                <View><Text style={styles.memberName}>{member.user.name}</Text><Text style={styles.meta}>{member.user.phone}</Text></View>
                <Text style={styles.memberStatus}>{member.status}</Text>
              </View>
            ))}
          </View>
        )}
        onEdit={(fitnessClass) => { setEditing(fitnessClass); setForm(toForm(fitnessClass)); setFormVisible(true); }}
        onCancelClass={setReasonClass}
        listHeader={(
          <>
            <Text style={styles.header}>Class Management</Text>
            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      />
      <Pressable style={styles.createButton} onPress={() => { setEditing(null); setForm(emptyForm); setError(null); setFormVisible(true); }}>
        <Text style={styles.createText}>+</Text>
      </Pressable>

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={styles.overlay}><View style={styles.formModal}>
          <ScrollView
            ref={formScrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.formContent}
          >
            <Text style={styles.formTitle}>{editing ? 'Edit Class' : 'Create New Class'}</Text>
            <Text style={styles.fieldLabel}>Class Name</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(value) => updateField('title', value)} returnKeyType="done" blurOnSubmit />
            <Text style={styles.fieldLabel}>Date</Text>
            <Pressable style={styles.selector} onPress={openDatePicker}><Text style={styles.selectorText}>{form.date || 'Select date'}</Text></Pressable>
            {datePickerVisible && <View style={styles.inlinePicker}>
              <View style={styles.calendarHeader}><Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><Text style={styles.monthButton}>‹</Text></Pressable><Text style={styles.monthTitle}>{calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text><Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><Text style={styles.monthButton}>›</Text></Pressable></View>
              <View style={styles.weekRow}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
              <View style={styles.calendarGrid}>{calendarDays().map((day, index) => day ? <Pressable key={index} style={styles.dayButton} onPress={() => selectDate(day)}><Text style={styles.dayText}>{day}</Text></Pressable> : <View key={index} style={styles.dayButton} />)}</View>
              <Pressable onPress={closeDatePicker}><Text style={styles.dismiss}>Close Calendar</Text></Pressable>
            </View>}
            <Text style={styles.fieldLabel}>Start Time</Text>
            <View style={timeStyles.timeInputRow}>
              <TextInput style={timeStyles.timeInput} value={form.startTime.replace(/\s(AM|PM)$/i, '').trim()} onChangeText={(value) => updateManualTime('startTime', value)} placeholder="HH:MM" keyboardType="numbers-and-punctuation" returnKeyType="done" blurOnSubmit />
              <View style={timeStyles.periodControl}>
                <Pressable style={timeStyles.periodButton} onPress={() => setPeriodDropdownField(periodDropdownField === 'startTime' ? null : 'startTime')}><Text style={styles.dropdownText}>{getPeriod('startTime')}</Text><Text style={styles.dropdownArrow}>▾</Text></Pressable>
                {periodDropdownField === 'startTime' && <View style={timeStyles.periodDropdown}>{periods.map((period) => <Pressable key={period} style={timeStyles.periodDropdownOption} onPress={() => selectPeriod('startTime', period)}><Text style={styles.dropdownOptionText}>{period}</Text></Pressable>)}</View>}
              </View>
            </View>
            <Text style={styles.fieldLabel}>End Time</Text>
            <View style={timeStyles.timeInputRow}>
              <TextInput style={timeStyles.timeInput} value={form.endTime.replace(/\s(AM|PM)$/i, '').trim()} onChangeText={(value) => updateManualTime('endTime', value)} placeholder="HH:MM" keyboardType="numbers-and-punctuation" returnKeyType="done" blurOnSubmit />
              <View style={timeStyles.periodControl}>
                <Pressable style={timeStyles.periodButton} onPress={() => setPeriodDropdownField(periodDropdownField === 'endTime' ? null : 'endTime')}><Text style={styles.dropdownText}>{getPeriod('endTime')}</Text><Text style={styles.dropdownArrow}>▾</Text></Pressable>
                {periodDropdownField === 'endTime' && <View style={timeStyles.periodDropdown}>{periods.map((period) => <Pressable key={period} style={timeStyles.periodDropdownOption} onPress={() => selectPeriod('endTime', period)}><Text style={styles.dropdownOptionText}>{period}</Text></Pressable>)}</View>}
              </View>
            </View>
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput style={styles.input} value={form.location} onChangeText={(value) => updateField('location', value)} returnKeyType="done" blurOnSubmit />
            <Text style={styles.fieldLabel}>Capacity</Text>
            <TextInput style={styles.input} value={form.capacity} onChangeText={(value) => updateField('capacity', value)} keyboardType="numeric" returnKeyType="done" blurOnSubmit />
            <Text style={styles.fieldLabel}>Intensity (1-5)</Text>
            <TextInput style={styles.input} value={form.intensity} onChangeText={(value) => updateField('intensity', value)} keyboardType="numeric" returnKeyType="done" blurOnSubmit />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={form.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              blurOnSubmit={false}
              onFocus={() => setTimeout(() => formScrollRef.current?.scrollToEnd({ animated: true }), 250)}
            />
            <Pressable style={styles.saveButton} onPress={saveClass}><Text style={styles.buttonText}>{editing ? 'Save Changes' : 'Create Class'}</Text></Pressable>
            <Pressable onPress={() => { setEditing(null); setForm(emptyForm); setFormVisible(false); setError(null); }}><Text style={styles.dismiss}>Cancel</Text></Pressable>
          </ScrollView>
          </View></View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!reasonClass} transparent animationType="fade" onRequestClose={() => setReasonClass(null)}>
        <View style={styles.overlay}><View style={styles.modal}><Text style={styles.formTitle}>Cancel Class</Text><Text style={styles.meta}>A reason is required and will be shown to booked members.</Text><TextInput style={styles.input} placeholder="Cancellation reason" value={reason} onChangeText={setReason} multiline /><Pressable style={styles.cancelButton} onPress={submitCancellation}><Text style={styles.buttonText}>Confirm Cancellation</Text></Pressable><Pressable onPress={() => setReasonClass(null)}><Text style={styles.dismiss}>Keep Class</Text></Pressable></View></View>
      </Modal>
    </SafeAreaView>
  );
};

const timeStyles = StyleSheet.create({
  timeInputRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  timeInput: { flex: 1, borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, padding: 10, minHeight: 42, fontSize: 15 },
  periodControl: { width: 92, zIndex: 3 },
  periodButton: { minHeight: 42, borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodDropdown: { marginTop: 4, borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, backgroundColor: '#fff', elevation: 4 },
  periodDropdownOption: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' }, content: { paddingBottom: 90 }, header: { fontSize: 22, fontWeight: '700', marginHorizontal: 20, marginTop: 12, marginBottom: 4 }, error: { color: '#b42318', marginHorizontal: 20, marginTop: 12, marginBottom: 4 }, buttonText: { color: '#fff', fontWeight: '700' }, createButton: { position: 'absolute', right: 16, bottom: 18, width: 52, height: 52, backgroundColor: '#2e9d50', borderRadius: 26, alignItems: 'center', justifyContent: 'center', zIndex: 2 }, createText: { color: '#fff', fontSize: 30, fontWeight: '400', lineHeight: 34 }, form: { backgroundColor: '#fff', borderRadius: 10, padding: 14, margin: 20, marginTop: 8 }, keyboardContainer: { flex: 1 }, formModal: { backgroundColor: '#fff', borderRadius: 14, padding: 18, maxHeight: '90%' }, formContent: { paddingBottom: 24 }, pickerModal: { backgroundColor: '#fff', borderRadius: 14, padding: 18, width: '100%' }, inlinePicker: { backgroundColor: '#f5f5f7', borderRadius: 8, padding: 10, marginTop: -4, marginBottom: 10, borderWidth: 1, borderColor: '#d0d0d5' }, formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 }, fieldLabel: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 4 }, input: { borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, padding: 10, marginBottom: 10, minHeight: 42 }, selector: { borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, padding: 12, marginBottom: 10 }, selectorText: { color: '#1d1d1f', fontSize: 15 }, descriptionInput: { minHeight: 80, textAlignVertical: 'top' }, saveButton: { backgroundColor: '#8a2be2', borderRadius: 6, padding: 12, alignItems: 'center', marginTop: 4 }, overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', padding: 20 }, modal: { backgroundColor: '#fff', borderRadius: 10, padding: 18 }, dismiss: { textAlign: 'center', color: '#333', fontWeight: '700', padding: 12 }, meta: { color: '#666', marginTop: 4 }, cancelButton: { backgroundColor: '#b42318', borderRadius: 6, padding: 9 }, memberSection: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: -8, marginBottom: 12, padding: 14, borderTopWidth: 1, borderTopColor: '#e5e5ea', borderRadius: 0 }, memberHeading: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 }, memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }, memberName: { fontSize: 14, fontWeight: '600', color: '#1d1d1f' }, memberStatus: { color: '#2e7d32', fontSize: 12, fontWeight: '700' }, calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, monthTitle: { fontSize: 16, fontWeight: '700' }, monthButton: { fontSize: 28, color: '#8a2be2', paddingHorizontal: 12 }, weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 }, weekDay: { width: '14.28%', textAlign: 'center', color: '#666', fontSize: 12 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayButton: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' }, dayText: { color: '#1d1d1f', fontSize: 15 }, dropdownGroup: { marginBottom: 10 }, dropdownButton: { minHeight: 44, borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dropdownText: { color: '#1d1d1f', fontSize: 16 }, dropdownArrow: { color: '#8a2be2', fontSize: 18 }, dropdownList: { maxHeight: 150, borderWidth: 1, borderColor: '#d0d0d5', borderRadius: 6, marginTop: 4, backgroundColor: '#fff' }, dropdownOption: { minHeight: 40, paddingHorizontal: 12, justifyContent: 'center' }, selectedDropdownOption: { backgroundColor: '#f0e6ff' }, dropdownOptionText: { color: '#1d1d1f', fontSize: 15 },
});

export default InstructorClassManagementScreen;
