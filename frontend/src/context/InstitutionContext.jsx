import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/Slices/authSlice';

const InstitutionContext = createContext(null);

export const INSTITUTION_TYPES = {
  SCHOOL: 'School',
  UNIVERSITY: 'University',
  COLLEGE: 'College',
};

// Safe client JWT decoder
const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

export const normalizeInstitutionType = (rawType) => {
  if (!rawType) return INSTITUTION_TYPES.SCHOOL;
  const str = String(rawType).trim().toLowerCase();
  if (str === 'university') return INSTITUTION_TYPES.UNIVERSITY;
  if (str === 'college') return INSTITUTION_TYPES.COLLEGE;
  return INSTITUTION_TYPES.SCHOOL;
};

export const InstitutionProvider = ({ children }) => {
  const user = useSelector(selectCurrentUser);

  // Read real token payload
  const token = typeof window !== 'undefined' ? localStorage.getItem('eduHubToken') : null;
  const tokenPayload = useMemo(() => parseJwtPayload(token), [token]);

  // Determine real institute details from backend user or token
  const realType = useMemo(() => {
    const raw =
      user?.instituteId?.type ||
      user?.campusId?.instituteId?.type ||
      tokenPayload?.instituteType;
    return normalizeInstitutionType(raw);
  }, [user, tokenPayload]);

  const [institutionType, setInstitutionTypeState] = useState(realType);

  // Always stay in sync with real authenticated user/token
  useEffect(() => {
    if (realType) {
      setInstitutionTypeState(realType);
    }
  }, [realType]);

  const setInstitutionType = (type) => {
    const normalized = normalizeInstitutionType(type);
    setInstitutionTypeState(normalized);
    localStorage.setItem('eduHubInstitutionType', normalized);
  };

  const toggleInstitutionType = () => {
    const nextType = institutionType === INSTITUTION_TYPES.SCHOOL
      ? INSTITUTION_TYPES.UNIVERSITY
      : INSTITUTION_TYPES.SCHOOL;
    setInstitutionType(nextType);
  };

  const isSchool = institutionType === INSTITUTION_TYPES.SCHOOL;
  const isUniversity = institutionType === INSTITUTION_TYPES.UNIVERSITY;
  const isCollege = institutionType === INSTITUTION_TYPES.COLLEGE;

  const instituteName =
    user?.instituteId?.name ||
    user?.campusId?.instituteId?.name ||
    tokenPayload?.instituteName ||
    'School';

  const instituteBoard =
    user?.instituteId?.board ||
    user?.campusId?.instituteId?.board ||
    tokenPayload?.instituteBoard ||
    '';

  const userRole = user?.role || tokenPayload?.role || '';

  const value = {
    institutionType,
    setInstitutionType,
    toggleInstitutionType,
    isSchool,
    isUniversity,
    isCollege,
    instituteName,
    instituteBoard,
    userRole,
  };

  return (
    <InstitutionContext.Provider value={value}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = () => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};

export default InstitutionContext;
