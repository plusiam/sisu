/**
 * SISU 교사 시수 관리 시스템 - Google Apps Script Web App
 *
 * 버전: 3.0 (전체 시트 연동)
 *
 * 지원 시트:
 * - 설정: 기본시수, 수석감면율, 시수편차허용
 * - 학교정보: 학교명, 학년도, 학년별 학급수
 * - 교과: 교과별 학년별 시수
 * - 장소: 특별실/공용실 정보
 * - 교시: 수업 시간표
 * - 교사시수: 교사 데이터 (양방향 동기화)
 */

// 시트 이름 상수
const SHEETS = {
  SETTINGS: '설정',
  SCHOOL_INFO: '학교정보',
  SUBJECTS: '교과',
  ROOMS: '장소',
  PERIODS: '교시',
  TEACHERS: '교사시수',
  TIMETABLE: '시간표'
};

/**
 * GET 요청: 전체 데이터 가져오기
 */
function doGet(e) {
  try {
    const action = e?.parameter?.action || 'all';

    switch (action) {
      case 'settings':
        return createResponse(true, { settings: getSettings() });
      case 'schoolInfo':
        return createResponse(true, { schoolInfo: getSchoolInfo() });
      case 'subjects':
        return createResponse(true, { subjects: getSubjects() });
      case 'rooms':
        return createResponse(true, { rooms: getRooms() });
      case 'periods':
        return createResponse(true, { periods: getPeriods() });
      case 'teachers':
        return createResponse(true, { teachers: getTeachers() });
      case 'timetable':
        return createResponse(true, { timetable: getTimetable() });
      case 'all':
      default:
        return createResponse(true, getAllData());
    }
  } catch (error) {
    return createResponse(false, null, error.message);
  }
}

/**
 * POST 요청: 데이터 저장
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'teachers';

    switch (action) {
      case 'teachers':
        return saveTeachers(payload.teachers);
      case 'timetable':
        return saveTimetable(payload.timetable);
      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error) {
    return createResponse(false, null, error.message);
  }
}

/**
 * 교사 데이터 저장
 */
function saveTeachers(teachers) {
  if (!Array.isArray(teachers)) {
    throw new Error('teachers must be an array');
  }

  const sheet = getOrCreateTeacherSheet();

  // 기존 데이터 삭제 (헤더 제외)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // 새 데이터 삽입
  if (teachers.length > 0) {
    const rows = teachers.map(t => [
      t.id,
      t.name,
      t.type,
      t.grade || '',
      Array.isArray(t.grades) ? t.grades.join(',') : '',
      t.classNumber || '',
      Array.isArray(t.subjects) ? t.subjects.join(', ') : '',
      t.customSubject || '',
      t.basicTeaching || 0,
      t.adminWork || 0,
      t.training || 0,
      t.consulting || 0,
      t.other || 0,
      t.notes || '',
      t.lastModified || Date.now(),
      t.createdAt || Date.now(),
      t.updatedAt || Date.now(),
    ]);

    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createResponse(true, { count: teachers.length });
}

/**
 * 시간표 데이터 저장
 */
function saveTimetable(slots) {
  if (!Array.isArray(slots)) {
    throw new Error('timetable must be an array');
  }

  const sheet = getOrCreateTimetableSheet();

  // 기존 데이터 삭제 (헤더 제외)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // 새 데이터 삽입
  if (slots.length > 0) {
    const rows = slots.map(s => [
      s.id,
      s.day,
      s.period,
      s.grade,
      s.classNumber,
      s.teacherId,
      s.teacherName,
      s.subject,
      s.room || '',
      s.note || ''
    ]);

    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createResponse(true, { count: slots.length });
}

/**
 * 전체 데이터 가져오기
 */
function getAllData() {
  return {
    settings: getSettings(),
    schoolInfo: getSchoolInfo(),
    subjects: getSubjects(),
    rooms: getRooms(),
    periods: getPeriods(),
    teachers: getTeachers(),
    timetable: getTimetable()
  };
}

/**
 * 시간표 시트 읽기
 */
function getTimetable() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TIMETABLE);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // 헤더: ID, 요일, 교시, 학년, 반, 교사ID, 교사명, 교과, 장소, 메모
  return data.slice(1)
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      day: row[1],
      period: Number(row[2]),
      grade: Number(row[3]),
      classNumber: Number(row[4]),
      teacherId: row[5],
      teacherName: row[6],
      subject: row[7],
      room: row[8] || '',
      note: row[9] || ''
    }));
}

