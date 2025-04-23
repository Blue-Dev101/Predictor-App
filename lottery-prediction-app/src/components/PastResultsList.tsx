interface PastResult {
  id: number;
  numbers: string;
  bonus_number: number;
  date: string;
}

interface PastResultsListProps {
  results: PastResult[];
}

const PastResultsList: React.FC<PastResultsListProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
        <p className="text-gray-500">No past results available</p>
        <p className="text-sm text-gray-400 mt-1">Add past lottery results to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numbers</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result) => {
            const numbersArray = result.numbers.split(',').map(n => parseInt(n.trim()));
            const date = new Date(result.date).toLocaleDateString();

            return (
              <tr key={result.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {numbersArray.map((number, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {result.bonus_number}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PastResultsList;
