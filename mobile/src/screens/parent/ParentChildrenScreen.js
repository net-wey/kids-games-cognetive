import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../config/api';

// Условный импорт DateTimePicker только для нативных платформ
let DateTimePicker;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const ParentChildrenScreen = () => {
  const { user, updateUser } = useContext(AuthContext);

  // Обновляем данные при фокусировке на экран
  useFocusEffect(
    React.useCallback(() => {
      updateUser();
    }, [])
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [childToDelete, setChildToDelete] = useState(null);
  const [newChild, setNewChild] = useState({
    username: '',
    password: '',
    childName: '',
    age: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState(new Date());
  
  const calculateAge = (date) => {
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleCreateChild = async () => {
    if (!newChild.username || !newChild.password || !newChild.childName || !birthDate) {
      setErrorMessage('Заполните все поля');
      setErrorModalVisible(true);
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 2 || age > 6) {
      setErrorMessage('Возраст ребенка должен быть от 2 до 6 лет');
      setErrorModalVisible(true);
      return;
    }

    try {
      const response = await api.post('/auth/register-child', {
        ...newChild,
        age
      });
      
      if (response.data.success) {
        setSuccessData(response.data.child.credentials);
        setModalVisible(false);
        setSuccessModalVisible(true);
        setNewChild({ username: '', password: '', childName: '', age: '' });
        setBirthDate(new Date());
        updateUser();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка создания аккаунта';
      setErrorMessage(message);
      setErrorModalVisible(true);
    }
  };

  const handleDeleteChild = (child) => {
    setChildToDelete(child);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;
    
    try {
      await api.delete(`/auth/child/${childToDelete.id}`);
      setDeleteModalVisible(false);
      setChildToDelete(null);
      updateUser();
    } catch (error) {
      setDeleteModalVisible(false);
      setErrorMessage(error.response?.data?.message || 'Не удалось удалить ребенка');
      setErrorModalVisible(true);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setChildToDelete(null);
  };

  const renderChildItem = ({ item }) => (
    <View style={styles.childCard}>
      <View style={styles.childAvatar}>
        <Ionicons name="person" size={30} color="#fff" />
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{item.childName}</Text>
        <Text style={styles.childUsername}>@{item.username}</Text>
        <View style={styles.ageBadge}>
          <Ionicons name="calendar" size={14} color="#666" />
          <Text style={styles.ageText}>{item.age} лет</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteChild(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={user?.children || []}
        renderItem={renderChildItem}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>У вас пока нет детей</Text>
            <Text style={styles.emptySubtext}>
              Нажмите кнопку ниже, чтобы добавить ребенка
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить ребенка</Text>

            <TextInput
              style={styles.input}
              placeholder="Имя ребенка"
              value={newChild.childName}
              onChangeText={(text) => setNewChild({ ...newChild, childName: text })}
            />

            {Platform.OS === 'web' ? (
              // Веб-версия: HTML input
              <View style={styles.webDatePickerContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <input
                  type="date"
                  value={birthDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      setBirthDate(new Date(e.target.value));
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(new Date().getFullYear() - 10, 0, 1).toISOString().split('T')[0]}
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    padding: 10,
                    fontSize: 16,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                  }}
                />
                {birthDate && (
                  <Text style={styles.ageText}>
                    ({calculateAge(birthDate)} лет)
                  </Text>
                )}
              </View>
            ) : (
              // Мобильная версия: DateTimePicker
              <>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.datePickerText}>
                    {birthDate ? `Дата рождения: ${birthDate.toLocaleDateString('ru-RU')} (${calculateAge(birthDate)} лет)` : 'Выберите дату рождения'}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && DateTimePicker && (
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setBirthDate(selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(new Date().getFullYear() - 10, 0, 1)}
            />
                )}
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Имя пользователя для входа"
              value={newChild.username}
              onChangeText={(text) => setNewChild({ ...newChild, username: text })}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={newChild.password}
              onChangeText={(text) => setNewChild({ ...newChild, password: text })}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewChild({ username: '', password: '', childName: '', age: '' });
                  setBirthDate(new Date());
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateChild}
              >
                <Text style={styles.createButtonText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.successModalHeader}>
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
              <Text style={styles.successModalTitle}>Успех!</Text>
            </View>
            {successData && (
              <View style={styles.credentialsBox}>
                <Text style={styles.credentialsTitle}>Данные для входа:</Text>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Логин:</Text>
                  <Text style={styles.credentialValue}>{successData.username}</Text>
                </View>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Пароль:</Text>
                  <Text style={styles.credentialValue}>{successData.password}</Text>
                </View>
                <Text style={styles.warningText}>⚠️ Сохраните эти данные!</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successButtonText}>Понятно</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.errorModalHeader}>
              <Ionicons name="close-circle" size={60} color="#EF4444" />
              <Text style={styles.errorModalTitle}>Ошибка</Text>
            </View>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={60} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Удаление ребенка</Text>
            </View>
            {childToDelete && (
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalText}>
                  Вы уверены, что хотите удалить ребенка "{childToDelete.childName}"?
                </Text>
                <View style={styles.warningBox}>
                  <Text style={styles.warningTextDelete}>
                    ⚠️ Будут удалены все результаты игр этого ребенка!
                  </Text>
                </View>
                <Text style={styles.deleteModalSubtext}>
                  Это действие нельзя отменить!
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    padding: 15,
  },
  childCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    marginLeft: 15,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#10B981',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 10,
  },
  credentialsBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  credentialLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  credentialValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  deleteModalBody: {
    marginBottom: 20,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  warningTextDelete: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteConfirmButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  webDatePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#F9FAFB',
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default ParentChildrenScreen;

