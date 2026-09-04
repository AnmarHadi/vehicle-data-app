// src/pages/Users.js
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import axios from 'axios';
import config from '../config';

const Users = () => {
  const { user } = useAuth();
  const { users, addUser, updateUser, resetPassword } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [permissions, setPermissions] = useState({
    dashboard: true,
    wheelTypes: false,
    dataEntry: false,
    users: false,
    viewData: false,
    addWheelType: false,
    editWheelType: false,
    deleteWheelType: false,
    viewVehicleData: false,
    editVehicleData: false,
    deleteVehicleData: false,
    exportExcel: false,
    exportPDF: false,
    exportAccess: false,
    resetDevice: false,
    addUser: false,
    editUser: false,
    toggleUserActive: false,
    resetUserPassword: false,
    saveDataEntry: false
  });

  const isAdmin = user?.role === 'admin';
  const currentUserPermissions = user?.permissions || {};

  const canAddUser = currentUserPermissions.addUser === true || isAdmin;
  const canEditUser = currentUserPermissions.editUser === true || isAdmin;
  const canToggleActive = currentUserPermissions.toggleUserActive === true || isAdmin;
  const canResetPassword = currentUserPermissions.resetUserPassword === true || isAdmin;
  const canDeleteUser = isAdmin;

  const visibleUsers = isAdmin ? users : users.filter(u => u.role !== 'admin');

  const handleShowModal = () => {
    if (!canAddUser && !canEditUser) {
      alert('ليس لديك صلاحية');
      return;
    }
    setEditingUser(null);
    setUsername('');
    setPermissions({
      dashboard: true,
      wheelTypes: false,
      dataEntry: false,
      users: false,
      viewData: false,
      addWheelType: false,
      editWheelType: false,
      deleteWheelType: false,
      viewVehicleData: false,
      editVehicleData: false,
      deleteVehicleData: false,
      exportExcel: false,
      exportPDF: false,
      exportAccess: false,
      resetDevice: false,
      addUser: false,
      editUser: false,
      toggleUserActive: false,
      resetUserPassword: false,
      saveDataEntry: false
    });
    setShowModal(true);
  };

  const handleEdit = (userItem) => {
    if (!canEditUser) {
      alert('ليس لديك صلاحية التعديل');
      return;
    }
    setEditingUser(userItem);
    setUsername(userItem.username);
    setPermissions(userItem.permissions || {});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingUser) {
      await updateUser(editingUser.id, { username, permissions });
    } else {
      await addUser({ username, permissions });
    }
    setShowModal(false);
  };

  const handleResetPassword = async (id) => {
    if (!canResetPassword) {
      alert('ليس لديك صلاحية إعادة تعيين كلمة المرور');
      return;
    }
    if (window.confirm('هل أنت متأكد من إعادة تعيين كلمة المرور؟')) {
      await resetPassword(id);
      alert('تم إعادة تعيين كلمة المرور إلى 000000');
    }
  };

  const handleToggleActive = async (userItem) => {
    if (!canToggleActive) {
      alert('ليس لديك صلاحية التنشيط/الإيقاف');
      return;
    }
    await updateUser(userItem.id, { ...userItem, isActive: !userItem.isActive });
  };

  const handleDelete = async (userItem) => {
    if (!canDeleteUser) {
      alert('ليس لديك صلاحية الحذف');
      return;
    }
    if (userItem.role === 'admin') {
      alert('لا يمكن حذف حساب الأدمن');
      return;
    }
    const displayName = userItem.driverName || userItem.username || userItem.phoneNumber || 'هذا المستخدم';
    if (window.confirm(`هل أنت متأكد من حذف "${displayName}"؟`)) {
      try {
        await axios.delete(`${config.apiUrl}/users/${userItem.id}`);
        alert('تم حذف المستخدم بنجاح');
        window.location.reload();
      } catch (error) {
        alert(error.response?.data?.message || 'خطأ في الحذف');
      }
    }
  };

  return (
    <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="mb-4">المستخدمون</h2>
      
      {(canAddUser || isAdmin) && (
        <Button variant="primary" onClick={handleShowModal}>
          إضافة مستخدم جديد
        </Button>
      )}

      <Table striped bordered hover className="mt-4" style={{ direction: 'rtl', textAlign: 'right' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>الاسم</th>
            <th>اسم المستخدم</th>
            <th>رقم الهاتف</th>
            <th>الدور</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((userItem, index) => (
            <tr key={userItem.id}>
              <td>{index + 1}</td>
              <td>
                {userItem.role === 'driver' 
                  ? (userItem.driverName || '-')
                  : '-'
                }
              </td>
              <td>{userItem.username || '-'}</td>
              <td dir="ltr" style={{ fontFamily: 'monospace' }}>{userItem.phoneNumber || '-'}</td>
              <td>
                <span className={`badge ${userItem.role === 'admin' ? 'bg-danger' : userItem.role === 'driver' ? 'bg-info' : 'bg-primary'}`}>
                  {userItem.role === 'admin' ? 'أدمن' : userItem.role === 'driver' ? 'سائق' : 'مستخدم'}
                </span>
              </td>
              <td>
                {canToggleActive ? (
                  <button
                    className={`btn btn-sm ${userItem.isActive ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleToggleActive(userItem)}
                  >
                    {userItem.isActive ? 'نشط' : 'موقوف'}
                  </button>
                ) : (
                  <span className={`badge ${userItem.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {userItem.isActive ? 'نشط' : 'موقوف'}
                  </span>
                )}
              </td>
              <td>
                {canEditUser && (
                  <Button variant="warning" size="sm" className="me-1 mb-1" onClick={() => handleEdit(userItem)}>
                    ✏️ تعديل
                  </Button>
                )}
                {canResetPassword && userItem.role !== 'admin' && (
                  <Button variant="info" size="sm" className="me-1 mb-1" onClick={() => handleResetPassword(userItem.id)}>
                    🔄 كلمة المرور
                  </Button>
                )}
                {canDeleteUser && userItem.role !== 'admin' && (
                  <Button variant="danger" size="sm" className="mb-1" onClick={() => handleDelete(userItem)}>
                    🗑️ حذف
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} dir="rtl" style={{ textAlign: 'right' }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="d-block text-right">اسم المستخدم</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="d-block text-right fw-bold">صلاحيات الصفحات</Form.Label>
            <div className="border p-3 text-right mb-3">
              <Form.Check type="checkbox" label="الرئيسية" checked={permissions.dashboard !== false} onChange={(e) => setPermissions({ ...permissions, dashboard: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="نوع العجلة (عرض الصفحة)" checked={permissions.wheelTypes === true} onChange={(e) => setPermissions({ ...permissions, wheelTypes: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="إدخال البيانات (عرض الصفحة)" checked={permissions.dataEntry === true} onChange={(e) => setPermissions({ ...permissions, dataEntry: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="المستخدمون (عرض الصفحة)" checked={permissions.users === true} onChange={(e) => setPermissions({ ...permissions, users: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="البيانات المدخلة (عرض الصفحة)" checked={permissions.viewData === true} onChange={(e) => setPermissions({ ...permissions, viewData: e.target.checked })} className="text-right" />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="d-block text-right fw-bold">صلاحيات الأزرار</Form.Label>
            <div className="border p-3 text-right mb-3">
              <Form.Check type="checkbox" label="إضافة نوع عجلة" checked={permissions.addWheelType === true} onChange={(e) => setPermissions({ ...permissions, addWheelType: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تعديل نوع عجلة" checked={permissions.editWheelType === true} onChange={(e) => setPermissions({ ...permissions, editWheelType: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="حذف نوع عجلة" checked={permissions.deleteWheelType === true} onChange={(e) => setPermissions({ ...permissions, deleteWheelType: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تعديل البيانات" checked={permissions.editVehicleData === true} onChange={(e) => setPermissions({ ...permissions, editVehicleData: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="حذف البيانات" checked={permissions.deleteVehicleData === true} onChange={(e) => setPermissions({ ...permissions, deleteVehicleData: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تصدير Excel" checked={permissions.exportExcel === true} onChange={(e) => setPermissions({ ...permissions, exportExcel: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تصدير PDF" checked={permissions.exportPDF === true} onChange={(e) => setPermissions({ ...permissions, exportPDF: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تصدير Access" checked={permissions.exportAccess === true} onChange={(e) => setPermissions({ ...permissions, exportAccess: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="إعادة السماح" checked={permissions.resetDevice === true} onChange={(e) => setPermissions({ ...permissions, resetDevice: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="إضافة مستخدم" checked={permissions.addUser === true} onChange={(e) => setPermissions({ ...permissions, addUser: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تعديل مستخدم" checked={permissions.editUser === true} onChange={(e) => setPermissions({ ...permissions, editUser: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="تنشيط/إيقاف" checked={permissions.toggleUserActive === true} onChange={(e) => setPermissions({ ...permissions, toggleUserActive: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="ترسيت كلمة المرور" checked={permissions.resetUserPassword === true} onChange={(e) => setPermissions({ ...permissions, resetUserPassword: e.target.checked })} className="mb-2 text-right" />
              <Form.Check type="checkbox" label="حفظ البيانات" checked={permissions.saveDataEntry === true} onChange={(e) => setPermissions({ ...permissions, saveDataEntry: e.target.checked })} className="text-right" />
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-start">
          <Button variant="primary" className="ms-2" onClick={handleSave}>حفظ</Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>إلغاء</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users;
