import NavbarComponent from "../components/NavbarComponent";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

export default function ViewTransactionPage() {
  const [transactions, setTransactions] = useState<ViewTransaction[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectCodeToNameMap, setSubjectCodeToNameMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    invoke("view_transaction").then((result) => {
      setTransactions(result as ViewTransaction[]);
    });

    invoke("get_all_subject").then((result) => {
      const subjectsData = result as Subject[];
      setSubjects(subjectsData);

      // Create a mapping from subject code to subject name
      const mapping: { [key: string]: string } = {};
      subjectsData.forEach(subject => {
        mapping[subject.subject_code] = subject.subject_name;
      });
      setSubjectCodeToNameMap(mapping);
    });
  }, []);

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <div className="container mx-auto">
        <h3 className="text-left ml-5 mt-3 mb-3">View Transaction Page</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
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
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-6 text-left">{transaction.date}</td>
                  <td className="py-3 px-6 text-left">{transaction.room_number}</td>
                  <td className="py-3 px-6 text-left">{transaction.subject_codes}</td>
                  <td className="py-3 px-6 text-left">{subjectCodeToNameMap[transaction.subject_codes]}</td>
                  <td className="py-3 px-6 text-left">{transaction.shift_code}</td>
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