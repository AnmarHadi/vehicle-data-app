import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [wheelTypes, setWheelTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicleData, setVehicleData] = useState([]);

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

  const fetchWheelTypes = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/wheel-types`);
      setWheelTypes(response.data);
    } catch (error) {
      console.error('Error fetching wheel types:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/users/all`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchVehicleData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/vehicle-data`);
      setVehicleData(response.data);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    }
  };

  useEffect(() => {
    fetchWheelTypes();
    fetchUsers();
    fetchVehicleData();
  }, []);

  const addWheelType = async (name) => {
    try {
      const response = await axios.post(`${config.apiUrl}/wheel-types`, { name });
      await fetchWheelTypes();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في الإضافة' };
    }
  };

  const updateWheelType = async (id, name) => {
    try {
      await axios.put(`${config.apiUrl}/wheel-types/${id}`, { name });
      await fetchWheelTypes();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في التعديل' };
    }
  };

  const deleteWheelType = async (id) => {
    try {
      await axios.delete(`${config.apiUrl}/wheel-types/${id}`);
      await fetchWheelTypes();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في الحذف' };
    }
  };

  const addUser = async (userData) => {
    try {
      const response = await axios.post(`${config.apiUrl}/users`, {
        ...userData,
        password: '000000'
      });
      await fetchUsers();
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في إضافة المستخدم' };
    }
  };

  const updateUser = async (id, userData) => {
    try {
      await axios.put(`${config.apiUrl}/users/${id}`, userData);
      await fetchUsers();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في تعديل المستخدم' };
    }
  };

  const resetPassword = async (id) => {
    try {
      await axios.post(`${config.apiUrl}/users/${id}/reset-password`);
      await fetchUsers();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في إعادة تعيين كلمة المرور' };
    }
  };

  const saveVehicleData = async (data) => {
    try {
      const response = await axios.post(`${config.apiUrl}/vehicle-data`, data);
      await fetchVehicleData();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'خطأ في حفظ البيانات' };
    }
  };

  return (
    <DataContext.Provider value={{
      wheelTypes,
      users,
      vehicleData,
      iraqGovernorates,
      addWheelType,
      updateWheelType,
      deleteWheelType,
      addUser,
      updateUser,
      resetPassword,
      saveVehicleData,
      fetchWheelTypes,
      fetchUsers,
      fetchVehicleData
    }}>
      {children}
    </DataContext.Provider>
  );
};