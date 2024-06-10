// Frontend code
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import NavbarComponent from "../components/NavbarComponent";

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scheduledRooms, setScheduledRooms] = useState<ScheduledRoom[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Changed type to Date

  useEffect(() => {
    invoke("get_all_room").then((rooms) => {
      setRooms(rooms as Room[]);
    });

    invoke("get_all_shifts").then((shifts) => {
      console.log("Fetched shifts:", shifts); // Debugging line
      setShifts(shifts as Shift[]);
    });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      invoke("get_scheduled_rooms", {
        selectedDate: selectedDate.toISOString().split("T")[0],
      }) // Pass selectedDate with the correct key
        .then((scheduledRooms) => {
          console.log("Fetched scheduled rooms:", scheduledRooms); // Debugging line
          setScheduledRooms(scheduledRooms as ScheduledRoom[]);
        })
        .catch((error) =>
          console.error("Error fetching scheduled rooms:", error)
        ); // Handle any errors
    }
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    const selectedDate = new Date(dateValue); // Convert string to Date object
    setSelectedDate(selectedDate);
  };

  const isRoomScheduled = (roomNumber: string, shiftCode: string) => {
    const scheduled = scheduledRooms.some(
      (scheduledRoom) =>
        scheduledRoom.room_number === roomNumber &&
        scheduledRoom.shift_code === shiftCode
    );
    console.log(
      `Room ${roomNumber} Shift ${shiftCode} Scheduled: ${scheduled}`
    ); // Debugging line
    return scheduled;
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.campus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">Room Management Page</h3>

      <div className="ml-5 mt-3 mb-3">
        <label htmlFor="date">Select Date: </label>
        <input
          type="date"
          id="date"
          value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""} // Convert Date to string in "YYYY-MM-DD" format
          onChange={handleDateChange}
          className="form-control"
        />
      </div>

      <div className="ml-5 mt-3 mb-3">
        <input
          type="text"
          placeholder="Search by room number or campus"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="ml-5 mt-3 mb-3">
        <button
          className="btn btn-primary"
          onClick={() => setSelectedDate(null)}
        >
          Clear Date
        </button>
      </div>

      <div className="table-responsive p-12">
        <table className="table table-hover table-bordered">
          <thead className="thead-dark">
            <tr>
              <th scope="col">Room Number</th>
              <th scope="col">Room Capacity</th>
              {shifts.map((shift) => (
                <th scope="col" key={shift.shift_code}>
                  {shift.start_time} - {shift.end_time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room: Room) => (
              <tr key={room.room_number as React.Key}>
                <td>{room.room_number}</td>
                <td>{room.room_capacity.toString()}</td>
                {shifts.map((shift) => (
                  <td
                    key={shift.shift_code}
                    style={
                      isRoomScheduled(room.room_number, shift.shift_code)
                        ? { backgroundColor: "red" }
                        : {}
                    }
                  >
                    {isRoomScheduled(room.room_number, shift.shift_code)
                      ? "Scheduled"
                      : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
