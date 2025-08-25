
// This file exports the Google Apps Script code as a string
// to be displayed in the AdminGuide component.

export const codeString = `
// =================================================================
//  Google Apps Script Backend for School Equipment Management System
// =================================================================

// --- Configuration ---
const SPREADSHEET_NAME = 'School Equipment DB';
const TIMEZONE = 'Asia/Bangkok';

// Define sheet names and their required headers
const DB_CONFIG = {
  Users: ['id', 'name', 'username', 'password', 'role'],
  Bookings: ['id', 'userId', 'type', 'teacherName', 'program', 'classroom', 'period', 'date', 'equipment', 'learningPlan', 'status', 'createdAt', 'returnedAt', 'returnedBy'],
  Classrooms: ['id', 'program', 'name_th', 'name_en'],
  Equipment: ['id', 'name_th', 'name_en'],
};

// --- Global Setup ---
const SCRIPT_LOCK = LockService.getScriptLock();
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
let _spreadsheet; // In-memory cache for the spreadsheet object for the current execution

/**
 * Ensures the database spreadsheet and all its tables are created and initialized.
 * This function uses a lock for the critical, file-creation part of the setup
 * to prevent race conditions, and then populates data in a non-locked, idempotent way
 * to avoid "Lock timed out" errors.
 */
function ensureDatabaseInitialized() {
  const dbInitialized = SCRIPT_PROPERTIES.getProperty('DB_INITIALIZED');
  if (dbInitialized === 'true' && SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID')) {
    return; // Fast path: setup has already been completed successfully.
  }

  let spreadsheetForPopulation;
  SCRIPT_LOCK.waitLock(30000); // Wait up to 30s for the critical file creation lock.
  
  try {
    // Double-check inside the lock to prevent another process from re-doing the work.
    const dbInitializedAfterLock = SCRIPT_PROPERTIES.getProperty('DB_INITIALIZED');
    if (dbInitializedAfterLock === 'true' && SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID')) {
      return; // Another process finished the setup while we were waiting.
    }

    console.log('Database structure not initialized. Starting one-time setup...');
    
    // --- START OF CRITICAL, LOCKED SECTION ---
    // This part must be very fast to avoid lock timeouts.
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    const ss = files.hasNext() ? SpreadsheetApp.openById(files.next().getId()) : SpreadsheetApp.create(SPREADSHEET_NAME);
    
    SCRIPT_PROPERTIES.setProperty('SPREADSHEET_ID', ss.getId());
    console.log(\`Using Spreadsheet ID: \${ss.getId()}\`);

    // Create sheets and headers
    Object.entries(DB_CONFIG).forEach(([sheetName, headers]) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        console.log(\`Created sheet: \${sheetName}\`);
      }
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        console.log(\`Initialized headers for sheet: \${sheetName}\`);
      }
    });

    // Mark the core initialization as complete.
    SCRIPT_PROPERTIES.setProperty('DB_INITIALIZED', 'true');
    console.log('Core database structure initialization complete.');
    spreadsheetForPopulation = ss; // Pass the spreadsheet object out of the locked section.
    // --- END OF CRITICAL, LOCKED SECTION ---

  } catch (e) {
    console.error("CRITICAL: Failed during core database initialization.", e.toString(), e.stack);
    throw new Error("Could not initialize the database structure. Please try again or check script permissions.");
  } finally {
    SCRIPT_LOCK.releaseLock(); // Release the lock as soon as the critical part is done.
  }
  
  // --- SLOW, NON-LOCKED SECTION ---
  // Now, populate the data. This is slow but won't cause timeouts for other requests.
  // The initializeDefaultData function has its own internal check to prevent running twice.
  if (spreadsheetForPopulation) {
    try {
      console.log('Starting data population (this may take a moment)...');
      initializeDefaultData(spreadsheetForPopulation);
      console.log('Data population finished.');
    } catch (e) {
      // Log this error but don't throw, as the core DB is already set up.
      // The app might be usable but without default data.
      console.error("ERROR during non-critical data population:", e.toString(), e.stack);
    }
  }
}


/**
 * Gets the spreadsheet instance. This is the main, lightweight entry point for accessing the DB.
 */
function getDB() {
  // Use in-memory cache for the duration of a single script execution
  if (_spreadsheet) return _spreadsheet;

  // Run the one-time setup if it has never been run before.
  ensureDatabaseInitialized(); 

  const spreadsheetId = SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    // This should not happen if ensureDatabaseInitialized works correctly.
    console.error("SPREADSHEET_ID not found in properties after initialization. This is a critical error.");
    throw new Error("Could not retrieve Spreadsheet ID. The initialization might have failed.");
  }
  
  _spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return _spreadsheet;
}

/**
 * Populates the 'Users' sheet with a predefined list if it's empty.
 * This is part of the one-time setup.
 */
function initializeDefaultData(spreadsheet) {
  const usersSheet = spreadsheet.getSheetByName('Users');
  if (usersSheet && usersSheet.getLastRow() < 2) { // Only header exists
    console.log("Users sheet is empty. Populating with initial user list.");

    const initialUsers = [
      { id: '1', name: 'นายพสิษฐ์ สัตบุตร', username: 'admin', password: 'admin1234', role: 'admin' },
      { id: '2', name: 'นายกฤษณะ สุขเกษม', username: 'A0941799831', password: 'A0941799831', role: 'teacher' },
      { id: '3', name: 'น.ส.วรทัย ปิ่นกง', username: 'A0994897060', password: 'A0994897060', role: 'teacher' },
      { id: '4', name: 'น.ส.เบนน่า มาซาโกวา', username: 'A0965477097', password: 'A0965477097', role: 'teacher' },
      { id: '5', name: 'Ms. Honey Joy Corolado', username: 'A0643805904', password: 'A0643805904', role: 'teacher' },
      { id: '6', name: 'Miss Kimberly Mae G. Lopez', username: 'A0949138028', password: 'A0949138028', role: 'teacher' },
      { id: '7', name: 'น.ส.คุณัญญา สาเจริญ', username: 'A0636698561', password: 'A0636698561', role: 'teacher' },
      { id: '8', name: 'น.ส.นนทชา รัชตโชติสกุล', username: 'A0659398155', password: 'A0659398155', role: 'teacher' },
      { id: '9', name: 'น.ส.วลัยลักษณ์ ศรีวรสาร', username: 'A0826061421', password: 'A0826061421', role: 'teacher' },
      { id: '10', name: 'น.ส.สิริศร อยู่ในสุข', username: 'A0839948836', password: 'A0839948836', role: 'teacher' },
      { id: '11', name: 'น.ส.อัญมณี ไวยรัตน์', username: 'A0653497243', password: 'A0653497243', role: 'teacher' },
      { id: '12', name: 'น.ส.แพรวพรรณ ยุทธนาวา', username: 'A0876001180', password: 'A0876001180', role: 'teacher' },
      { id: '13', name: 'Miss Airen Ratunil Dela Cruz', username: 'A0996481679', password: 'A0996481679', role: 'teacher' },
      { id: '14', name: 'Ms. May Dolor G. Magpale', username: 'A0841356630', password: 'A0841356630', role: 'teacher' },
      { id: '15', name: 'Ms. Melanie Castro', username: 'A0826676248', password: 'A0826676248', role: 'teacher' },
      { id: '16', name: 'Ms. Melodith Jane Berido', username: 'A0918904792', password: 'A0918904792', role: 'teacher' },
      { id: '17', name: 'Ms.Jerly D. Cosinero', username: 'A0811485912', password: 'A0811485912', role: 'teacher' },
      { id: '18', name: 'น.ส.กรนัท เพิ่มพูล', username: 'A0656465798', password: 'A0656465798', role: 'teacher' },
      { id: '19', name: 'น.ส.กัญจรี สามัคคี', username: 'A0834268748', password: 'A0834268748', role: 'teacher' },
      { id: '20', name: 'นางณัฐชยา ชนูนันท์', username: 'A0644386047', password: 'A0644386047', role: 'teacher' },
      { id: '21', name: 'น.ส.ธนาภรณ์ ทับทิมทอง', username: 'A0946186182', password: 'A0946186182', role: 'teacher' },
      { id: '22', name: 'น.ส.นาฎอนงค์ ขอรวมกลาง', username: 'A0801283641', password: 'A0801283641', role: 'teacher' },
      { id: '23', name: 'นางนิตยา พัฒนา', username: 'A0657081336', password: 'A0657081336', role: 'teacher' },
      { id: '24', name: 'นางปานทิพย์ พรหมมา', username: 'A0916981703', password: 'A0916981703', role: 'teacher' },
      { id: '25', name: 'น.ส.พิชชาพร ยอดเกิด', username: 'A0986428993', password: 'A0986428993', role: 'teacher' },
      { id: '26', name: 'น.ส.วัชรีกร จันพิศาล', username: 'A0818751373', password: 'A0818751373', role: 'teacher' },
      { id: '27', name: 'น.ส.สาคร หลองทุ่ง', username: 'A0875865529', password: 'A0875865529', role: 'teacher' },
      { id: '28', name: 'นางอรัญญา ช่างถม', username: 'A0844484839', password: 'A0844484839', role: 'teacher' },
      { id: '29', name: 'น.ส.อารียา ปานพรหม', username: 'A0817272165', password: 'A0817272165', role: 'teacher' },
      { id: '30', name: 'น.ส.อำไพ เผ่าดี', username: 'A0986567059', password: 'A0986567059', role: 'teacher' },
      { id: '31', name: 'Mrs.Quenie Lou M. Lesigufz', username: 'A0639868522', password: 'A0639868522', role: 'teacher' },
      { id: '32', name: 'น.ส.ศิริลักษณ์ สังข์ทอง', username: 'A0878381856', password: 'A0878381856', role: 'teacher' },
      { id: '33', name: 'Ms. Baby Joy Pansaon Naquila', username: 'A0948024527', password: 'A0948024527', role: 'teacher' },
      { id: '34', name: 'Mr. Benjamin Galve Jr.', username: 'A0822370241', password: 'A0822370241', role: 'teacher' },
      { id: '35', name: 'Miss Jelsie M. Tuyac', username: 'A0997135792', password: 'A0997135792', role: 'teacher' },
      { id: '36', name: 'Mr. Marvin R. Cubos', username: 'A0946911328', password: 'A0946911328', role: 'teacher' },
      { id: '37', name: 'Ms. Precious Anne Rosales', username: 'A0948683809', password: 'A0948683809', role: 'teacher' },
      { id: '38', name: 'น.ส.ณัฐธิกานต์ อ่อนนาดี', username: 'A0816621045', password: 'A0816621045', role: 'teacher' },
      { id: '39', name: 'น.ส.ณัฐมนต์ กลิ่นถาวร', username: 'A0968366383', password: 'A0968366383', role: 'teacher' },
      { id: '40', name: 'น.ส.ปภัสรา อัจนา', username: 'A0902960425', password: 'A0902960425', role: 'teacher' },
      { id: '41', name: 'น.ส.รจสุคนธ์ คำเพชรดี', username: 'A0615052434', password: 'A0615052434', role: 'teacher' },
      { id: '42', name: 'นางอุทุมภรณ์ เสืออิ่ม', username: 'A0642602986', password: 'A0642602986', role: 'teacher' },
      { id: '43', name: 'Ms. Emma Gocela Bendana', username: 'A0951130440', password: 'A0951130440', role: 'teacher' },
      { id: '44', name: 'Ms. Janet C.Ybanez', username: 'A0970410790', password: 'A0970410790', role: 'teacher' },
      { id: '45', name: 'Mr. Jerex John S. Matas', username: 'A0929610115', password: 'A0929610115', role: 'teacher' },
      { id: '46', name: 'Ms. Lordelina B. Engbino', username: 'A0825240918', password: 'A0825240918', role: 'teacher' },
      { id: '47', name: 'Ms. Mary Noreen E. Malagum', username: 'A0853730447', password: 'A0853730447', role: 'teacher' },
      { id: '48', name: 'Ms. Rizpah A. Ogang', username: 'A0851997405', password: 'A0851997405', role: 'teacher' },
      { id: '49', name: 'Ms. Romileene Kabigting', username: 'A0946412800', password: 'A0946412800', role: 'teacher' },
      { id: '50', name: 'Mr. Wayne Longhurst', username: 'A0983243861', password: 'A0983243861', role: 'teacher' },
      { id: '51', name: 'Mr.Frank Andrew', username: 'A0820051362', password: 'A0820051362', role: 'teacher' },
      { id: '52', name: 'Mr.Marvin Dave Polonan', username: 'A0621408009', password: 'A0621408009', role: 'teacher' },
      { id: '53', name: 'Mr.Sabet Aris', username: 'A0801087095', password: 'A0801087095', role: 'teacher' },
      { id: '54', name: 'น.ส.ภณิดา งามขำ', username: 'A0988641351', password: 'A0988641351', role: 'teacher' },
      { id: '55', name: 'น.ส.กรชนก โพธิ์มี', username: 'A0802649877', password: 'A0802649877', role: 'teacher' },
      { id: '56', name: 'น.ส.จุฑามาศ มะปรางอ่อน', username: 'A0982859413', password: 'A0982859413', role: 'teacher' },
      { id: '57', name: 'น.ส.ชลธิชา เปียสันเทียะ', username: 'A0953905236', password: 'A0953905236', role: 'teacher' },
      { id: '58', name: 'น.ส.ญาณศรณ์ ทัพมงคล', username: 'A0827566780', password: 'A0827566780', role: 'teacher' },
      { id: '59', name: 'น.ส.ณัฐธิกา กามะ', username: 'A0936971610', password: 'A0936971610', role: 'teacher' },
      { id: '60', name: 'น.ส.ประกายกุล คงกุทอง', username: 'A0906208621', password: 'A0906208621', role: 'teacher' },
      { id: '61', name: 'น.ส.พรพิมล นาเจริญ', username: 'A0971543391', password: 'A0971543391', role: 'teacher' },
      { id: '62', name: 'น.ส.ศุภัคชญา มะโรงทอง', username: 'A0985055869', password: 'A0985055869', role: 'teacher' },
      { id: '63', name: 'นายไตรภพ ไกรวงษ์', username: 'A0802957374', password: 'A0802957374', role: 'teacher' },
      { id: '64', name: 'Ms. Angelica S. Quinlog', username: 'A0946070851', password: 'A0946070851', role: 'teacher' },
      { id: '65', name: 'Ms. Camel Joy Genolos', username: 'A0827062604', password: 'A0827062604', role: 'teacher' },
      { id: '66', name: 'Mr. John Michael Valera', username: 'A0649597108', password: 'A0649597108', role: 'teacher' },
      { id: '67', name: 'Mr.Red Billones', username: 'A0654153586', password: 'A0654153586', role: 'teacher' },
      { id: '68', name: 'น.ส.จินจิรา กลมพันธ์', username: 'A0924747229', password: 'A0924747229', role: 'teacher' },
      { id: '69', name: 'นายภัทรภณ สุขน้ำคำ', username: 'A0913764752', password: 'A0913764752', role: 'teacher' },
      { id: '70', name: 'น.ส.ศิรินันท์ ปราบคนชั่ว', username: 'A0959479561', password: 'A0959479561', role: 'teacher' },
      { id: '71', name: 'น.ส.สุธินี สิทธิโชค', username: 'A0985099986', password: 'A0985099986', role: 'teacher' },
      { id: '72', name: 'น.ส.อัจฉรา ฝั่งชลจิตต์', username: 'A0917329316', password: 'A0917329316', role: 'teacher' },
      { id: '73', name: 'Mr.Helie Fritz Sazon', username: 'A0823754486', password: 'A0823754486', role: 'teacher' },
      { id: '74', name: 'นางชมนภัส วงศ์โดยหวัง', username: 'A0931183213', password: 'A0931183213', role: 'teacher' },
      { id: '75', name: 'น.ส.ช่อมณี ผ่องฤกษ์', username: 'A0619943628', password: 'A0619943628', role: 'teacher' },
      { id: '76', name: 'นายณัฐพงษ์ คงกุทอง', username: 'A0807444591', password: 'A0807444591', role: 'teacher' },
      { id: '77', name: 'น.ส.ธัญญลักษณ์ ศิลาขาว', username: 'A0857469287', password: 'A0857469287', role: 'teacher' },
      { id: '78', name: 'น.ส.ธีรพร ชะอุ้ม', username: 'A0876962717', password: 'A0876962717', role: 'teacher' },
      { id: '79', name: 'นายวิศรุต กันทอง', username: 'A0802139967', password: 'A0802139967', role: 'teacher' },
      { id: '80', name: 'Ms. Ruby Lyn T. Dumdum', username: 'A0803282358', password: 'A0803282358', role: 'teacher' },
      { id: '81', name: 'Mr.Windson L. Comom', username: 'A0812564785', password: 'A0812564785', role: 'teacher' },
      { id: '82', name: 'น.ส.จรียา สีเทพ', username: 'A0996167632', password: 'A0996167632', role: 'teacher' },
      { id: '83', name: 'น.ส.จุฬารัตน์ พิพันเพียง', username: 'A0974955361', password: 'A0974955361', role: 'teacher' },
      { id: '84', name: 'นายณัฐวุฒิ ปั้นคล้าย', username: 'A0820277548', password: 'A0820277548', role: 'teacher' },
      { id: '85', name: 'น.ส.ปิยะพร โชติอริยทรัพย์', username: 'A0811971310', password: 'A0811971310', role: 'teacher' },
      { id: '86', name: 'น.ส.ศศิธร ชาร์ป', username: 'A0967071073', password: 'A0967071073', role: 'teacher' },
      { id: '87', name: 'น.ส.ศิริรัตน์ เศวตวงษ์', username: 'A0956624361', password: 'A0956624361', role: 'teacher' },
      { id: '88', name: 'นายสิทธิโชค ขุมมา', username: 'A0901308678', password: 'A0901308678', role: 'teacher' },
      { id: '89', name: 'Mr. Arbee Garcia Pineda', username: 'A0969477299', password: 'A0969477299', role: 'teacher' },
      { id: '90', name: 'Mr.Ryan T. Kenio', username: 'A0653133861', password: 'A0653133861', role: 'teacher' },
      { id: '91', name: 'น.ส.ทัศนีย์วรรณ จันโทวาท', username: 'A0980271586', password: 'A0980271586', role: 'teacher' },
      { id: '92', name: 'นายปฎิพล ไชยพอ', username: 'A0982466705', password: 'A0982466705', role: 'teacher' },
      { id: '93', name: 'นายรังสิมันต์ พิมพ์โคตร', username: 'A06486399122', password: 'A06486399122', role: 'teacher' },
      { id: '94', name: 'นายอภิชา วัฒนะวิโรฒ', username: 'A0831113023', password: 'A0831113023', role: 'teacher' },
      { id: '95', name: 'นายภักดี ปินะถา', username: 'A0883045231', password: 'A0883045231', role: 'admin' },
      { id: '96', name: 'นางอรทัย ครูเอิน', username: 'A0903212310', password: 'A0903212310', role: 'teacher' },
      { id: '97', name: 'นายสมศักดิ์ เนียมงาม', username: 'A0892299905', password: 'A0892299905', role: 'teacher' },
      { id: '98', name: 'Mr. Edmhar M. Alborte', username: 'A0830613757', password: 'A0830613757', role: 'teacher' },
      { id: '99', name: 'นายกฤษฎา แอสุวรรณ', username: 'A0875380556', password: 'A0875380556', role: 'teacher' },
      { id: '100', name: 'น.ส.ชมพูนุท จิรดิฐพาณิชยกุล', username: 'A0614646395', password: 'A0614646395', role: 'teacher' },
      { id: '101', name: 'นายชานุวัฒน์ บุระพันธ์', username: 'A0902594288', password: 'A0902594288', role: 'teacher' },
      { id: '102', name: 'นายธนาธร คชภูติ', username: 'A0998146358', password: 'A0998146358', role: 'teacher' },
      { id: '103', name: 'นางนราวรรณ สุ่นตระกูล', username: 'A0970601930', password: 'A0970601930', role: 'teacher' },
      { id: '104', name: 'น.ส.นาถนรี ปรียานนท์', username: 'A0949647964', password: 'A0949647964', role: 'teacher' },
      { id: '105', name: 'น.ส.บุศรัตน์ พลอยเลิศ', username: 'A0651562457', password: 'A0651562457', role: 'teacher' },
      { id: '106', name: 'นางพรวิภา หมั่นภักดี', username: 'A0912455949', password: 'A0912455949', role: 'teacher' },
      { id: '107', name: 'นายพสิษฐ์ สัตบุตร', username: 'A0833759527', password: 'A0833759527', role: 'teacher' },
      { id: '108', name: 'นางพิมภัสร์ อ่อนยั่งยืน', username: 'A0819891463', password: 'A0819891463', role: 'teacher' },
      { id: '109', name: 'น.ส.พิไลภรณ์ หะธรรมวงษ์', username: 'A0868372374', password: 'A0868372374', role: 'teacher' },
      { id: '110', name: 'นางมนทิชา เนียมงาม', username: 'A0857402739', password: 'A0857402739', role: 'teacher' },
      { id: '111', name: 'น.ส.รุ่งนภา พรมบุตร', username: 'A0969780682', password: 'A0969780682', role: 'teacher' },
      { id: '112', name: 'นางอมรรัตน์ ยี่ผาสุข', username: 'A0818648757', password: 'A0818648757', role: 'teacher' },
      { id: '113', name: 'น.ส.อมรรัตน์ ศรีเล็ก', username: 'A0930728037', password: 'A0930728037', role: 'teacher' },
      { id: '114', name: 'นางอรวรรณ ไชยบาล', username: 'A0651561755', password: 'A0651561755', role: 'teacher' },
      { id: '115', name: 'น.ส.อ้อยใจ ปิงเมือง', username: 'A0817620531', password: 'A0817620531', role: 'teacher' },
      { id: '116', name: 'นายเฉลิมพล พันธ์เฉลิมชัย', username: 'A0909289254', password: 'A0909289254', role: 'teacher' },
      { id: '117', name: 'น.ส.เพชรพัชรี สุระปัญญา', username: 'A0924606190', password: 'A0924606190', role: 'teacher' },
      { id: '118', name: 'นายเสฎฐวุฒิ แก้วมรกต', username: 'A06526309655', password: 'A06526309655', role: 'teacher' },
      { id: '119', name: 'นายเอื้อวิช วัฒนะวิโรฒ', username: 'A0958607873', password: 'A0958607873', role: 'teacher' },
      { id: '120', name: 'นายเฮนรี เจอาร์ มิซาจอน อาริมัส', username: 'A0614704421', password: 'A0614704421', role: 'teacher' },
      { id: '121', name: 'น.ส.จิริยา นีระพงษ์', username: 'A0639500476', password: 'A0639500476', role: 'teacher' },
      { id: '122', name: 'นางสายฝน ชาญเขตกรณ์', username: 'A0961588673', password: 'A0961588673', role: 'teacher' },
      { id: '123', name: 'นางสุพรรณ พรมอ่อน', username: 'A0988758526', password: 'A0988758526', role: 'teacher' },
      { id: '124', name: 'นายวิศัลย์ เพ็ชรตระกูล', username: 'A0818343465', password: 'A0818343465', role: 'admin' },
      { id: '125', name: 'นางปราณี เรียนรู้', username: 'A08802105933', password: 'A08802105933', role: 'teacher' },
      { id: '126', name: 'น.ส.ทิตธัญญา จันทร์ทอง', username: 'A0865153455', password: 'A0865153455', role: 'teacher' },
      { id: '127', name: 'นางน้ำอ้อย เปลี่ยนทอง', username: 'A0625122420', password: 'A0625122420', role: 'teacher' },
      { id: '128', name: 'น.ส.มาลัย ศรีนอก', username: 'A0925533830', password: 'A0925533830', role: 'teacher' },
      { id: '129', name: 'นายวันชัย พลอยประดับ', username: 'A0610451017', password: 'A0610451017', role: 'teacher' },
      { id: '130', name: 'น.ส.ศุจินทรา ครบพร', username: 'A0988404282', password: 'A0988404282', role: 'teacher' },
      { id: '131', name: 'นายจรุง มัณยานน์', username: 'A0819966244', password: 'A0819966244', role: 'teacher' },
      { id: '132', name: 'นายภัทรพล คงมั่น', username: 'A0894999464', password: 'A0894999464', role: 'teacher' },
      { id: '133', name: 'นายธีรยุทธ ประภัศศร', username: 'A0929323900', password: 'A0929323900', role: 'teacher' },
      { id: '134', name: 'นางจีระนันท์ สุภาชาติ', username: 'A0660768326', password: 'A0660768326', role: 'teacher' },
      { id: '135', name: 'นางมานิตย์ น้อยจริง', username: 'A0822527232', password: 'A0822527232', role: 'teacher' },
      { id: '136', name: 'น.ส.ยาใจ วงศ์ผาบุตร', username: 'A0958481727', password: 'A0958481727', role: 'teacher' },
      { id: '137', name: 'น.ส.วงเดือน สร้อยที', username: 'A0984436701', password: 'A0984436701', role: 'teacher' },
      { id: '138', name: 'น.ส.พิสมัย วงศ์ผาบุตร', username: 'A0890916292', password: 'A0890916292', role: 'teacher' },
      { id: '139', name: 'นางสุนันทา สุวรรณวงค์', username: 'A0968154693', password: 'A0968154693', role: 'teacher' },
      { id: '140', name: 'นางเพ็ญศรี ไชยสลี', username: 'A0915519538', password: 'A0915519538', role: 'teacher' },
      { id: '141', name: 'นายเรือง เริ่มหาสุข', username: 'A0860542239', password: 'A0860542239', role: 'teacher' },
      { id: '142', name: 'น.ส.วาสนา สุขแท้', username: 'A0861508025', password: 'A0861508025', role: 'teacher' },
      { id: '143', name: 'น.ส.ศรีดา ชินดร', username: 'A0868284206', password: 'A0868284206', role: 'teacher' },
    ];
    
    const headers = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    
    const rows = initialUsers.map(user => {
        const userWithHashedPassword = {
            ...user,
            password: hashPassword(user.password),
            name: user.name.replace(/\s+/g, ' ').trim() 
        };
        return headers.map(header => userWithHashedPassword[header] || '');
    });

    if (rows.length > 0) {
        usersSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        console.log(\`Successfully populated \${rows.length} users into the database.\`);
    }
  }
}


// --- Web App Entry Points ---
// These are wrapped in try/catch blocks to ensure a valid JSON error response
// is always sent, preventing frontend parsing errors.

function doGet(e) {
  try {
    const { action, ...params } = e.parameter;
    if (!action) throw new Error("'action' parameter is missing.");
    console.log(\`GET Received - Action: \${action}, Params: \${JSON.stringify(params)}\`);
    return handleRequest(action, params);
  } catch (error) {
    console.error(\`FATAL ERROR in doGet: \${error.toString()}\\nStack: \${error.stack}\`);
    return createJsonResponse({ 
      success: false, 
      message: 'Fatal error in GET handler: ' + error.toString(),
      stack: error.stack || 'No stack available'
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('POST request missing data payload.');
    const { action, payload } = JSON.parse(e.postData.contents);
    if (!action) throw new Error("'action' key missing in POST payload.");
    console.log(\`POST Received - Action: \${action}\`);
    return handleRequest(action, payload);
  } catch (error) {
    console.error(\`FATAL ERROR in doPost: \${error.toString()}\\nStack: \${error.stack}\`);
    return createJsonResponse({ 
      success: false, 
      message: 'Fatal error in POST handler: ' + error.toString(),
      stack: error.stack || 'No stack available'
    });
  }
}


/**
 * Main request router.
 */
function handleRequest(action, params) {
  try {
    console.log(\`Executing action: \${action}\`);
    const actionMap = {
      authenticate,
      getEquipment, getClassroomsByProgram, getAllClassrooms, getBookingsByDate, getBookingsWithStatus, getReportData, getUsers,
      addBooking, updateBooking, deleteBooking, cancelBooking, confirmReturn,
      addUser, updateUser, deleteUser,
      addClassroom, updateClassroom, deleteClassroom,
      addEquipment, updateEquipment, deleteEquipment,
    };
    
    const func = actionMap[action];
    if (typeof func !== 'function') throw new Error(\`Invalid action: '\${action}'\`);
    
    const data = func(params);
    return createJsonResponse({ success: true, data });

  } catch (error) {
    console.error(\`Error during action "\${action}": \${error.toString()}\\nStack: \${error.stack}\`);
    return createJsonResponse({ 
      success: false, 
      message: error.toString(), 
      stack: error.stack ? error.stack : 'No stack available' 
    });
  }
}

function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Helper Functions ---
function generateId() { return Utilities.getUuid(); }
function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
}
function verifyPassword(password, hash) { return hashPassword(password) === hash; }

function sheetDataToObject(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return [];
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    return data.map(row => 
        headers.reduce((obj, header, i) => {
            let value = row[i];
            if (header === 'equipment' && value) {
                try {
                  obj[header] = JSON.parse(value);
                } catch(e) {
                  obj[header] = String(value).split(',').map(s => s.trim()).filter(Boolean);
                }
            } else {
                obj[header] = value;
            }
            return obj;
        }, {})
    );
}


// --- API Endpoint Functions ---

// AUTHENTICATION
function authenticate({ username, password }) {
  const users = sheetDataToObject(getDB().getSheetByName('Users'));
  const user = users.find(u => u.username === username);
  if (user && verifyPassword(password, user.password)) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// GETTERS
function getUsers() {
    const users = sheetDataToObject(getDB().getSheetByName('Users'));
    return users.map(({ password, ...rest }) => rest);
}
function getEquipment() { return sheetDataToObject(getDB().getSheetByName('Equipment')); }
function getAllClassrooms() { return sheetDataToObject(getDB().getSheetByName('Classrooms')); }
function getClassroomsByProgram({ program }) {
  return getAllClassrooms().filter(c => c.program === program);
}

function getBookingsByDate({ date }) {
    const allBookings = sheetDataToObject(getDB().getSheetByName('Bookings'));
    const filtered = allBookings.filter(b => 
        b.date && b.date instanceof Date && !isNaN(b.date) && 
        Utilities.formatDate(b.date, TIMEZONE, 'yyyy-MM-dd') === date
    );
    return calculateBookingStatus(filtered);
}

function getBookingsWithStatus() {
    const allBookings = sheetDataToObject(getDB().getSheetByName('Bookings'));
    const sorted = allBookings.sort((a,b) => (new Date(b.createdAt) - new Date(a.createdAt)));
    return calculateBookingStatus(sorted);
}

function calculateBookingStatus(bookings) {
  const now = new Date();
  const periodTimes = {
    1: { start: [8, 40], end: [9, 40] }, 2: { start: [9, 40], end: [10, 40] },
    3: { start: [10, 40], end: [11, 40] }, 4: { start: [12, 40], end: [13, 40] },
    5: { start: [13, 40], end: [14, 40] }, 6: { start: [14, 50], end: [15, 50] },
  };

  return bookings.map(b => {
    if (['Returned', 'Not Used', 'Cancelled'].includes(b.status)) return b;
    if (!(b.date instanceof Date) || isNaN(b.date.getTime())) return b;

    const periodInfo = periodTimes[b.period];
    if (!periodInfo) return b;

    const bookingDate = new Date(b.date);
    const startTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), periodInfo.start[0], periodInfo.start[1]);
    const endTime = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(), periodInfo.end[0], periodInfo.end[1]);

    if (now >= startTime && now <= endTime) b.status = 'In Use';
    else if (now > endTime) b.status = 'Pending Return';
    else b.status = 'Booked';
    
    return b;
  });
}


// CRUD OPERATIONS (with locking for safety)
function addOrUpdateRecord(sheetName, data, id = null) {
  SCRIPT_LOCK.waitLock(15000);
  try {
    const sheet = getDB().getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const prepareRow = record => headers.map(header => {
      const value = record[header];
      return Array.isArray(value) ? JSON.stringify(value) : (value !== undefined ? value : '');
    });

    if (id) { // Update
      const dataToUpdate = { ...data };
      // Securely handle password updates
      if (sheetName === 'Users' && dataToUpdate.password) {
        if (dataToUpdate.password.length > 0) {
          dataToUpdate.password = hashPassword(dataToUpdate.password);
        } else {
          delete dataToUpdate.password; // Don't overwrite with empty password
        }
      } else if (sheetName === 'Users') {
        delete dataToUpdate.password; // Ensure password field isn't touched if not provided
      }

      const dataObjects = sheetDataToObject(sheet);
      const rowIndex = dataObjects.findIndex(row => row.id === id) + 2;
      if (rowIndex > 1) {
        const updatedData = { ...dataObjects[rowIndex - 2], ...dataToUpdate };
        sheet.getRange(rowIndex, 1, 1, headers.length).setValues([prepareRow(updatedData)]);
        return updatedData;
      }
      throw new Error(\`Record with ID \${id} not found in \${sheetName}.\`);
    } else { // Add
      const newId = generateId();
      let record = { ...data, id: newId };
      if (sheetName === 'Bookings') {
        record.createdAt = new Date().toISOString();
        record.status = 'Booked';
      }
      if (sheetName === 'Users' && record.password) {
        record.password = hashPassword(record.password);
      }
      sheet.appendRow(prepareRow(record));
      return record;
    }
  } finally {
    SCRIPT_LOCK.releaseLock();
  }
}

function deleteRecord(sheetName, id) {
  SCRIPT_LOCK.waitLock(15000);
  try {
    const sheet = getDB().getSheetByName(sheetName);
    const dataObjects = sheetDataToObject(sheet);
    const rowIndex = dataObjects.findIndex(row => row.id === id) + 2;
    if (rowIndex > 1) {
      sheet.deleteRow(rowIndex);
      return { success: true };
    }
    throw new Error(\`Record with ID \${id} not found.\`);
  } finally {
    SCRIPT_LOCK.releaseLock();
  }
}

// Booking Specific
function addBooking(data) {
  const allBookings = sheetDataToObject(getDB().getSheetByName('Bookings'));
  const conflict = allBookings.find(b => {
    if (!b.date || !(b.date instanceof Date)) return false;
    const bookingDateStr = Utilities.formatDate(b.date, TIMEZONE, 'yyyy-MM-dd');
    return bookingDateStr === data.date && b.classroom === data.classroom && b.period == data.period && !['Returned', 'Not Used', 'Cancelled'].includes(b.status);
  });
  if (conflict) throw new Error('Booking conflict');
  return addOrUpdateRecord('Bookings', data);
}
function updateBooking({ id, data }) { return addOrUpdateRecord('Bookings', data, id); }
function deleteBooking({ id }) { return deleteRecord('Bookings', id); }
function confirmReturn({ bookingId, adminName }) {
  return addOrUpdateRecord('Bookings', { status: 'Returned', returnedAt: new Date().toISOString(), returnedBy: adminName }, bookingId);
}
function cancelBooking({ bookingId, userId }) {
  const bookings = sheetDataToObject(getDB().getSheetByName('Bookings'));
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== 'Booked') throw new Error("Cannot cancel a booking that is already in use or completed.");
  return addOrUpdateRecord('Bookings', { status: 'Not Used' }, bookingId);
}

// User Specific
function addUser(data) { return addOrUpdateRecord('Users', data); }
function updateUser({ id, data }) { return addOrUpdateRecord('Users', data, id); }
function deleteUser({ id }) { return deleteRecord('Users', id); }

// Classroom Specific
function addClassroom(data) { return addOrUpdateRecord('Classrooms', data); }
function updateClassroom({ id, data }) { return addOrUpdateRecord('Classrooms', data, id); }
function deleteClassroom({ id }) { return deleteRecord('Classrooms', id); }

// Equipment Specific
function addEquipment(data) { return addOrUpdateRecord('Equipment', data); }
function updateEquipment({ id, data }) { return addOrUpdateRecord('Equipment', data, id); }
function deleteEquipment({ id }) { return deleteRecord('Equipment', id); }

// Reporting
function getReportData(filters) {
  let data = getBookingsWithStatus();
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    data = data.filter(b => b.date && new Date(b.date) >= startDate);
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    data = data.filter(b => b.date && new Date(b.date) <= endDate);
  }
  if (filters.program) data = data.filter(b => b.program === filters.program);
  if (filters.teacherId) data = data.filter(b => b.userId === filters.teacherId);
  if (filters.equipmentId) data = data.filter(b => Array.isArray(b.equipment) && b.equipment.includes(filters.equipmentId));
  return data;
}
`;