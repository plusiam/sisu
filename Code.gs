/**
 * SISU 교사 시수 관리 시스템 - Google Apps Script Web App
 *
 * 설치 방법:
 * 1. Google Sheets 열기
 * 2. 확장 프로그램 > Apps Script
 * 3. 이 코드 전체 복사 후 붙여넣기
 * 4. 배포 > 새 배포
 * 5. 유형: 웹 앱
 * 6. 액세스 권한: "누구나"
 * 7. 배포 후 Web App URL 복사
 */

// 시트 이름
const SHEET_NAME = '교사시수';

/**
 * GET 요청: 데이터 가져오기
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    // 헤더가 없으면 생성
    if (data.length === 0) {
      initializeSheet(sheet);
      return createResponse(true, []);
    }

    // 헤더 제외하고 데이터 파싱
    const teachers = data.slice(1)
      .filter(row => row[0]) // ID가 있는 행만
      .map(row => ({
        id: row[0],
        name: row[1],
        type: row[2],
        grade: row[3] || null,
        classNumber: row[4] || null,
        subjects: row[5] ? row[5].split(',').map(s => s.trim()) : [],
        basicTeaching: Number(row[6]) || 0,
        adminWork: Number(row[7]) || 0,
        training: Number(row[8]) || 0,
        consulting: Number(row[9]) || 0,
        other: Number(row[10]) || 0,
        notes: row[11] || '',
        lastModified: row[12] || Date.now(),
        createdAt: row[13] || Date.now(),
        updatedAt: row[14] || Date.now(),
      }));

    return createResponse(true, teachers);
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
    const teachers = payload.teachers;

    if (!Array.isArray(teachers)) {
      throw new Error('teachers must be an array');
    }

    const sheet = getOrCreateSheet();

    // 헤더 확인 및 생성
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      initializeSheet(sheet);
    }

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
        t.classNumber || '',
        Array.isArray(t.subjects) ? t.subjects.join(', ') : '',
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
  } catch (error) {
    return createResponse(false, null, error.message);
  }
}

/**
 * 시트 가져오기 또는 생성
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    initializeSheet(sheet);
  }

  return sheet;
}

/**
 * 시트 초기화 (헤더 생성)
 */
function initializeSheet(sheet) {
  const headers = [
    'ID',
    '이름',
    '유형',
    '학년',
    '반',
    '담당교과',
    '기본수업',
    '행정업무',
    '연수',
    '컨설팅',
    '기타',
    '메모',
    '수정시간',
    '생성시간',
    '업데이트시간'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 헤더 스타일
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4f46e5');
  headerRange.setFontColor('#ffffff');

  // 열 너비 자동 조정
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // 고정 행
  sheet.setFrozenRows(1);
}

/**
 * JSON 응답 생성
 */
function createResponse(success, data, error) {
  const response = {
    success: success,
    timestamp: new Date().toISOString(),
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
