import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const DriverLink = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [plateType, setPlateType] = useState(null);
  const [wheelTypes, setWheelTypes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedData, setSavedData] = useState(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [driverVehicles, setDriverVehicles] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [driverFormData, setDriverFormData] = useState({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    greatGrandfatherName: '',
    lastName: '',
    motherName: '',
    nationalId: '',
    birthDate: '',
    governorate: '',
    address: ''
  });
  const [driverErrors, setDriverErrors] = useState({});
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    greatGrandfatherName: '',
    lastName: '',
    motherName: '',
    nationalId: '',
    birthDate: '',
    governorate: '',
    address: '',
    plateGovernorate: '',
    plateLetter: '',
    plateNumber: '',
    wheelType: '',
    ownerName: '',
    phoneNumber: localStorage.getItem('driverPhoneNumber') || ''
  });

  const iraqGovernorates = [
    { name: 'بغداد', code: '1' },
    { name: 'البصرة', code: '2' },
    { name: 'نينوى', code: '3' },
    { name: 'أربيل', code: '4' },
    { name: 'السليمانية', code: '21' },
    { name: 'دهوك', code: '6' },
    { name: 'كركوك', code: '7' },
    { name: 'ديالى', code: '8' },
    { name: 'الأنبار', code: '9' },
    { name: 'بابل', code: '10' },
    { name: 'كربلاء', code: '11' },
    { name: 'النجف', code: '28' },
    { name: 'القادسية', code: '13' },
    { name: 'المثنى', code: '14' },
    { name: 'ذي قار', code: '15' },
    { name: 'ميسان', code: '16' },
    { name: 'واسط', code: '17' },
    { name: 'صلاح الدين', code: '18' }
  ];

  const englishLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const arabicLetters = 'أبجدهوزحطيكلمنسعفصقرشتثخذضظغ'.split('');

  useEffect(() => {
    const currentPhone = localStorage.getItem('driverPhoneNumber');
    const savedDataStr = localStorage.getItem('driverData');
    
    if (savedDataStr && currentPhone) {
      try {
        const parsedData = JSON.parse(savedDataStr);
        if (parsedData.phoneNumber === currentPhone && parsedData.firstName) {
          setSavedData(parsedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
          setHasExistingData(true);
        }
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
    
    fetchWheelTypes();
  }, []);

  const fetchWheelTypes = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/wheel-types`, { timeout: 5000 });
      setWheelTypes(response.data);
    } catch (error) {
      console.error('Error fetching wheel types:', error);
      setWheelTypes([]);
    }
  };

  const validateName = useCallback((value, fieldName) => {
    if (!value || value.trim() === '') return `${fieldName} مطلوب`;
    if (value.trim() !== value) return `${fieldName} لا يجب أن يحتوي على مسافات`;
    if (value.includes(' ')) return `${fieldName} يجب أن يكون كلمة واحدة`;
    if (value.length < 2) return `${fieldName} قصير جداً`;
    if (value.length > 30) return `${fieldName} طويل جداً`;
    if (!/^[\u0600-\u06FF\s]+$/.test(value)) return `${fieldName} يجب أن يكون باللغة العربية`;
    return null;
  }, []);

  const validateLastName = useCallback((value) => {
    if (!value || value.trim() === '') return 'اللقب مطلوب';
    if (value.trim() !== value) return 'اللقب لا يجب أن يحتوي على مسافات';
    const words = value.split(' ');
    if (words.length > 2) return 'اللقب يمكن أن يتكون من مقطعين كحد أقصى';
    if (value.length < 2) return 'اللقب قصير جداً';
    if (!/^[\u0600-\u06FF\s]+$/.test(value)) return 'اللقب يجب أن يكون باللغة العربية';
    return null;
  }, []);

  const validateNationalId = useCallback((value) => {
    if (!value) return 'رقم البطاقة مطلوب';
    if (!/^\d{12}$/.test(value)) return 'رقم البطاقة يجب أن يتكون من 12 رقم';
    return null;
  }, []);

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    
    const firstNameError = validateName(formData.firstName, 'الاسم الأول');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const fatherNameError = validateName(formData.fatherName, 'اسم الأب');
    if (fatherNameError) newErrors.fatherName = fatherNameError;
    
    const grandfatherNameError = validateName(formData.grandfatherName, 'الجد');
    if (grandfatherNameError) newErrors.grandfatherName = grandfatherNameError;
    
    const greatGrandfatherNameError = validateName(formData.greatGrandfatherName, 'أب الجد');
    if (greatGrandfatherNameError) newErrors.greatGrandfatherName = greatGrandfatherNameError;
    
    const lastNameError = validateLastName(formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    if (!formData.motherName || formData.motherName.trim() === '') {
      newErrors.motherName = 'اسم الأم مطلوب';
    }
    
    const nationalIdError = validateNationalId(formData.nationalId);
    if (nationalIdError) newErrors.nationalId = nationalIdError;
    
    if (!formData.birthDate) newErrors.birthDate = 'تاريخ الولادة مطلوب';
    if (!formData.governorate) newErrors.governorate = 'محافظة السكن مطلوبة';
    if (!formData.address || formData.address.trim() === '') newErrors.address = 'العنوان مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateName, validateLastName, validateNationalId]);

  const validateStep3 = useCallback(() => {
    const newErrors = {};
    
    if (!formData.plateGovernorate) newErrors.plateGovernorate = 'المحافظة مطلوبة';
    if (!formData.plateLetter) newErrors.plateLetter = 'الحرف مطلوب';
    
    if (!formData.plateNumber || formData.plateNumber.trim() === '') {
      newErrors.plateNumber = 'الرقم مطلوب';
    } else if (plateType === 'english' && !/^\d{5}$/.test(formData.plateNumber)) {
      newErrors.plateNumber = 'الرقم الانكليزي يجب أن يتكون من 5 أرقام';
    }
    
    if (!formData.wheelType) newErrors.wheelType = 'نوع العجلة مطلوب';
    if (!formData.ownerName || formData.ownerName.trim() === '') newErrors.ownerName = 'اسم المالك مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, plateType]);

  const validateDriverForm = useCallback(() => {
    const newErrors = {};
    
    const firstNameError = validateName(driverFormData.firstName, 'الاسم الأول');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const fatherNameError = validateName(driverFormData.fatherName, 'اسم الأب');
    if (fatherNameError) newErrors.fatherName = fatherNameError;
    
    const grandfatherNameError = validateName(driverFormData.grandfatherName, 'الجد');
    if (grandfatherNameError) newErrors.grandfatherName = grandfatherNameError;
    
    const greatGrandfatherNameError = validateName(driverFormData.greatGrandfatherName, 'أب الجد');
    if (greatGrandfatherNameError) newErrors.greatGrandfatherName = greatGrandfatherNameError;
    
    const lastNameError = validateLastName(driverFormData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    if (!driverFormData.motherName || driverFormData.motherName.trim() === '') {
      newErrors.motherName = 'اسم الأم مطلوب';
    }
    
    const nationalIdError = validateNationalId(driverFormData.nationalId);
    if (nationalIdError) newErrors.nationalId = nationalIdError;
    
    if (!driverFormData.birthDate) newErrors.birthDate = 'تاريخ الولادة مطلوب';
    if (!driverFormData.governorate) newErrors.governorate = 'محافظة السكن مطلوبة';
    if (!driverFormData.address || driverFormData.address.trim() === '') newErrors.address = 'العنوان مطلوب';
    
    setDriverErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [driverFormData, validateName, validateLastName, validateNationalId]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const handleDriverInputChange = useCallback((field, value) => {
    setDriverFormData(prev => ({ ...prev, [field]: value }));
    setDriverErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  const handleNextStep = () => {
    if (validateStep1()) {
      localStorage.setItem('driverData', JSON.stringify(formData));
      setCurrentStep(2);
    } else {
      alert('يرجى تصحيح الأخطاء قبل المتابعة');
    }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    
    if (!validateStep3()) {
      alert('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      const dataToSend = {
        ...formData,
        phoneNumber: localStorage.getItem('driverPhoneNumber') || formData.phoneNumber || '',
        plateType
      };
      
      if (isAddingVehicle) {
        response = await axios.post(`${config.apiUrl}/vehicle-data`, {
          ...dataToSend,
          isAdditionalVehicle: true
        }, { timeout: 10000 });
        alert('تم إضافة العجلة الجديدة بنجاح!');
      } else if (isEditing) {
        const dataId = localStorage.getItem('driverDataId');
        if (dataId) {
          response = await axios.put(`${config.apiUrl}/vehicle-data/${dataId}`, dataToSend, { timeout: 10000 });
        } else {
          response = await axios.post(`${config.apiUrl}/vehicle-data`, dataToSend, { timeout: 10000 });
        }
        alert('تم تحديث البيانات بنجاح!');
      } else {
        response = await axios.post(`${config.apiUrl}/vehicle-data`, dataToSend, { timeout: 10000 });
        alert('تم حفظ البيانات بنجاح!');
      }
      
      localStorage.setItem('driverDataId', String(response.data.id));
      localStorage.setItem('driverData', JSON.stringify(dataToSend));
      setSavedData(dataToSend);
      setHasExistingData(true);
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Error saving data:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'رقم البطاقة مسجل مسبقاً');
      } else {
        alert('خطأ في حفظ البيانات');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsAddingVehicle(false);
    setCurrentStep(1);
    setErrors({});
    
    const savedDataStr = localStorage.getItem('driverData');
    if (savedDataStr) {
      try {
        const parsedData = JSON.parse(savedDataStr);
        setFormData(prev => ({ ...prev, ...parsedData }));
        setSavedData(parsedData);
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    }
  };

  const openEditDriverModal = () => {
    const currentData = savedData || JSON.parse(localStorage.getItem('driverData') || '{}');
    setDriverFormData({
      firstName: currentData.firstName || '',
      fatherName: currentData.fatherName || '',
      grandfatherName: currentData.grandfatherName || '',
      greatGrandfatherName: currentData.greatGrandfatherName || '',
      lastName: currentData.lastName || '',
      motherName: currentData.motherName || '',
      nationalId: currentData.nationalId || '',
      birthDate: currentData.birthDate || '',
      governorate: currentData.governorate || '',
      address: currentData.address || ''
    });
    setDriverErrors({});
    setShowEditDriverModal(true);
  };

  const handleSaveDriverEdit = async () => {
    if (!validateDriverForm()) {
      alert('يرجى تصحيح الأخطاء قبل الحفظ');
      return;
    }
    
    setIsSavingDriver(true);
    
    try {
      const phoneNumber = localStorage.getItem('driverPhoneNumber');
      const driverDataId = localStorage.getItem('driverDataId');
      
      if (driverDataId) {
        await axios.put(`${config.apiUrl}/vehicle-data/${driverDataId}`, {
          ...driverFormData,
          phoneNumber: phoneNumber
        }, { timeout: 10000 });
      }
      
      const vehiclesResponse = await axios.get(`${config.apiUrl}/driver-vehicles/${phoneNumber}`);
      const vehicles = vehiclesResponse.data;
      
      for (const vehicle of vehicles) {
        await axios.put(`${config.apiUrl}/vehicle-data/${vehicle.id}`, {
          ...vehicle,
          ...driverFormData,
          phoneNumber: phoneNumber
        }, { timeout: 10000 });
      }
      
      const updatedData = {
        ...savedData,
        ...driverFormData,
        phoneNumber: phoneNumber
      };
      
      localStorage.setItem('driverData', JSON.stringify(updatedData));
      setSavedData(updatedData);
      setFormData(prev => ({ ...prev, ...driverFormData }));
      
      alert('تم تحديث بيانات السائق بنجاح');
      setShowEditDriverModal(false);
      
    } catch (error) {
      console.error('Error updating driver data:', error);
      alert('خطأ في تحديث بيانات السائق: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSavingDriver(false);
    }
  };

  const handleAddVehicle = () => {
    setIsAddingVehicle(true);
    setIsEditing(false);
    setCurrentStep(2);
    setPlateType(null);
    setErrors({});
    
    const savedDataStr = localStorage.getItem('driverData');
    if (savedDataStr) {
      try {
        const parsedData = JSON.parse(savedDataStr);
        setFormData(prev => ({
          ...prev,
          ...parsedData,
          plateGovernorate: '',
          plateLetter: '',
          plateNumber: '',
          wheelType: '',
          ownerName: ''
        }));
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    }
  };

  const fetchDriverVehicles = async () => {
    const phoneNumber = localStorage.getItem('driverPhoneNumber');
    if (!phoneNumber) return [];
    
    try {
      const response = await axios.get(`${config.apiUrl}/driver-vehicles/${phoneNumber}`);
      setDriverVehicles(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setDriverVehicles([]);
      return [];
    }
  };

  const handleViewData = async () => {
    await fetchDriverVehicles();
    setShowViewModal(true);
  };

  const openDeleteConfirm = (vehicle) => {
    console.log('Opening delete confirm for vehicle:', vehicle);
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete || isDeleting) return;
    
    const vehicleId = vehicleToDelete.id;
    console.log('Deleting vehicle with ID:', vehicleId);
    
    setIsDeleting(true);
    
    try {
      const response = await axios.delete(`${config.apiUrl}/vehicle-data/${vehicleId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        alert('تم حذف العجلة بنجاح');
        
        setShowDeleteConfirm(false);
        setVehicleToDelete(null);
        
        await fetchDriverVehicles();
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('خطأ في الحذف: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    console.log('Editing vehicle:', vehicle);
    setEditingVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      plateGovernorate: vehicle.plateGovernorate || '',
      plateLetter: vehicle.plateLetter || '',
      plateNumber: vehicle.plateNumber || '',
      wheelType: vehicle.wheelType || '',
      ownerName: vehicle.ownerName || '',
      plateType: vehicle.plateType
    }));
    setPlateType(vehicle.plateType || 'english');
    setShowEditVehicleModal(true);
  };

  const handleSaveVehicleEdit = async () => {
    if (!editingVehicle) return;
    
    console.log('Saving vehicle edit for ID:', editingVehicle.id);
    
    try {
      const response = await axios.put(`${config.apiUrl}/vehicle-data/${editingVehicle.id}`, {
        ...formData,
        phoneNumber: localStorage.getItem('driverPhoneNumber') || formData.phoneNumber || ''
      });
      
      console.log('Update response:', response.data);
      alert('تم تعديل العجلة بنجاح');
      setShowEditVehicleModal(false);
      
      await fetchDriverVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('خطأ في التعديل: ' + (error.response?.data?.message || error.message));
    }
  };

  // إذا كانت هناك بيانات سابقة
  if (hasExistingData && !isEditing && !isAddingVehicle && currentStep === 1) {
    return (
      <div className="container mt-4" dir="rtl" style={{ textAlign: 'right' }}>
        <div className="card p-5 text-center">
          <div style={{ fontSize: '64px' }}>✅</div>
          <h3 className="mt-3">بياناتك مسجلة بنجاح!</h3>
          <p className="mt-3">تم تسجيل بياناتك مسبقاً.</p>
          
          <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
            <button className="btn btn-warning btn-lg" onClick={openEditDriverModal}>👤 تعديل بيانات السائق</button>
            <button className="btn btn-success btn-lg" onClick={handleAddVehicle}>🚗 إضافة عجلة جديدة</button>
            <button className="btn btn-info btn-lg" onClick={handleViewData}>👁️ عرض البيانات</button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/driver-login')}>العودة لتسجيل الدخول</button>
          </div>
        </div>

        {/* نافذة تعديل بيانات السائق */}
        {showEditDriverModal && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', direction: 'rtl', zIndex: 3000 }}>
            <div className="modal-dialog modal-lg" dir="rtl">
              <div className="modal-content" style={{ textAlign: 'right', borderRadius: '15px' }}>
                <div className="modal-header" style={{ backgroundColor: '#007bff', color: 'white', borderRadius: '15px 15px 0 0' }}>
                  <h5 className="modal-title">👤 تعديل بيانات السائق</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditDriverModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">الاسم الأول *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.firstName ? 'is-invalid' : ''}`} value={driverFormData.firstName} onChange={(e) => handleDriverInputChange('firstName', e.target.value)} maxLength="30" />
                      {driverErrors.firstName && <div className="invalid-feedback">{driverErrors.firstName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">اسم الأب *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.fatherName ? 'is-invalid' : ''}`} value={driverFormData.fatherName} onChange={(e) => handleDriverInputChange('fatherName', e.target.value)} maxLength="30" />
                      {driverErrors.fatherName && <div className="invalid-feedback">{driverErrors.fatherName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">الجد *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.grandfatherName ? 'is-invalid' : ''}`} value={driverFormData.grandfatherName} onChange={(e) => handleDriverInputChange('grandfatherName', e.target.value)} maxLength="30" />
                      {driverErrors.grandfatherName && <div className="invalid-feedback">{driverErrors.grandfatherName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">أب الجد *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.greatGrandfatherName ? 'is-invalid' : ''}`} value={driverFormData.greatGrandfatherName} onChange={(e) => handleDriverInputChange('greatGrandfatherName', e.target.value)} maxLength="30" />
                      {driverErrors.greatGrandfatherName && <div className="invalid-feedback">{driverErrors.greatGrandfatherName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">اللقب *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.lastName ? 'is-invalid' : ''}`} value={driverFormData.lastName} onChange={(e) => handleDriverInputChange('lastName', e.target.value)} maxLength="40" />
                      {driverErrors.lastName && <div className="invalid-feedback">{driverErrors.lastName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">اسم الأم الثلاثي *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.motherName ? 'is-invalid' : ''}`} value={driverFormData.motherName} onChange={(e) => handleDriverInputChange('motherName', e.target.value)} maxLength="50" />
                      {driverErrors.motherName && <div className="invalid-feedback">{driverErrors.motherName}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">رقم البطاقة الموحدة *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.nationalId ? 'is-invalid' : ''}`} value={driverFormData.nationalId} onChange={(e) => handleDriverInputChange('nationalId', e.target.value.replace(/\D/g, '').slice(0, 12))} maxLength="12" />
                      {driverErrors.nationalId && <div className="invalid-feedback">{driverErrors.nationalId}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">تاريخ الولادة *</label>
                      <input type="date" className={`form-control text-right ${driverErrors.birthDate ? 'is-invalid' : ''}`} value={driverFormData.birthDate} onChange={(e) => handleDriverInputChange('birthDate', e.target.value)} />
                      {driverErrors.birthDate && <div className="invalid-feedback">{driverErrors.birthDate}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">محافظة السكن *</label>
                      <select className={`form-select text-right ${driverErrors.governorate ? 'is-invalid' : ''}`} value={driverFormData.governorate} onChange={(e) => handleDriverInputChange('governorate', e.target.value)}>
                        <option value="">اختر المحافظة</option>
                        {iraqGovernorates.map((gov) => (
                          <option key={gov.code} value={gov.name}>{gov.name}</option>
                        ))}
                      </select>
                      {driverErrors.governorate && <div className="invalid-feedback">{driverErrors.governorate}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">اسم المنطقة والعنوان الدقيق *</label>
                      <input type="text" className={`form-control text-right ${driverErrors.address ? 'is-invalid' : ''}`} value={driverFormData.address} onChange={(e) => handleDriverInputChange('address', e.target.value)} maxLength="100" />
                      {driverErrors.address && <div className="invalid-feedback">{driverErrors.address}</div>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditDriverModal(false)}>إلغاء</button>
                  <button className="btn btn-primary" onClick={handleSaveDriverEdit} disabled={isSavingDriver}>
                    {isSavingDriver ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة عرض البيانات */}
        {showViewModal && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', direction: 'rtl', zIndex: 1000 }}>
            <div className="modal-dialog modal-xl" dir="rtl">
              <div className="modal-content" style={{ textAlign: 'right', borderRadius: '15px' }}>
                <div className="modal-header" style={{ backgroundColor: '#28a745', color: 'white', borderRadius: '15px 15px 0 0' }}>
                  <h5 className="modal-title">👤 بيانات السائق والعجلات</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
                </div>
                <div className="modal-body">
                  {savedData && savedData.firstName && (
                    <>
                      <div className="alert alert-info text-center mb-4">
                        <h5 className="mb-0">👤 {savedData.firstName} {savedData.fatherName} {savedData.grandfatherName} {savedData.greatGrandfatherName} {savedData.lastName}</h5>
                      </div>
                      
                      <div className="row mb-4">
                        <div className="col-md-6 mb-3">
                          <div className="card p-3" style={{ border: '1px solid #ddd', height: '100%' }}>
                            <h6 className="text-muted mb-3">📋 معلومات السائق</h6>
                            <table className="table table-borderless mb-0" style={{ fontSize: '14px' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '40%', fontWeight: 'bold' }}>الاسم الأول:</td>
                                  <td>{savedData.firstName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>اسم الأب:</td>
                                  <td>{savedData.fatherName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>الجد:</td>
                                  <td>{savedData.grandfatherName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>أب الجد:</td>
                                  <td>{savedData.greatGrandfatherName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>اللقب:</td>
                                  <td>{savedData.lastName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>اسم الأم:</td>
                                  <td>{savedData.motherName || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>رقم البطاقة:</td>
                                  <td dir="ltr">{savedData.nationalId || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>تاريخ الولادة:</td>
                                  <td>{savedData.birthDate || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>المحافظة:</td>
                                  <td>{savedData.governorate || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>العنوان:</td>
                                  <td>{savedData.address || '-'}</td>
                                </tr>
                                <tr>
                                  <td style={{ fontWeight: 'bold' }}>رقم الهاتف:</td>
                                  <td dir="ltr">{savedData.phoneNumber || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <h5 className="mb-3">🚗 العجلات المسجلة ({driverVehicles.length})</h5>
                  {driverVehicles.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover" style={{ textAlign: 'right' }}>
                        <thead className="bg-dark text-white">
                          <tr>
                            <th>#</th>
                            <th>رقم العجلة</th>
                            <th>العائدية</th>
                            <th>النوع</th>
                            <th>المالك</th>
                            <th>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driverVehicles.map((vehicle, index) => {
                            return (
                              <tr key={vehicle.id || index}>
                                <td>{index + 1}</td>
                                <td dir="ltr" style={{ fontFamily: 'monospace' }}>
                                  {vehicle.plateGovernorate} - {vehicle.plateLetter} - {vehicle.plateNumber}
                                </td>
                                <td>{vehicle.plateGovernorate}</td>
                                <td>{vehicle.wheelType}</td>
                                <td>{vehicle.ownerName}</td>
                                <td>
                                  <button 
                                    className="btn btn-warning btn-sm me-1"
                                    onClick={() => handleEditVehicle(vehicle)}
                                  >
                                    ✏️ تعديل
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => openDeleteConfirm(vehicle)}
                                  >
                                    🗑️ حذف
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">لا توجد عجلات مسجلة</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={() => setShowViewModal(false)}>إغلاق</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تأكيد الحذف */}
        {showDeleteConfirm && vehicleToDelete && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', direction: 'rtl', zIndex: 2000 }}>
            <div className="modal-dialog" dir="rtl">
              <div className="modal-content" style={{ textAlign: 'right', borderRadius: '15px' }}>
                <div className="modal-header" style={{ backgroundColor: '#dc3545', color: 'white', borderRadius: '15px 15px 0 0' }}>
                  <h5 className="modal-title">⚠️ تأكيد الحذف</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => {
                    setShowDeleteConfirm(false);
                    setVehicleToDelete(null);
                  }}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-danger">
                    <h5>هل أنت متأكد من حذف هذه العجلة؟</h5>
                    <hr />
                    <p className="mb-2"><strong>رقم العجلة:</strong> <span dir="ltr">{vehicleToDelete.plateGovernorate} - {vehicleToDelete.plateLetter} - {vehicleToDelete.plateNumber}</span></p>
                    <p className="mb-2"><strong>النوع:</strong> {vehicleToDelete.wheelType}</p>
                    <p className="mb-2"><strong>المالك:</strong> {vehicleToDelete.ownerName}</p>
                    <p className="mb-0 text-danger"><small>⚠️ لا يمكن التراجع عن هذا الإجراء!</small></p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setVehicleToDelete(null);
                    }}
                    disabled={isDeleting}
                  >
                    إلغاء
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={confirmDeleteVehicle}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '⏳ جاري الحذف...' : '🗑️ تأكيد الحذف'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة تعديل العجلة */}
        {showEditVehicleModal && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', direction: 'rtl', zIndex: 2000 }}>
            <div className="modal-dialog modal-lg" dir="rtl">
              <div className="modal-content" style={{ textAlign: 'right', borderRadius: '15px' }}>
                <div className="modal-header" style={{ backgroundColor: '#ffc107', borderRadius: '15px 15px 0 0' }}>
                  <h5 className="modal-title">✏️ تعديل بيانات العجلة</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditVehicleModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">المحافظة</label>
                      <select className="form-select text-right" value={formData.plateGovernorate} onChange={(e) => handleInputChange('plateGovernorate', e.target.value)}>
                        <option value="">اختر المحافظة</option>
                        {iraqGovernorates.map((gov) => (
                          <option key={gov.code} value={gov.name}>{gov.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">الحرف</label>
                      <select className="form-select text-right" value={formData.plateLetter} onChange={(e) => handleInputChange('plateLetter', e.target.value)}>
                        <option value="">اختر الحرف</option>
                        {(plateType === 'english' ? englishLetters : arabicLetters).map((letter) => (
                          <option key={letter} value={letter}>{letter}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">رقم العجلة</label>
                      <input type="text" className="form-control text-right" value={formData.plateNumber} onChange={(e) => handleInputChange('plateNumber', e.target.value)} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">نوع العجلة</label>
                      <select className="form-select text-right" value={formData.wheelType} onChange={(e) => handleInputChange('wheelType', e.target.value)}>
                        <option value="">اختر النوع</option>
                        {wheelTypes.map((type) => (
                          <option key={type.id} value={type.name}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label d-block text-right">اسم المالك</label>
                      <input type="text" className="form-control text-right" value={formData.ownerName} onChange={(e) => handleInputChange('ownerName', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditVehicleModal(false)}>إلغاء</button>
                  <button className="btn btn-primary" onClick={handleSaveVehicleEdit}>حفظ التعديل</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mt-4" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="text-center mb-4">
        {isAddingVehicle ? 'إضافة عجلة جديدة' : isEditing ? 'تعديل بيانات السائق' : 'إدخال بيانات السائق'}
      </h2>

      <div className="progress mb-4">
        <div className="progress-bar" style={{ width: `${(currentStep / 4) * 100}%` }}>
          الخطوة {currentStep} من 4
        </div>
      </div>

      {currentStep === 1 && !isAddingVehicle && (
        <div className="card p-4">
          <h3 className="mb-4">بيانات السائق</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">رقم الهاتف</label>
              <input type="text" className="form-control text-right" value={formData.phoneNumber} disabled />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الاسم الأول *</label>
              <input type="text" className={`form-control text-right ${errors.firstName ? 'is-invalid' : ''}`} value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} maxLength="30" />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم الأب *</label>
              <input type="text" className={`form-control text-right ${errors.fatherName ? 'is-invalid' : ''}`} value={formData.fatherName} onChange={(e) => handleInputChange('fatherName', e.target.value)} maxLength="30" />
              {errors.fatherName && <div className="invalid-feedback">{errors.fatherName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الجد *</label>
              <input type="text" className={`form-control text-right ${errors.grandfatherName ? 'is-invalid' : ''}`} value={formData.grandfatherName} onChange={(e) => handleInputChange('grandfatherName', e.target.value)} maxLength="30" />
              {errors.grandfatherName && <div className="invalid-feedback">{errors.grandfatherName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">أب الجد *</label>
              <input type="text" className={`form-control text-right ${errors.greatGrandfatherName ? 'is-invalid' : ''}`} value={formData.greatGrandfatherName} onChange={(e) => handleInputChange('greatGrandfatherName', e.target.value)} maxLength="30" />
              {errors.greatGrandfatherName && <div className="invalid-feedback">{errors.greatGrandfatherName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اللقب *</label>
              <input type="text" className={`form-control text-right ${errors.lastName ? 'is-invalid' : ''}`} value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} maxLength="40" />
              {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم الأم الثلاثي *</label>
              <input type="text" className={`form-control text-right ${errors.motherName ? 'is-invalid' : ''}`} value={formData.motherName} onChange={(e) => handleInputChange('motherName', e.target.value)} maxLength="50" />
              {errors.motherName && <div className="invalid-feedback">{errors.motherName}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">رقم البطاقة الموحدة *</label>
              <input type="text" className={`form-control text-right ${errors.nationalId ? 'is-invalid' : ''}`} value={formData.nationalId} onChange={(e) => handleInputChange('nationalId', e.target.value.replace(/\D/g, '').slice(0, 12))} maxLength="12" />
              {errors.nationalId && <div className="invalid-feedback">{errors.nationalId}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">تاريخ الولادة *</label>
              <input type="date" className={`form-control text-right ${errors.birthDate ? 'is-invalid' : ''}`} value={formData.birthDate} onChange={(e) => handleInputChange('birthDate', e.target.value)} />
              {errors.birthDate && <div className="invalid-feedback">{errors.birthDate}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">محافظة السكن *</label>
              <select className={`form-select text-right ${errors.governorate ? 'is-invalid' : ''}`} value={formData.governorate} onChange={(e) => handleInputChange('governorate', e.target.value)}>
                <option value="">اختر المحافظة</option>
                {iraqGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.name}>{gov.name}</option>
                ))}
              </select>
              {errors.governorate && <div className="invalid-feedback">{errors.governorate}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم المنطقة والعنوان الدقيق *</label>
              <input type="text" className={`form-control text-right ${errors.address ? 'is-invalid' : ''}`} value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} maxLength="100" />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>
          </div>
          <div className="text-start">
            <button className="btn btn-primary btn-lg" onClick={handleNextStep}>التالي ←</button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="card p-4">
          <h3 className="mb-4">بيانات العجلة</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <button className="btn btn-primary btn-lg w-100 py-4" onClick={() => { setPlateType('english'); setCurrentStep(3); }}>
                <div style={{ fontSize: '24px' }}>🔤</div>
                <div>رقم انكليزي</div>
              </button>
            </div>
            <div className="col-md-6 mb-3">
              <button className="btn btn-success btn-lg w-100 py-4" onClick={() => { setPlateType('arabic'); setCurrentStep(3); }}>
                <div style={{ fontSize: '24px' }}>🔢</div>
                <div>رقم عربي</div>
              </button>
            </div>
          </div>
          <div className="text-start">
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>→ رجوع</button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="card p-4">
          <h3 className="mb-4">
            {plateType === 'english' ? 'رقم العجلة الانكليزي' : 'رقم العجلة العربي'}
          </h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">المحافظة *</label>
              <select className={`form-select text-right ${errors.plateGovernorate ? 'is-invalid' : ''}`} value={formData.plateGovernorate} onChange={(e) => handleInputChange('plateGovernorate', e.target.value)}>
                <option value="">اختر المحافظة</option>
                {iraqGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.name}>{gov.name}</option>
                ))}
              </select>
              {errors.plateGovernorate && <div className="invalid-feedback">{errors.plateGovernorate}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الحرف *</label>
              <select className={`form-select text-right ${errors.plateLetter ? 'is-invalid' : ''}`} value={formData.plateLetter} onChange={(e) => handleInputChange('plateLetter', e.target.value)}>
                <option value="">اختر الحرف</option>
                {(plateType === 'english' ? englishLetters : arabicLetters).map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
              {errors.plateLetter && <div className="invalid-feedback">{errors.plateLetter}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">
                {plateType === 'english' ? 'الرقم (5 أرقام) *' : 'رقم العجلة *'}
              </label>
              <input type="text" className={`form-control text-right ${errors.plateNumber ? 'is-invalid' : ''}`} value={formData.plateNumber} onChange={(e) => {
                const value = plateType === 'english' ? e.target.value.replace(/\D/g, '').slice(0, 5) : e.target.value;
                handleInputChange('plateNumber', value);
              }} maxLength={plateType === 'english' ? 5 : 10} />
              {errors.plateNumber && <div className="invalid-feedback">{errors.plateNumber}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">نوع العجلة *</label>
              <select className={`form-select text-right ${errors.wheelType ? 'is-invalid' : ''}`} value={formData.wheelType} onChange={(e) => handleInputChange('wheelType', e.target.value)}>
                <option value="">اختر النوع</option>
                {wheelTypes.map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
              {errors.wheelType && <div className="invalid-feedback">{errors.wheelType}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم المالك *</label>
              <input type="text" className={`form-control text-right ${errors.ownerName ? 'is-invalid' : ''}`} value={formData.ownerName} onChange={(e) => handleInputChange('ownerName', e.target.value)} maxLength="50" />
              {errors.ownerName && <div className="invalid-feedback">{errors.ownerName}</div>}
            </div>
          </div>
          <div className="d-flex justify-content-start gap-2">
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>→ رجوع</button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? '⏳ جاري الحفظ...' : isAddingVehicle ? 'حفظ العجلة الجديدة' : isEditing ? 'تحديث البيانات' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="card p-5 text-center">
          <div style={{ fontSize: '64px' }}>✅</div>
          <h3 className="mt-3">
            {isAddingVehicle ? 'تم إضافة العجلة بنجاح!' : isEditing ? 'تم تحديث البيانات بنجاح!' : 'تم حفظ البيانات بنجاح!'}
          </h3>
          <p className="mt-3">تم تسجيل بياناتك بنجاح.</p>
          
          <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
            <button className="btn btn-warning btn-lg" onClick={openEditDriverModal}>👤 تعديل بيانات السائق</button>
            <button className="btn btn-success btn-lg" onClick={handleAddVehicle}>🚗 إضافة عجلة جديدة</button>
            <button className="btn btn-info btn-lg" onClick={handleViewData}>👁️ عرض البيانات</button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/driver-login')}>العودة لتسجيل الدخول</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLink;
