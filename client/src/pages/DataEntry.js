// src/pages/DataEntry.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DataEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { iraqGovernorates, wheelTypes, saveVehicleData } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [plateType, setPlateType] = useState(null);
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
    ownerName: ''
  });

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  // التحقق من صلاحية الحفظ
  const canSave = permissions.saveDataEntry === true || permissions.dataEntry === true || isAdmin;

  const validateName = (value) => {
    return value.trim() === value && !value.includes(' ');
  };

  const validateLastName = (value) => {
    const trimmed = value.trim();
    const words = trimmed.split(' ');
    return trimmed === value && words.length <= 2;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const isPage1Valid = () => {
    return (
      validateName(formData.firstName) &&
      validateName(formData.fatherName) &&
      validateName(formData.grandfatherName) &&
      validateName(formData.greatGrandfatherName) &&
      validateLastName(formData.lastName) &&
      formData.motherName.trim() === formData.motherName &&
      /^\d{12}$/.test(formData.nationalId) &&
      formData.birthDate &&
      formData.governorate &&
      formData.address.trim() === formData.address
    );
  };

  const handleNextPage = () => {
    if (isPage1Valid()) {
      setCurrentPage(2);
    } else {
      alert('يرجى ملء جميع الحقول بشكل صحيح');
    }
  };

  const handlePlateType = (type) => {
    setPlateType(type);
    setCurrentPage(3);
  };

  const handleSave = async () => {
    if (!canSave) {
      alert('ليس لديك صلاحية الحفظ');
      return;
    }
    const result = await saveVehicleData(formData);
    if (result.success) {
      setCurrentPage(4);
    } else {
      alert(result.message);
    }
  };

  const englishLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const arabicLetters = 'أبجدهوزحطيكلمنسعفصقرشتثخذضظغ'.split('');

  return (
    <div className="container" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="mb-4">إدخال البيانات</h2>

      {currentPage === 1 && (
        <div>
          <h3>بيانات السائق</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الاسم الأول</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="كلمة واحدة بدون مسافات"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم الأب</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                placeholder="كلمة واحدة بدون مسافات"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الجد</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.grandfatherName}
                onChange={(e) => handleInputChange('grandfatherName', e.target.value)}
                placeholder="كلمة واحدة بدون مسافات"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">أب الجد</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.greatGrandfatherName}
                onChange={(e) => handleInputChange('greatGrandfatherName', e.target.value)}
                placeholder="كلمة واحدة بدون مسافات"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اللقب</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="يمكن أن يتكون من مقطعين"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم الأم الثلاثي</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.motherName}
                onChange={(e) => handleInputChange('motherName', e.target.value)}
                placeholder="اسم الأم الثلاثي"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">رقم البطاقة الموحدة</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12 رقم"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">تاريخ الولادة</label>
              <input
                type="date"
                className="form-control text-right"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">محافظة السكن</label>
              <select
                className="form-select text-right"
                value={formData.governorate}
                onChange={(e) => handleInputChange('governorate', e.target.value)}
              >
                <option value="">اختر المحافظة</option>
                {iraqGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.name}>{gov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم المنطقة والعنوان الدقيق</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>
          <div className="text-start">
            <button
              className="btn btn-primary"
              onClick={handleNextPage}
              disabled={!isPage1Valid()}
            >
              الانتقال إلى صفحة بيانات العجلة ←
            </button>
          </div>
        </div>
      )}

      {currentPage === 2 && (
        <div>
          <h3>بيانات العجلة</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <button
                className="btn btn-primary btn-lg w-100"
                onClick={() => handlePlateType('english')}
              >
                رقم انكليزي
              </button>
            </div>
            <div className="col-md-6 mb-3">
              <button
                className="btn btn-success btn-lg w-100"
                onClick={() => handlePlateType('arabic')}
              >
                رقم عربي
              </button>
            </div>
          </div>
          <div className="text-start">
            <button className="btn btn-secondary" onClick={() => setCurrentPage(1)}>
              → رجوع
            </button>
          </div>
        </div>
      )}

      {currentPage === 3 && plateType === 'english' && (
        <div>
          <h3>رقم العجلة الانكليزي</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">المحافظة ورقم المحافظة</label>
              <select
                className="form-select text-right"
                value={formData.plateGovernorate}
                onChange={(e) => handleInputChange('plateGovernorate', e.target.value)}
              >
                <option value="">اختر المحافظة</option>
                {iraqGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.name}>
                    {gov.name} - {gov.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الحرف</label>
              <select
                className="form-select text-right"
                value={formData.plateLetter}
                onChange={(e) => handleInputChange('plateLetter', e.target.value)}
              >
                <option value="">اختر الحرف</option>
                {englishLetters.map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الرقم</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.plateNumber}
                onChange={(e) => handleInputChange('plateNumber', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="5 أرقام"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">نوع العجلة</label>
              <select
                className="form-select text-right"
                value={formData.wheelType}
                onChange={(e) => handleInputChange('wheelType', e.target.value)}
              >
                <option value="">اختر النوع</option>
                {wheelTypes.map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">اسم المالك</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex justify-content-start gap-2">
            {canSave && (
              <button className="btn btn-primary" onClick={handleSave}>حفظ</button>
            )}
            <button className="btn btn-secondary" onClick={() => setCurrentPage(2)}>→ رجوع</button>
          </div>
        </div>
      )}

      {currentPage === 3 && plateType === 'arabic' && (
        <div>
          <h3>رقم العجلة العربي</h3>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">المحافظة</label>
              <select
                className="form-select text-right"
                value={formData.plateGovernorate}
                onChange={(e) => handleInputChange('plateGovernorate', e.target.value)}
              >
                <option value="">اختر المحافظة</option>
                {iraqGovernorates.map((gov) => (
                  <option key={gov.code} value={gov.name}>{gov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">الحرف</label>
              <select
                className="form-select text-right"
                value={formData.plateLetter}
                onChange={(e) => handleInputChange('plateLetter', e.target.value)}
              >
                <option value="">اختر الحرف</option>
                {arabicLetters.map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">رقم العجلة</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.plateNumber}
                onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">نوع</label>
              <select
                className="form-select text-right"
                value={formData.wheelType}
                onChange={(e) => handleInputChange('wheelType', e.target.value)}
              >
                <option value="">اختر النوع</option>
                {wheelTypes.map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label d-block text-right">مالك العجلة</label>
              <input
                type="text"
                className="form-control text-right"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex justify-content-start gap-2">
            {canSave && (
              <button className="btn btn-primary" onClick={handleSave}>حفظ</button>
            )}
            <button className="btn btn-secondary" onClick={() => setCurrentPage(2)}>→ إلغاء</button>
          </div>
        </div>
      )}

      {currentPage === 4 && (
        <div>
          <h3>تم حفظ البيانات بنجاح</h3>
          <div className="card">
            <div className="card-body">
              <h5>ملخص البيانات المدخلة:</h5>
              <p><strong>الاسم الكامل:</strong> {formData.firstName} {formData.fatherName} {formData.grandfatherName} {formData.greatGrandfatherName} {formData.lastName}</p>
              <p><strong>اسم الأم:</strong> {formData.motherName}</p>
              <p><strong>رقم البطاقة:</strong> {formData.nationalId}</p>
              <p><strong>تاريخ الولادة:</strong> {formData.birthDate}</p>
              <p><strong>المحافظة:</strong> {formData.governorate}</p>
              <p><strong>العنوان:</strong> {formData.address}</p>
              <p><strong>رقم العجلة:</strong> {formData.plateGovernorate} - {formData.plateLetter} - {formData.plateNumber}</p>
              <p><strong>نوع العجلة:</strong> {formData.wheelType}</p>
              <p><strong>المالك:</strong> {formData.ownerName}</p>
            </div>
          </div>
          <div className="text-start">
            <button className="btn btn-primary mt-3 me-2">حفظ</button>
            <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>عودة</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntry;
