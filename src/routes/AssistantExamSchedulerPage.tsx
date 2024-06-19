import NavbarComponent from "../components/NavbarComponent";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

export default function AssistantExamSchedulerPage() {
  const [transactions, setTransactions] = useState<ViewTransaction[]>([]);
  const [assistants, setAssistants] = useState<User[]>([]);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [assistantSearchTerm, setAssistantSearchTerm] = useState("");
  const [isTransactionDropdownOpen, setIsTransactionDropdownOpen] = useState(false);
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<ViewTransaction | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<User | null>(null);
  const [selectionPairs, setSelectionPairs] = useState<{ transaction: ViewTransaction, assistant: User }[]>([]);

  useEffect(() => {
    invoke("view_transaction").then((result) => {
      setTransactions(result as ViewTransaction[]);
    });

    invoke("get_all_users").then((result) => {
      const users = result as User[];
      const assistants = users.filter(user => user.role === "Assistant");
      setAssistants(assistants);
    });
  }, []);

  const filteredTransactions = transactions.filter((transaction) =>
    !selectionPairs.some(pair => pair.transaction.transaction_code === transaction.transaction_code) &&
    (transaction.subject_codes.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
    transaction.date.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
    transaction.room_number.toLowerCase().includes(transactionSearchTerm.toLowerCase()))
  );

  const filteredAssistants = assistants.filter((assistant) =>
    assistant.name.toLowerCase().includes(assistantSearchTerm.toLowerCase()) ||
    assistant.nim.toLowerCase().includes(assistantSearchTerm.toLowerCase())
  );

  const handleTransactionSelect = (transaction_code) => {
    const transaction = transactions.find(t => t.transaction_code === transaction_code);
    setSelectedTransaction(transaction || null);
    setIsTransactionDropdownOpen(false);
  };

  const handleAssistantSelect = (assistant) => {
    setSelectedAssistant(assistant);
    setIsAssistantDropdownOpen(false);
  };

  const handleAddPair = () => {
    if (selectedTransaction && selectedAssistant) {
      setSelectionPairs([...selectionPairs, { transaction: selectedTransaction, assistant: selectedAssistant }]);
      setSelectedTransaction(null);
      setSelectedAssistant(null);
      setTransactionSearchTerm("");
      setAssistantSearchTerm("");
    }
  };

  const handleRemovePair = (index) => {
    const newPairs = selectionPairs.filter((_, i) => i !== index);
    setSelectionPairs(newPairs);
  };

  const handleSubmit = () => {
    // Iterate over each pair and invoke the Rust command to update the proctor
    selectionPairs.forEach(async (pair) => {
      try {
        await invoke("update_transaction_proctor", {
          transaction_code: pair.transaction.transaction_code,
          selected_assistant: pair.assistant.nim // or pair.assistant.nim, depending on what uniquely identifies the assistant
        });
        console.log(`Proctor updated for transaction ${pair.transaction.transaction_code}`);
      } catch (error) {
        console.error(`Failed to update proctor for transaction ${pair.transaction.transaction_code}:`, error);
      }
    });

    // Clear the selection pairs after submission
    setSelectionPairs([]);
  };

  return (
    <div className="w-screen h-screen">
      <NavbarComponent />
      <h3 className="text-left ml-5 mt-3 mb-3">Assistant Exam Scheduler Page</h3>
      <div className="ml-5">

        <label htmlFor="transaction-search" className="block mb-2">Search and Select a Transaction:</label>
        <div className="relative mb-4">
          <input
            id="transaction-search"
            type="text"
            value={transactionSearchTerm}
            onChange={(e) => {
              setTransactionSearchTerm(e.target.value);
              setIsTransactionDropdownOpen(true);
            }}
            onFocus={() => setIsTransactionDropdownOpen(true)}
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="Type to search..."
          />
          {isTransactionDropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.transaction_code}
                    onClick={() => handleTransactionSelect(transaction.transaction_code)}
                    className="cursor-pointer p-2 hover:bg-gray-200"
                  >
                    {transaction.date} - {transaction.room_number} - {transaction.subject_codes} - {transaction.shift_code}
                  </div>
                ))
              ) : (
                <div className="p-2">No transactions found</div>
              )}
            </div>
          )}
        </div>

        {selectedTransaction && (
          <div className="relative mb-4">
            <h4>Selected Transaction</h4>
            <p><strong>Subject Codes:</strong> {selectedTransaction.subject_codes}</p>
            <p><strong>Date:</strong> {selectedTransaction.date}</p>
            <p><strong>Room Number:</strong> {selectedTransaction.room_number}</p>
            <p><strong>Shift Code:</strong> {selectedTransaction.shift_code}</p>
            <p><strong>Proctor:</strong> {selectedTransaction.proctor || 'N/A'}</p>
          </div>
        )}

        <label htmlFor="assistant-search" className="block mb-2">Search and Select an Assistant:</label>
        <div className="relative mb-4">
          <input
            id="assistant-search"
            type="text"
            value={assistantSearchTerm}
            onChange={(e) => {
              setAssistantSearchTerm(e.target.value);
              setIsAssistantDropdownOpen(true);
            }}
            onFocus={() => setIsAssistantDropdownOpen(true)}
            className="p-2 border border-gray-300 rounded w-full"
            placeholder="Type to search..."
          />
          {isAssistantDropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded mt-1 w-full max-h-60 overflow-y-auto">
              {filteredAssistants.length > 0 ? (
                filteredAssistants.map((assistant) => (
                  <div
                    key={assistant.nim}
                    onClick={() => handleAssistantSelect(assistant)}
                    className="cursor-pointer p-2 hover:bg-gray-200"
                  >
                    {assistant.name} ({assistant.nim})
                  </div>
                ))
              ) : (
                <div className="p-2">No assistants found</div>
              )}
            </div>
          )}
        </div>

        {selectedAssistant && (
          <div className="relative mb-4">
            <h4>Selected Assistant</h4>
            <p><strong>Name:</strong> {selectedAssistant.name}</p>
            <p><strong>NIM:</strong> {selectedAssistant.nim}</p>
            <p><strong>Major:</strong> {selectedAssistant.major}</p>
          </div>
        )}

        <button
          onClick={handleAddPair}
          className="bg-green-500 text-white px-4 py-2 rounded mb-4"
          disabled={!selectedTransaction || !selectedAssistant}
        >
          Add Pair
        </button>

        {selectionPairs.length > 0 && (
          <div className="relative mb-4">
            <h4>Selected Pairs</h4>
            {selectionPairs.map((pair, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <p>
                  Transaction: {pair.transaction.subject_codes} - {pair.transaction.date} - {pair.transaction.room_number}
                  <br />
                  Assistant: {pair.assistant.name} ({pair.assistant.nim})
                </p>
                <button onClick={() => handleRemovePair(index)} className="text-red-500">Remove</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
      </div>
    </div>
  );
}