/**
 * 시간표 시트 가져오기 또는 생성
 */
function getOrCreateTimetableSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.TIMETABLE);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.TIMETABLE);
    initializeTimetableSheet(sheet);
  }

  return sheet;
}

/**
 * 시간표 시트 초기화 (헤더 생성)
 */
function initializeTimetableSheet(sheet) {
  const headers = [
    'ID', '요일', '교시', '학년', '반',
    '교사ID', '교사명', '교과', '장소', '메모'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeader(sheet, headers.length);

  // 컬럼 너비 조정
  sheet.setColumnWidth(1, 120);  // ID
  sheet.setColumnWidth(2, 50);   // 요일
  sheet.setColumnWidth(3, 50);   // 교시
  sheet.setColumnWidth(4, 50);   // 학년
  sheet.setColumnWidth(5, 50);   // 반
  sheet.setColumnWidth(6, 120);  // 교사ID
  sheet.setColumnWidth(7, 80);   // 교사명
  sheet.setColumnWidth(8, 80);   // 교과
  sheet.setColumnWidth(9, 80);   // 장소
  sheet.setColumnWidth(10, 150); // 메모
}

/**
 * 설정 시트 읽기
 */
function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return getDefaultSettings();

  const data = sheet.getDataRange().getValues();
  const settings = {};

  // 헤더 제외하고 키-값 쌍으로 파싱
  data.slice(1).forEach(row => {
    if (row[0]) {
      settings[row[0]] = row[1];
    }
  });

  return {
    기본시수: Number(settings['기본시수']) || 22,
    수석감면율: Number(settings['수석감면율']) || 50,
    시수편차허용: Number(settings['시수편차허용']) || 2,
    담임기준시수: Number(settings['담임기준시수']) || Number(settings['기본시수']) || 22,
    전담기준시수: Number(settings['전담기준시수']) || Number(settings['기본시수']) || 22
  };
}

function getDefaultSettings() {
  return {
    기본시수: 22,
    수석감면율: 50,
    시수편차허용: 2,
    담임기준시수: 22,
    전담기준시수: 22
  };
}

/**
 * 학교정보 시트 읽기
 */
function getSchoolInfo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SCHOOL_INFO);
  if (!sheet) return getDefaultSchoolInfo();

  const data = sheet.getDataRange().getValues();
  const info = {};

  // 헤더 제외하고 키-값 쌍으로 파싱
  data.slice(1).forEach(row => {
    if (row[0]) {
      info[row[0]] = row[1];
    }
  });

  return {
    schoolName: info['학교명'] || '',
    year: Number(info['학년도']) || new Date().getFullYear(),
    classesByGrade: {
      1: Number(info['1학년']) || 0,
      2: Number(info['2학년']) || 0,
      3: Number(info['3학년']) || 0,
      4: Number(info['4학년']) || 0,
      5: Number(info['5학년']) || 0,
      6: Number(info['6학년']) || 0
    }
  };
}

function getDefaultSchoolInfo() {
  return {
    schoolName: '',
    year: new Date().getFullYear(),
    classesByGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  };
}

/**
 * 교과 시트 읽기
 */
function getSubjects() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SUBJECTS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // 헤더: ID, 교과명, 1학년, 2학년, 3학년, 4학년, 5학년, 6학년, 기본장소, 비고
  return data.slice(1)
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      name: row[1],
      hoursByGrade: {
        1: Number(row[2]) || 0,
        2: Number(row[3]) || 0,
        3: Number(row[4]) || 0,
        4: Number(row[5]) || 0,
        5: Number(row[6]) || 0,
        6: Number(row[7]) || 0
      },
      defaultRoom: row[8] || '',
      note: row[9] || ''
    }));
}

