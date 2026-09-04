import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const ViewData = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPlate, setSearchPlate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '', fatherName: '', grandfatherName: '', greatGrandfatherName: '',
    lastName: '', motherName: '', nationalId: '', birthDate: '',
    governorate: '', address: '', plateGovernorate: '', plateLetter: '',
    plateNumber: '', wheelType: '', ownerName: ''
  });

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  const canEdit = permissions.editVehicleData === true || isAdmin;
  const canDelete = permissions.deleteVehicleData === true || isAdmin;
  const canExportExcel = permissions.exportExcel === true || isAdmin;
  const canExportPDF = permissions.exportPDF === true || isAdmin;
  const canExportAccess = permissions.exportAccess === true || isAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/vehicle-data`);
      setAllData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSearch = () => {
    let filtered = [...allData];
    if (fromDate && toDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= new Date(fromDate) && itemDate <= new Date(toDate);
      });
    }
    if (searchName) {
      filtered = filtered.filter(item => {
        const fullName = `${item.firstName} ${item.fatherName} ${item.grandfatherName} ${item.greatGrandfatherName} ${item.lastName}`;
        return fullName.includes(searchName);
      });
    }
    if (searchPlate) {
      filtered = filtered.filter(item => {
        const plateNumber = formatPlateNumber(item);
        return plateNumber.includes(searchPlate);
      });
    }
    setFilteredData(filtered);
  };

  const formatPlateNumber = (item) => {
    if (item.plateType === 'english') {
      const govCode = getGovernorateCode(item.plateGovernorate);
      return `${govCode}${item.plateLetter}${item.plateNumber}`;
    } else {
      return `${item.plateLetter}${item.plateNumber}`;
    }
  };

  const getGovernorateCode = (governorateName) => {
    const governorates = {
      'بغداد': '1', 'البصرة': '2', 'نينوى': '3', 'أربيل': '4',
      'السليمانية': '21', 'دهوك': '6', 'كركوك': '7', 'ديالى': '8',
      'الأنبار': '9', 'بابل': '10', 'كربلاء': '11', 'النجف': '28',
      'القادسية': '13', 'المثنى': '14', 'ذي قار': '15', 'ميسان': '16',
      'واسط': '17', 'صلاح الدين': '18'
    };
    return governorates[governorateName] || '';
  };

  const exportToExcel = async () => {
    if (!canExportExcel) {
      alert('ليس لديك صلاحية تصدير Excel');
      return;
    }
    if (filteredData.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('بيانات العجلات', {
      views: [{ rightToLeft: true, showGridLines: true }]
    });

    worksheet.columns = [
      { header: 'ت', key: 'seq', width: 8 },
      { header: 'الاسم الأول', key: 'firstName', width: 15 },
      { header: 'اسم الأب', key: 'fatherName', width: 15 },
      { header: 'الجد', key: 'grandfatherName', width: 15 },
      { header: 'أب الجد', key: 'greatGrandfatherName', width: 15 },
      { header: 'اللقب', key: 'lastName', width: 15 },
      { header: 'الاسم الكامل', key: 'fullName', width: 40 },
      { header: 'اسم الأم الثلاثي', key: 'motherName', width: 25 },
      { header: 'تاريخ الولادة', key: 'birthDate', width: 15 },
      { header: 'محافظة السكن', key: 'governorate', width: 20 },
      { header: 'العنوان', key: 'address', width: 30 },
      { header: 'رقم البطاقة', key: 'nationalId', width: 20 },
      { header: 'رقم العجلة', key: 'plateNumber', width: 20 },
      { header: 'العائدية', key: 'plateGovernorate', width: 20 },
      { header: 'نوع العجلة', key: 'wheelType', width: 20 },
      { header: 'المالك', key: 'ownerName', width: 25 }
    ];

    filteredData.forEach((item, index) => {
      worksheet.addRow({
        seq: index + 1,
        firstName: item.firstName || '',
        fatherName: item.fatherName || '',
        grandfatherName: item.grandfatherName || '',
        greatGrandfatherName: item.greatGrandfatherName || '',
        lastName: item.lastName || '',
        fullName: `${item.firstName || ''} ${item.fatherName || ''} ${item.grandfatherName || ''} ${item.greatGrandfatherName || ''} ${item.lastName || ''}`.trim(),
        motherName: item.motherName || '',
        birthDate: item.birthDate || '',
        governorate: item.governorate || '',
        address: item.address || '',
        nationalId: item.nationalId || '',
        plateNumber: formatPlateNumber(item),
        plateGovernorate: item.plateGovernorate || '',
        wheelType: item.wheelType || '',
        ownerName: item.ownerName || ''
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    worksheet.getRow(1).height = 30;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.font = { size: 11 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
          }
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'بيانات_العجلات.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!canExportPDF) {
      alert('ليس لديك صلاحية تصدير PDF');
      return;
    }
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('بيانات العجلات المدخلة', 150, 15, { align: 'center' });

    doc.autoTable({
      head: [[
        'ت', 'الاسم الكامل', 'اسم الأم', 'تاريخ الولادة', 'المحافظة',
        'العنوان', 'رقم البطاقة', 'رقم العجلة', 'العائدية', 'النوع', 'المالك'
      ]],
      body: filteredData.map((item, index) => [
        index + 1,
        `${item.firstName} ${item.fatherName} ${item.grandfatherName} ${item.greatGrandfatherName} ${item.lastName}`,
        item.motherName, item.birthDate, item.governorate, item.address,
        item.nationalId, formatPlateNumber(item), item.plateGovernorate,
        item.wheelType, item.ownerName
      ]),
      startY: 25,
      styles: { fontSize: 8, halign: 'right' },
      headStyles: { fillColor: [52, 58, 64], textColor: [255, 255, 255], halign: 'right' }
    });

    doc.save('بيانات_العجلات.pdf');
  };

  const exportToAccess = async () => {
    if (!canExportAccess) {
      alert('ليس لديك صلاحية تصدير Access');
      return;
    }
    if (filteredData.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    setExporting(true);

    try {
      const response = await axios.post(
        `${config.apiUrl}/export-to-access`,
        { data: filteredData },
        { responseType: 'blob', timeout: 120000 }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'empty-database.accdb');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('تم تصدير ملف Access بنجاح!');
    } catch (error) {
      console.error('Error:', error);
      alert('خطأ في التصدير');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      alert('ليس لديك صلاحية الحذف');
      return;
    }
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await axios.delete(`${config.apiUrl}/vehicle-data/${id}`);
        alert('تم الحذف بنجاح');
        fetchData();
      } catch (error) {
        alert('خطأ في الحذف');
      }
    }
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      alert('ليس لديك صلاحية التعديل');
      return;
    }
    setEditingItem(item);
    setEditForm({
      firstName: item.firstName || '',
      fatherName: item.fatherName || '',
      grandfatherName: item.grandfatherName || '',
      greatGrandfatherName: item.greatGrandfatherName || '',
      lastName: item.lastName || '',
      motherName: item.motherName || '',
      nationalId: item.nationalId || '',
      birthDate: item.birthDate || '',
      governorate: item.governorate || '',
      address: item.address || '',
      plateGovernorate: item.plateGovernorate || '',
      plateLetter: item.plateLetter || '',
      plateNumber: item.plateNumber || '',
      wheelType: item.wheelType || '',
      ownerName: item.ownerName || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`${config.apiUrl}/vehicle-data/${editingItem.id}`, editForm);
      alert('تم التعديل بنجاح');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      alert('خطأ في التعديل: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="container-fluid" dir="rtl" style={{ textAlign: 'right' }}>
      <h2 className="mb-4">البيانات المدخلة</h2>

      <div className="card p-3 mb-4">
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label>من تاريخ</Form.Label>
              <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>إلى تاريخ</Form.Label>
              <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>بحث باسم السائق</Form.Label>
              <Form.Control type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="أدخل اسم السائق" />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>بحث برقم العجلة</Form.Label>
              <Form.Control type="text" value={searchPlate} onChange={(e) => setSearchPlate(e.target.value)} placeholder="أدخل رقم العجلة" />
            </Form.Group>
          </Col>
        </Row>
        <div className="d-flex justify-content-between mt-3">
          <div>
            <Button variant="primary" onClick={handleSearch}>🔍 بحث</Button>
            <Button variant="secondary" className="ms-2" onClick={() => {
              setFromDate('');
              setToDate('');
              setSearchName('');
              setSearchPlate('');
              setFilteredData(allData);
            }}>🔄 إعادة تعيين</Button>
          </div>
          <div>
            {canExportExcel && (
              <Button variant="success" className="me-2" onClick={exportToExcel}>📊 تصدير Excel</Button>
            )}
            {canExportPDF && (
              <Button variant="danger" className="me-2" onClick={exportToPDF}>📄 تصدير PDF</Button>
            )}
            {canExportAccess && (
              <Button variant="info" onClick={exportToAccess} disabled={exporting}>
                {exporting ? '⏳ جاري التصدير...' : '💾 تصدير Access'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-3">
        <div className="table-responsive">
          <Table striped bordered hover style={{ direction: 'rtl', textAlign: 'right' }}>
            <thead className="bg-dark text-white">
              <tr>
                <th>ت</th>
                <th>الاسم الكامل</th>
                <th>اسم الأم الثلاثي</th>
                <th>تاريخ الولادة</th>
                <th>محافظة السكن</th>
                <th>العنوان</th>
                <th>رقم البطاقة</th>
                <th>رقم الهاتف</th>
                <th>رقم العجلة</th>
                <th>العائدية</th>
                <th>نوع العجلة</th>
                <th>المالك</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center py-4">لا توجد بيانات</td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.firstName} {item.fatherName} {item.grandfatherName} {item.greatGrandfatherName} {item.lastName}</td>
                    <td>{item.motherName}</td>
                    <td>{item.birthDate}</td>
                    <td>{item.governorate}</td>
                    <td>{item.address}</td>
                    <td>{item.nationalId}</td>
                    <td dir="ltr" style={{ fontFamily: 'monospace' }}>{item.phoneNumber || '-'}</td>
                    <td style={{ direction: 'ltr', fontFamily: 'monospace' }}>{formatPlateNumber(item)}</td>
                    <td>{item.plateGovernorate}</td>
                    <td>{item.wheelType}</td>
                    <td>{item.ownerName}</td>
                    <td>
                      {canEdit && (
                        <Button variant="warning" size="sm" className="me-1 mb-1" onClick={() => handleEdit(item)}>✏️ تعديل</Button>
                      )}
                      {canDelete && (
                        <Button variant="danger" size="sm" className="me-1 mb-1" onClick={() => handleDelete(item.id)}>🗑️ حذف</Button>
                      )}
                      {!canEdit && !canDelete && (
                        <span className="text-muted">لا توجد صلاحيات</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* نافذة التعديل */}
      {showEditModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', direction: 'rtl' }}>
          <div className="modal-dialog modal-lg" dir="rtl">
            <div className="modal-content" style={{ textAlign: 'right' }}>
              <div className="modal-header">
                <h5 className="modal-title">تعديل البيانات</h5>
                <button type="button" className="btn-close ms-0 me-auto" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <Row>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">الاسم الأول</label>
                    <input type="text" className="form-control text-right" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">اسم الأب</label>
                    <input type="text" className="form-control text-right" value={editForm.fatherName} onChange={(e) => setEditForm({...editForm, fatherName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">الجد</label>
                    <input type="text" className="form-control text-right" value={editForm.grandfatherName} onChange={(e) => setEditForm({...editForm, grandfatherName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">أب الجد</label>
                    <input type="text" className="form-control text-right" value={editForm.greatGrandfatherName} onChange={(e) => setEditForm({...editForm, greatGrandfatherName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">اللقب</label>
                    <input type="text" className="form-control text-right" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">اسم الأم الثلاثي</label>
                    <input type="text" className="form-control text-right" value={editForm.motherName} onChange={(e) => setEditForm({...editForm, motherName: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">رقم البطاقة</label>
                    <input type="text" className="form-control text-right" value={editForm.nationalId} onChange={(e) => setEditForm({...editForm, nationalId: e.target.value.replace(/\D/g, '').slice(0, 12)})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">تاريخ الولادة</label>
                    <input type="date" className="form-control text-right" value={editForm.birthDate} onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">محافظة السكن</label>
                    <input type="text" className="form-control text-right" value={editForm.governorate} onChange={(e) => setEditForm({...editForm, governorate: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">العنوان</label>
                    <input type="text" className="form-control text-right" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">رقم العجلة</label>
                    <input type="text" className="form-control text-right" value={editForm.plateNumber} onChange={(e) => setEditForm({...editForm, plateNumber: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">نوع العجلة</label>
                    <input type="text" className="form-control text-right" value={editForm.wheelType} onChange={(e) => setEditForm({...editForm, wheelType: e.target.value})} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <label className="form-label d-block text-right">المالك</label>
                    <input type="text" className="form-control text-right" value={editForm.ownerName} onChange={(e) => setEditForm({...editForm, ownerName: e.target.value})} />
                  </Col>
                </Row>
              </div>
              <div className="modal-footer d-flex justify-content-start">
                <button className="btn btn-primary ms-2" onClick={handleEditSubmit}>حفظ التعديلات</button>
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewData;
