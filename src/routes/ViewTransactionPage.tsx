import NavbarComponent from "../components/NavbarComponent";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import {
  Specification,
  DateSpecification,
  RoomSpecification,
  SubjectSpecification,
  CompositeSpecification
} from "../components/specification";

export default function ViewTransactionPage() {
  const [transactions, setTransactions] = useState<ViewTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<ViewTransaction[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectCodeToNameMap, setSubjectCodeToNameMap] = useState<{ [key: string]: string }>({});
  const [shiftCodeToTimeMap, setShiftCodeToTimeMap] = useState<{ [key: string]: string }>({});
  const [filters, setFilters] = useState({
    date: "",
    room: "",
    subject: ""
  });

  useEffect(() => {
    invoke("view_transaction").then((result) => {
      setTransactions(result as ViewTransaction[]);
    });

    invoke("get_all_subject").then((result) => {
      const subjectsData = result as Subject[];
      setSubjects(subjectsData);

      const subjectMapping: { [key: string]: string } = {};
      subjectsData.forEach(subject => {
        subjectMapping[subject.subject_code] = subject.subject_name;
      });
      setSubjectCodeToNameMap(subjectMapping);
    });

    invoke("get_all_shifts").then((result) => {
      const shiftsData = result as Shift[];
      const shiftMapping: { [key: string]: string } = {};
      shiftsData.forEach(shift => {
        shiftMapping[shift.shift_code] = `${shift.start_time} - ${shift.end_time}`;
      });
      setShiftCodeToTimeMap(shiftMapping);
    });
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const applyFilters = () => {
    let specs: Specification<ViewTransaction>[] = [];

    if (filters.date) {
      specs.push(new DateSpecification(filters.date));
    }

    if (filters.room) {
      specs.push(new RoomSpecification(filters.room));
    }

    if (filters.subject) {
      specs.push(new SubjectSpecification(filters.subject));
    }

    const compositeSpec = new CompositeSpecification<ViewTransaction>(...specs);
    const filtered = transactions.filter(transaction => compositeSpec.isSatisfiedBy(transaction));
    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">View Transaction Page</h3>
      <div className="ml-5 mt-3 mb-2 mr-5">
        <div className="mb-3">
          <label className="mr-2">Date:</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="mr-4 p-2 border border-gray-300"
          />
          <label className="mr-2">Room:</label>
          <input
            type="text"
            name="room"
            value={filters.room}
            onChange={handleFilterChange}
            className="mr-4 p-2 border border-gray-300"
          />
          <label className="mr-2">Subject:</label>
          <select
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300"
          >
            <option value="">Select Subject</option>
            {subjects.map(subject => (
              <option key={subject.subject_code} value={subject.subject_code}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-responsive p-3">
          <table className="table table-hover table-bordered">
            <thead className="thead-dark">
              <tr className="bg-gray-200 text-gray-600 text-sm leading-normal">
                <th className="py-3 px-6 text-left">Transaction Date</th>
                <th className="py-3 px-6 text-left">Room</th>
                <th className="py-3 px-6 text-left">Subject Code</th>
                <th className="py-3 px-6 text-left">Subject Name</th>
                <th className="py-3 px-6 text-left">Time</th>
                <th className="py-3 px-6 text-left">Proctoring Assistant</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-6 text-left">{transaction.date}</td>
                  <td className="py-3 px-6 text-left">{transaction.room_number}</td>
                  <td className="py-3 px-6 text-left">{transaction.subject_codes}</td>
                  <td className="py-3 px-6 text-left">{subjectCodeToNameMap[transaction.subject_codes]}</td>
                  <td className="py-3 px-6 text-left">{shiftCodeToTimeMap[transaction.shift_code]}</td>
                  <td className="py-3 px-6 text-left">{transaction.proctor !== null ? transaction.proctor : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}