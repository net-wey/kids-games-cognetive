import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const { width } = Dimensions.get('window');

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newParent, setNewParent] = useState({ username: '', password: '' });
  const [expandedParents, setExpandedParents] = useState({}); // Отслеживаем развернутых родителей

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCreateParent = async () => {
    if (!newParent.username || !newParent.password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      const response = await api.post('/auth/register-parent', newParent);
      if (response.data.success) {
        Alert.alert(
          'Успех!',
          `Родитель создан\n\nЛогин: ${response.data.parent.credentials.username}\nПароль: ${response.data.parent.credentials.password}\n\nСообщите эти данные родителю`,
          [{ text: 'OK', onPress: () => {
            setModalVisible(false);
            setNewParent({ username: '', password: '' });
            fetchUsers();
          }}]
        );
      }
    } catch (error) {
      Alert.alert('Ошибка', error.response?.data?.message || 'Ошибка создания пользователя');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const actionText = currentStatus ? 'деактивировать' : 'активировать';

    Alert.alert(
      'Подтверждение',
      `Вы уверены, что хотите ${actionText} этого пользователя?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Да',
          onPress: async () => {
            try {
              await api.put(`/admin/users/${userId}/${action}`);
              fetchUsers();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось изменить статус пользователя');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userId, username, role) => {
    console.log('Delete user clicked:', { userId, username, role });
    setUserToDelete({ userId, username, role });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    console.log('Deleting user:', userToDelete.userId);
    try {
      const response = await api.delete(`/admin/users/${userToDelete.userId}`);
      console.log('Delete response:', response.data);
      Alert.alert('Успех', 'Пользователь удален');
      setDeleteModalVisible(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Ошибка', error.response?.data?.message || 'Не удалось удалить пользователя');
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  // Группируем пользователей по ролям
  const groupedUsers = () => {
    const admins = users.filter(u => u.role === 'admin');
    const parents = users.filter(u => u.role === 'parent');
    
    return { admins, parents };
  };

  const toggleParent = (parentId) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  // Рендер родителя с его детьми
  const renderParentWithChildren = (parent) => {
    const parentId = parent.id || parent._id;
    const isExpanded = expandedParents[parentId];
    const childrenCount = parent.children?.length || 0;

    return (
      <View key={parentId} style={styles.parentContainer}>
        {/* Карточка родителя */}
        <TouchableOpacity
          style={styles.parentCard}
          onPress={() => toggleParent(parentId)}
          activeOpacity={0.7}
        >
          <View style={styles.parentHeader}>
            <View style={[styles.roleIndicator, { backgroundColor: '#10B981' }]}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>

            <View style={styles.userInfo}>
              <View style={styles.parentTitleRow}>
                <Text style={styles.username}>{parent.username}</Text>
                <View style={styles.childrenBadge}>
                  <Ionicons name="people" size={14} color="#10B981" />
                  <Text style={styles.childrenBadgeText}>{childrenCount}</Text>
                </View>
              </View>
              <Text style={styles.role}>Родитель</Text>
              {childrenCount > 0 && (
                <Text style={styles.childrenHint}>
                  {isExpanded ? '▼ Скрыть детей' : '▶ Показать детей'}
                </Text>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleUserStatus(parentId, parent.isActive);
                }}
              >
                <Ionicons
                  name={parent.isActive ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={parent.isActive ? '#10B981' : '#EF4444'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteUser(parentId, parent.username, 'parent');
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Список детей (показывается при раскрытии) */}
        {isExpanded && parent.children && parent.children.length > 0 && (
          <View style={styles.childrenContainer}>
            {parent.children.map((child) => renderChild(child))}
          </View>
        )}

        {isExpanded && (!parent.children || parent.children.length === 0) && (
          <View style={styles.noChildrenContainer}>
            <Text style={styles.noChildrenText}>У этого родителя пока нет детей</Text>
          </View>
        )}
      </View>
    );
  };

  // Рендер ребенка
  const renderChild = (child) => {
    const childId = child.id || child._id;

    return (
      <View key={childId} style={styles.childCard}>
        <View style={styles.childConnector} />
        
        <View style={[styles.roleIndicator, styles.childIndicator, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="happy" size={20} color="#fff" />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.childUsername}>{child.username}</Text>
          {child.childName && (
            <Text style={styles.childName}>
              <Ionicons name="person-outline" size={12} color="#666" /> {child.childName}
            </Text>
          )}
          {child.age && (
            <Text style={styles.childAge}>
              <Ionicons name="calendar-outline" size={12} color="#666" /> {child.age} лет
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleToggleUserStatus(childId, child.isActive)}
          >
            <Ionicons
              name={child.isActive ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={child.isActive ? '#10B981' : '#EF4444'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(childId, child.username, 'child')}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Рендер администратора
  const renderAdmin = (admin) => {
    return (
      <View key={admin.id || admin._id} style={styles.adminCard}>
        <View style={[styles.roleIndicator, { backgroundColor: '#6366F1' }]}>
          <Ionicons name="shield" size={24} color="#fff" />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{admin.username}</Text>
          <Text style={styles.role}>Администратор</Text>
        </View>
      </View>
    );
  };

  const { admins, parents } = groupedUsers();

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ type: 'content' }]}
        keyExtractor={() => 'content'}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={() => (
          <View style={styles.contentWrapper}>
            {/* Администраторы */}
            {admins.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield" size={20} color="#6366F1" />
                  <Text style={styles.sectionTitle}>Администраторы</Text>
                </View>
                {admins.map(admin => renderAdmin(admin))}
              </View>
            )}

            {/* Родители с детьми */}
            {parents.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color="#10B981" />
                  <Text style={styles.sectionTitle}>Родители и дети</Text>
                  <Text style={styles.sectionCount}>({parents.length})</Text>
                </View>
                {parents.map(parent => renderParentWithChildren(parent))}
              </View>
            )}

            {users.length === 0 && (
              <Text style={styles.emptyText}>Нет пользователей</Text>
            )}
          </View>
        )}
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
            <Text style={styles.modalTitle}>Создать родителя</Text>

            <TextInput
              style={styles.input}
              placeholder="Имя пользователя"
              value={newParent.username}
              onChangeText={(text) => setNewParent({ ...newParent, username: text })}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={newParent.password}
              onChangeText={(text) => setNewParent({ ...newParent, password: text })}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewParent({ username: '', password: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateParent}
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
        visible={deleteModalVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={50} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Удаление пользователя</Text>
            </View>

            {userToDelete && (
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalText}>
                  Вы уверены, что хотите удалить {userToDelete.role === 'parent' ? 'родителя' : 'ребенка'} "{userToDelete.username}"?
                </Text>
                
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    {userToDelete.role === 'parent' 
                      ? '⚠️ При удалении родителя будут удалены все его дети и их результаты!' 
                      : '⚠️ Будут удалены все результаты игр этого ребенка!'}
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
    alignItems: 'center', // Центрируем контент на больших экранах
  },
  contentWrapper: {
    width: '100%',
    maxWidth: width > 1024 ? 900 : width > 768 ? 700 : '100%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
    marginLeft: 5,
  },
  adminCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  parentContainer: {
    marginBottom: 15,
  },
  parentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  parentHeader: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  parentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childrenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  childrenBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  childrenHint: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 5,
    fontWeight: '600',
  },
  childrenContainer: {
    backgroundColor: '#F9FAFB',
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  noChildrenContainer: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  noChildrenText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  childCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginLeft: 40,
  },
  childConnector: {
    position: 'absolute',
    left: -25,
    top: '50%',
    width: 25,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  childIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  childUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  roleIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childName: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  childAge: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  childrenCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
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
    backgroundColor: '#6366F1',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteModalContent: {
    maxWidth: 500,
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
  warningText: {
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
});

export default AdminUsersScreen;

