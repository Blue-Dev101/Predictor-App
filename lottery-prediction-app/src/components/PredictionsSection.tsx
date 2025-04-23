import { useState } from 'react';

interface PredictionsSectionProps {
  onGenerate: (model: string) => Promise<any>;
}

interface Prediction {
  numbers: number[];
  bonusNumber: number;
  source: string;
  date: string;
}

const PredictionsSection: React.FC<PredictionsSectionProps> = ({ onGenerate }) => {
  const [selectedModel, setSelectedModel] = useState('neural');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePrediction = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await onGenerate(selectedModel);
      if (result) {
        setPrediction(result);
      } else {
        setError('Failed to generate prediction. Please try again.');
      }
    } catch (err) {
      console.error('Error generating prediction:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Lottery Predictions</h2>

      <div className="mb-4">
        <label htmlFor="model" className="block text-gray-700 mb-2">
          Select Prediction Model
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="random">Basic Random</option>
          <option value="ml">Machine Learning</option>
          <option value="neural">Neural Network</option>
        </select>
        <p className="text-gray-500 text-sm mt-1">
          {selectedModel === 'random' && 'Basic random number generation without any pattern analysis.'}
          {selectedModel === 'ml' && 'Uses frequency analysis and basic pattern recognition.'}
          {selectedModel === 'neural' && 'Uses advanced neural network for deep pattern recognition (recommended).'}
        </p>
      </div>

      <button
        onClick={handleGeneratePrediction}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4"
      >
        {loading ? 'Generating...' : 'Get Prediction'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {prediction && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Your Prediction</h3>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {prediction.numbers.map((number, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold"
                >
                  {number}
                </div>
              ))}

              <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center text-lg font-bold">
                {prediction.bonusNumber}
              </div>
            </div>

            <div className="text-center text-gray-700">
              <p>
                <span className="font-semibold">Method:</span> {prediction.source.replace('_', ' ')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Generated on {new Date(prediction.date).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="font-semibold">Disclaimer:</p>
            <p>Predictions are based on statistical analysis and pattern recognition. Lottery drawings are random events and no prediction system can guarantee winnings.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionsSection;
