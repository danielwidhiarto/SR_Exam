import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import NavbarComponent from "../components/NavbarComponent";
import { Alert } from 'react-bootstrap'; // Import Bootstrap's Alert component

export default function StudentExamSchedulerPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [classes, setClasses] = useState<Enrollment[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [examDate, setExamDate] = useState<string>("");
  const [examRoom, setExamRoom] = useState<string>("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState<string>("");
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertVariant, setAlertVariant] = useState<string>("success");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [submissionDetails, setSubmissionDetails] = useState<string | null>(null);

  useEffect(() => {
    invoke("get_all_subject").then((result) => {
      setSubjects(result as Subject[]);
    });

    invoke("get_all_room").then((result) => {
      setRooms(result as Room[]);
    });
  }, []);

  useEffect(() => {
    invoke("get_all_shifts").then((result) => {
      setShifts(result as Shift[]);
    });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      invoke("get_enrollments_by_subject_code", { subjectCode: selectedSubject }).then((result) => {
        setClasses(result as Enrollment[]);
      });
    }
  }, [selectedSubject]);

  const handleSubjectChange = (subjectCode: string, subjectName: string) => {
    setSelectedSubject(subjectCode);
    setSearchTerm(`${subjectCode}-${subjectName}`);
    setSelectedClasses([]); // Reset selected classes when subject changes
    setIsDropdownOpen(false);
  };

  const resetForm = () => {
    setSelectedSubject("");
    setSelectedClasses([]);
    setSearchTerm("");
    setIsDropdownOpen(false);
    setExamDate("");
    setExamRoom("");
    setRoomSearchTerm("");
    setIsRoomDropdownOpen(false);
    setSelectedShift("");
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const classCode = e.target.value;
    setSelectedClasses((prev) =>
      e.target.checked
        ? [...prev, classCode]
        : prev.filter((code) => code !== classCode)
    );
  };

  const handleRoomChange = (roomNumber: string) => {
    setExamRoom(roomNumber);
    setRoomSearchTerm(roomNumber);
    setIsRoomDropdownOpen(false);
  };

  const handleShiftChange = (shiftCode: string) => {
    setSelectedShift(shiftCode);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Clear time part to compare only dates

    if (selectedDate <= today) {
      setAlertMessage("The exam date must be in the future.");
      setAlertVariant("danger");
    } else {
      setAlertMessage(null);
    }

    setExamDate(e.target.value);
  };

  const handleSubmit = () => {
    const selectedDate = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Clear time part to compare only dates
  
    if (selectedDate <= today) {
      setAlertMessage("The exam date must be in the future.");
      setAlertVariant("danger");
      return;
    }
  
    const examData = {
      subjectCode: selectedSubject,
      classCodes: selectedClasses,
      date: examDate,
      shiftCode: selectedShift,
      roomNumber: examRoom,
    };
  
    invoke("allocate_exam", examData)
      .then((response) => {
        const res = response as any;
        console.log("Exam allocated successfully", res);
        setAlertMessage(null);
        setSubmissionDetails(`
          Received data:
          Transaction Code: ${res.transaction_code}
          Subject Code: ${examData.subjectCode}
          Class Codes: ${JSON.stringify(examData.classCodes)}
          Date: ${examData.date}
          Shift Code: ${examData.shiftCode}
          Room Number: ${examData.roomNumber}
          
          Transaction committed successfully.
        `);
        setAlertVariant("success");
        resetForm(); // Reset the form here
      })
      .catch((error) => {
        console.error("Failed to allocate exam", error);
        setAlertMessage("Failed to allocate exam.");
        setAlertVariant("danger");
      });
  };
  

  const filteredSubjects = subjects.filter((subject) =>
    subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter((room) =>
    room.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase())
  );

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">Student Exam Scheduler Page</h3>
      <div className="ml-5">
        <label htmlFor="subject-search" className="block mb-2">Search and Select a Subject:</label>
        <div className="relative mb-4">
          <input
            id="subject-search"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="Type to search..."
          />
          {isDropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject) => (
                  <div
                    key={subject.subject_code}
                    onClick={() => handleSubjectChange(subject.subject_code, subject.subject_name)}
                    className="cursor-pointer p-2 hover:bg-gray-200"
                  >
                    {subject.subject_code}-{subject.subject_name}
                  </div>
                ))
              ) : (
                <div className="p-2">No subjects found</div>
              )}
            </div>
          )}
        </div>
  
        {selectedSubject && (
          <div>
            <h4 className="mb-2">Select Classes:</h4>
            {classes.map((enrollment) => (
              <div key={enrollment.class_code}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={enrollment.class_code}
                    checked={selectedClasses.includes(enrollment.class_code)}
                    onChange={handleClassChange}
                    className="mr-2"
                  />
                  {enrollment.class_code}
                </label>
              </div>
            ))}
          </div>
        )}
  
        {selectedClasses.length > 0 && (
          <div className="mt-4">
            <label htmlFor="exam-date" className="block mb-2">Select Exam Date:</label>
            <input
              id="exam-date"
              type="date"
              value={examDate}
              onChange={handleDateChange}
              className="p-2 border border-gray-300 rounded w-full mb-4"
            />
  
            <label htmlFor="exam-shift" className="block mb-2">Select Exam Time:</label>
            <select
              id="exam-shift"
              value={selectedShift}
              onChange={(e) => handleShiftChange(e.target.value)}
              className="p-2 border border-gray-300 rounded w-full mb-4"
            >
              <option value="" disabled>Select time</option>
              {shifts.map((shift) => (
                <option key={shift.shift_code} value={shift.shift_code}>
                  {shift.start_time} - {shift.end_time}
                </option>
              ))}
            </select>
  
            <label htmlFor="room-search" className="block mb-2">Search and Select Exam Room:</label>
            <div className="relative mb-4">
              <input
                id="room-search"
                type="text"
                value={roomSearchTerm}
                onChange={(e) => {
                  setRoomSearchTerm(e.target.value);
                  setIsRoomDropdownOpen(true);
                }}
                onFocus={() => setIsRoomDropdownOpen(true)}
                className="p-2 border border-gray-300 rounded w-full"
                placeholder="Type to search room number..."
              />
              {isRoomDropdownOpen && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <div
                        key={room.room_number}
                        onClick={() => handleRoomChange(room.room_number)}
                        className="cursor-pointer p-2 hover:bg-gray-200"
                      >
                        {room.room_number}
                      </div>
                    ))
                  ) : (
                    <div className="p-2">No rooms found</div>
                  )}
                </div>
              )}
            </div>
  
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white p-2 rounded mt-4"
            >
              Submit
            </button>
          </div>
        )}
  
        {alertMessage && (
          <Alert variant={alertVariant} onClose={() => setAlertMessage(null)} dismissible>
            {alertMessage}
          </Alert>
        )}
        
        {submissionDetails && (
          <Alert variant={alertVariant} onClose={() => setSubmissionDetails(null)} dismissible>
            <pre>{submissionDetails}</pre>
          </Alert>
        )}
      </div>
    </div>
  );
}  