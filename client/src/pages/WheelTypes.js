// src/pages/WheelTypes.js
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Button, Form, Table } from 'react-bootstrap';

const WheelTypes = () => {
  const { user } = useAuth();
  const { wheelTypes, addWheelType, updateWheelType, deleteWheelType } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeName, setTypeName] = useState('');

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  // التحقق من الصلاحيات
  const canAdd = permissions.addWheelType === true || isAdmin;
  const canEdit = permissions.editWheelType === true || isAdmin;
  const canDelete = permissions.deleteWheelType === true || isAdmin;

  const handleShowModal = () => {
    if (!canAdd) {
      alert('ليس لديك صلاحية الإضافة');
      return;
    }
    setEditingType(null);
    setTypeName('');
    setShowModal(true);
  };

  const handleEdit = (type) => {
    if (!canEdit) {
      alert('ليس لديك صلاحية التعديل');
      return;
    }
    setEditingType(type);
    setTypeName(type.name);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingType) {
      await updateWheelType(editingType.id, typeName);
    } else {
      await addWheelType(typeName);
    }
    setShowModal(false);
    setTypeName('');
    setEditingType(null);
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية الحذف');
      return;
    }
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      await deleteWheelType(id);
    }
  };

  return (
    <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="mb-4">نوع العجلة</h2>
      
      {canAdd && (
        <Button variant="primary" onClick={handleShowModal}>
          إضافة نوع عجلة جديد
        </Button>
      )}

      <Table striped bordered hover className="mt-4" style={{ direction: 'rtl', textAlign: 'right' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>اسم النوع</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {wheelTypes.map((type, index) => (
            <tr key={type.id}>
              <td>{index + 1}</td>
              <td>{type.name}</td>
              <td>
                {canEdit && (
                  <Button variant="warning" size="sm" className="me-1" onClick={() => handleEdit(type)}>
                    تعديل
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(type.id)}>
                    حذف
                  </Button>
                )}
                {!canEdit && !canDelete && (
                  <span className="text-muted">لا توجد صلاحيات</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} dir="rtl" style={{ textAlign: 'right' }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingType ? 'تعديل نوع العجلة' : 'إضافة نوع عجلة جديد'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="d-block text-right">اسم نوع العجلة</Form.Label>
            <Form.Control
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="أدخل اسم نوع العجلة"
              className="text-right"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-start">
          <Button variant="primary" className="ms-2" onClick={handleSave}>
            حفظ
          </Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            إلغاء
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WheelTypes;
