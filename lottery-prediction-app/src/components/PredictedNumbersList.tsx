interface Prediction {
  id: number;
  numbers: string;
  bonus_number: number;
  source: string;
  date: string;
}

interface PredictedNumbersListProps {
  predictions: Prediction[];
}

const PredictedNumbersList: React.FC<PredictedNumbersListProps> = ({ predictions }) => {
  if (predictions.length === 0) {
    return (
      <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
        <p className="text-gray-500">No predictions available</p>
        <p className="text-sm text-gray-400 mt-1">Generate a prediction to get started</p>
      </div>
    );
  }

  // Function to format source name for display
  const formatSource = (source: string): string => {
    switch (source) {
      case 'random':
        return 'Random';
      case 'machine_learning':
        return 'Machine Learning';
      case 'neural_network':
        return 'Neural Network';
      default:
        return source.replace('_', ' ');
    }
  };

  return (
    <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numbers</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {predictions.map((prediction) => {
            const numbersArray = prediction.numbers.split(',').map(n => parseInt(n.trim()));
            const date = new Date(prediction.date).toLocaleDateString();

            return (
              <tr key={prediction.id}>
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
                    {prediction.bonus_number}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prediction.source === 'random' ? 'bg-gray-100 text-gray-800' :
                    prediction.source === 'machine_learning' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {formatSource(prediction.source)}
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

export default PredictedNumbersList;