/**
 * 장소 시트 읽기
 */
function getRooms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ROOMS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // 헤더: ID, 장소명, 유형, 수용학급, 사용교과, 비고
  return data.slice(1)
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      name: row[1],
      type: row[2],
      capacity: Number(row[3]) || 1,
      subject: row[4] || '',
      note: row[5] || ''
    }));
}

/**
 * 교시 시트 읽기
 */
function getPeriods() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PERIODS);
  if (!sheet) return getDefaultPeriods();

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return getDefaultPeriods();

  // 헤더: 교시, 시작시간, 종료시간
  return data.slice(1)
    .filter(row => row[0])
    .map(row => ({
      period: Number(row[0]),
      startTime: formatTime(row[1]),
      endTime: formatTime(row[2])
    }));
}

function getDefaultPeriods() {
  return [
    { period: 1, startTime: '09:00', endTime: '09:40' },
    { period: 2, startTime: '09:50', endTime: '10:30' },
    { period: 3, startTime: '10:50', endTime: '11:30' },
    { period: 4, startTime: '11:40', endTime: '12:20' },
    { period: 5, startTime: '13:20', endTime: '14:00' },
    { period: 6, startTime: '14:10', endTime: '14:50' }
  ];
}

/**
 * 시간 포맷팅 (Date 객체 또는 문자열 → "HH:MM")
 */
function formatTime(value) {
  if (!value) return '';

  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, '0');
    const m = value.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  return String(value);
}

/**
 * 교사시수 시트 읽기
 */
function getTeachers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TEACHERS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // 헤더 확인
  const headers = data[0];
  const hasNewColumns = headers.includes('담당학년들');

  if (!hasNewColumns) {
    // 구 버전 컬럼 구조
    return data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        name: row[1],
        type: row[2],
        grade: row[3] || null,
        grades: [],
        classNumber: row[4] || null,
        subjects: row[5] ? String(row[5]).split(',').map(s => s.trim()) : [],
        customSubject: '',
        basicTeaching: Number(row[6]) || 0,
        adminWork: Number(row[7]) || 0,
        training: Number(row[8]) || 0,
        consulting: Number(row[9]) || 0,
        other: Number(row[10]) || 0,
        notes: row[11] || '',
        lastModified: row[12] || Date.now(),
        createdAt: row[13] || Date.now(),
        updatedAt: row[14] || Date.now()
      }));
  }

  // 신 버전 컬럼 구조
  return data.slice(1)
    .filter(row => row[0])
    .map(row => ({
      id: row[0],
      name: row[1],
      type: row[2],
      grade: row[3] || null,
      grades: row[4] ? parseGrades(row[4]) : [],
      classNumber: row[5] || null,
      subjects: row[6] ? String(row[6]).split(',').map(s => s.trim()) : [],
      customSubject: row[7] || '',
      basicTeaching: Number(row[8]) || 0,
      adminWork: Number(row[9]) || 0,
      training: Number(row[10]) || 0,
      consulting: Number(row[11]) || 0,
      other: Number(row[12]) || 0,
      notes: row[13] || '',
      lastModified: row[14] || Date.now(),
      createdAt: row[15] || Date.now(),
      updatedAt: row[16] || Date.now()
    }));
}

/**
 * grades 문자열 파싱 ("3,4,5,6" -> [3,4,5,6])
 */
function parseGrades(gradesStr) {
  if (!gradesStr) return [];
  return String(gradesStr)
    .split(',')
    .map(g => parseInt(g.trim(), 10))
    .filter(g => !isNaN(g) && g >= 1 && g <= 6);
}

/**
 * 교사시수 시트 가져오기 또는 생성
 */
function getOrCreateTeacherSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.TEACHERS);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.TEACHERS);
    initializeTeacherSheet(sheet);
  } else {
    // 헤더 확인 - 새 컬럼이 없으면 마이그레이션
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headers.includes('담당학년들')) {
      migrateTeacherSheet(sheet);
    }
  }

  return sheet;
}

/**
 * 교사시수 시트 초기화 (헤더 생성)
 */
