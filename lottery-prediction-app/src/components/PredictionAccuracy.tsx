interface AccuracyData {
  accuracy: number;
  matches: number;
  totalPredictions: number;
}

interface Pattern {
  id: number;
  pattern_description: string;
  confidence: number;
  date: string;
}

interface PredictionAccuracyProps {
  accuracy: AccuracyData;
  patterns: Pattern[];
}

const PredictionAccuracy: React.FC<PredictionAccuracyProps> = ({ accuracy, patterns }) => {
  const { accuracy: accuracyValue, matches, totalPredictions } = accuracy;

  // Format the accuracy percentage
  const formattedAccuracy = (accuracyValue * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Accuracy Section */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Prediction Accuracy</h3>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          {matches > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-700 font-medium">Overall Accuracy</span>
                <span className="text-blue-800 font-semibold">{formattedAccuracy}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${formattedAccuracy}%` }}
                ></div>
              </div>

              <div className="text-sm text-gray-600 mt-2">
                <p>Based on {matches} correct numbers out of {totalPredictions * 8} total numbers predicted.</p>
                <p className="text-xs text-gray-500 mt-1">
                  (Each prediction contains 7 regular numbers plus 1 bonus number)
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-3">
              <p className="text-gray-500">Accuracy calculation is not available yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Add past results and make predictions to see accuracy data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Patterns Section */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Detected Patterns</h3>

        {patterns.length > 0 ? (
          <div className="space-y-2">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className="bg-white p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center">
                  <p className="text-gray-800">{pattern.pattern_description}</p>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {(pattern.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Detected on {new Date(pattern.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="text-gray-500">No patterns detected yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add more past results to discover number patterns
            </p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200 mt-4">
        <p className="font-semibold">How this works:</p>
        <p>Our AI system analyzes past lottery results to detect statistically significant patterns. The neural network learns over time, improving prediction accuracy as more data is collected.</p>
      </div>
    </div>
  );
};

export default PredictionAccuracy;