function initializeTeacherSheet(sheet) {
  const headers = [
    'ID', '이름', '유형', '학년', '담당학년들', '반',
    '담당교과', '기타교과', '기본수업', '행정업무',
    '연수', '컨설팅', '기타시수', '메모',
    '수정시간', '생성시간', '업데이트시간'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4f46e5');
  headerRange.setFontColor('#ffffff');

  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  sheet.setFrozenRows(1);
}

/**
 * 교사시수 시트 마이그레이션 (구→신 컬럼 구조)
 */
function migrateTeacherSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    initializeTeacherSheet(sheet);
    return;
  }

  const oldData = data.slice(1).filter(row => row[0]);
  sheet.clear();
  initializeTeacherSheet(sheet);

  if (oldData.length > 0) {
    const newData = oldData.map(row => [
      row[0], row[1], row[2], row[3] || '', '',
      row[4] || '', row[5] || '', '', row[6] || 0,
      row[7] || 0, row[8] || 0, row[9] || 0, row[10] || 0,
      row[11] || '', row[12] || Date.now(),
      row[13] || Date.now(), row[14] || Date.now()
    ]);

    sheet.getRange(2, 1, newData.length, newData[0].length).setValues(newData);
  }
}

/**
 * ========================================
 * 시트 초기화 함수들 (수동 실행용)
 * ========================================
 */

/**
 * 빠른 시트 초기화 (대화상자 없이 바로 실행)
 * 앱스크립트 편집기에서 이 함수를 실행하세요!
 */
function quickInitializeAllSheets() {
  initializeSettingsSheet();
  initializeSchoolInfoSheet();
  initializeSubjectsSheet();
  initializeRoomsSheet();
  initializePeriodsSheet();
  getOrCreateTeacherSheet();
  getOrCreateTimetableSheet();
  Logger.log('모든 시트 초기화 완료!');
}

/**
 * 모든 시트 초기화 (메뉴에서 실행 - 확인 대화상자 포함)
 */
function initializeAllSheets() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    '시트 초기화',
    '모든 시트를 초기화하시겠습니까?\n기존 데이터가 있는 시트는 건너뜁니다.',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  initializeSettingsSheet();
  initializeSchoolInfoSheet();
  initializeSubjectsSheet();
  initializeRoomsSheet();
  initializePeriodsSheet();
  getOrCreateTeacherSheet();
  getOrCreateTimetableSheet();

  ui.alert('완료', '모든 시트가 초기화되었습니다!', ui.ButtonSet.OK);
}

/**
 * 설정 시트 초기화
 */
function initializeSettingsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);

  if (sheet && sheet.getLastRow() > 1) return; // 이미 데이터 있음

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.SETTINGS);
  }

  const data = [
    ['항목', '값'],
    ['기본시수', 22],
    ['담임기준시수', 22],
    ['전담기준시수', 22],
    ['수석감면율', 50],
    ['시수편차허용', 2]
  ];

  sheet.getRange(1, 1, data.length, 2).setValues(data);
  formatHeader(sheet, 2);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
}

/**
 * 학교정보 시트 초기화
 */
function initializeSchoolInfoSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.SCHOOL_INFO);

  if (sheet && sheet.getLastRow() > 1) return;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.SCHOOL_INFO);
  }

  const year = new Date().getFullYear();
  const data = [
    ['항목', '값'],
    ['학교명', ''],
    ['학년도', year],
    ['1학년', 4],
    ['2학년', 4],
    ['3학년', 4],
    ['4학년', 4],
    ['5학년', 4],
    ['6학년', 4]
  ];

  sheet.getRange(1, 1, data.length, 2).setValues(data);
  formatHeader(sheet, 2);
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 150);
}

/**
 * 교과 시트 초기화
 */
function initializeSubjectsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.SUBJECTS);

  if (sheet && sheet.getLastRow() > 1) return;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.SUBJECTS);
  }

  // 2024 교육과정 기준 주당 시수 (예시)
  const data = [
    ['ID', '교과명', '1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '기본장소', '비고'],
    ['KOR', '국어', 7, 8, 6, 6, 6, 6, '', ''],
    ['MATH', '수학', 4, 4, 4, 4, 4, 4, '', ''],
    ['SOC', '사회', 0, 0, 3, 3, 3, 3, '', '3학년부터'],
    ['SCI', '과학', 0, 0, 3, 3, 3, 3, '과학실', '3학년부터'],
    ['ENG', '영어', 0, 0, 2, 2, 2, 2, '영어실', '3학년부터'],
    ['MOR', '도덕', 0, 0, 1, 1, 1, 1, '', '3학년부터'],
    ['PE', '체육', 2, 2, 3, 3, 3, 3, '체육관', ''],
    ['MUSIC', '음악', 2, 2, 2, 2, 2, 2, '음악실', ''],
    ['ART', '미술', 2, 2, 2, 2, 2, 2, '미술실', ''],
    ['PRAC', '실과', 0, 0, 0, 2, 2, 2, '', '4학년부터'],
    ['SAFE', '안전', 1, 1, 1, 1, 1, 1, '', ''],
    ['CREA', '창체', 2, 2, 2, 2, 2, 2, '', '창의적체험활동'],
    ['INTG', '통합', 6, 6, 0, 0, 0, 0, '', '1-2학년']
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  formatHeader(sheet, data[0].length);

  // 컬럼 너비 조정
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 80);
  for (let i = 3; i <= 8; i++) sheet.setColumnWidth(i, 60);
  sheet.setColumnWidth(9, 80);
  sheet.setColumnWidth(10, 100);
}

/**
 * 장소 시트 초기화
 */
function initializeRoomsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.ROOMS);

  if (sheet && sheet.getLastRow() > 1) return;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.ROOMS);
  }

  const data = [
    ['ID', '장소명', '유형', '수용학급', '사용교과', '비고'],
    ['SCI_LAB', '과학실', '특별실', 1, '과학', ''],
    ['MUSIC_RM', '음악실', '특별실', 1, '음악', ''],
    ['ART_RM', '미술실', '특별실', 1, '미술', ''],
    ['ENG_RM', '영어실', '특별실', 1, '영어', ''],
    ['GYM', '체육관', '특별실', 2, '체육', '우천시'],
    ['COMPUTER', '컴퓨터실', '특별실', 1, '실과,창체', ''],
    ['LIBRARY', '도서실', '공용', 1, '', '']
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  formatHeader(sheet, data[0].length);
}

/**
 * 교시 시트 초기화
 */
function initializePeriodsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEETS.PERIODS);

  if (sheet && sheet.getLastRow() > 1) return;

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.PERIODS);
  }

  const data = [
    ['교시', '시작시간', '종료시간'],
    [1, '09:00', '09:40'],
    [2, '09:50', '10:30'],
    [3, '10:50', '11:30'],
    [4, '11:40', '12:20'],
    [5, '13:20', '14:00'],
    [6, '14:10', '14:50']
  ];

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  formatHeader(sheet, data[0].length);
}

/**
 * 헤더 포맷팅 공통 함수
 */
function formatHeader(sheet, colCount) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4f46e5');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * 메뉴 추가 (스프레드시트 열 때 자동 실행)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 SISU')
    .addItem('📋 모든 시트 초기화', 'initializeAllSheets')
    .addSeparator()
    .addItem('⚙️ 설정 시트 초기화', 'initializeSettingsSheet')
    .addItem('🏫 학교정보 시트 초기화', 'initializeSchoolInfoSheet')
    .addItem('📚 교과 시트 초기화', 'initializeSubjectsSheet')
    .addItem('🚪 장소 시트 초기화', 'initializeRoomsSheet')
    .addItem('⏰ 교시 시트 초기화', 'initializePeriodsSheet')
    .addItem('👨‍🏫 교사시수 시트 초기화', 'getOrCreateTeacherSheet')
    .addItem('📅 시간표 시트 초기화', 'getOrCreateTimetableSheet')
    .addToUi();
}

/**
 * JSON 응답 생성
 */
function createResponse(success, data, error) {
  const response = {
    success: success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    response.data = data;
  } else {
    response.error = error || 'Unknown error';
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
