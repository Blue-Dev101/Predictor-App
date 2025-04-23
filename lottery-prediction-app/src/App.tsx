import React, { useState, useEffect } from 'react';
// First install axios: npm install axios @types/axios
import axios, { AxiosResponse } from 'axios';

interface PastResult {
  id: number;
  numbers: string;
  bonus_number: number;
  date: string;
}

interface Prediction {
  id: number;
  numbers: string;
  bonus_number: number;
  source: string;
  date: string;
}

interface Pattern {
  id: number;
  pattern_description: string;
  confidence: number;
  date: string;
}

interface AccuracyData {
  accuracy: number;
  matches: number;
  totalPredictions: number;
}
import './index.css';

// Components
import PastResultsForm from './components/PastResultsForm';
import PredictionsSection from './components/PredictionsSection';
import PredictionAccuracy from './components/PredictionAccuracy';
import PastResultsList from './components/PastResultsList';
import ChatbotSection from './components/ChatbotSection';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Helper function to generate random unique numbers
const generateRandomNumbers = (count: number, min: number, max: number) => {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

function App() {
  const [pastResults, setPastResults] = useState<PastResult[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [accuracy, setAccuracy] = useState<AccuracyData>({ accuracy: 0, matches: 0, totalPredictions: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Calculate accuracy based on past results and predictions
  const calculateAccuracy = (pastResults: PastResult[], predictions: Prediction[]): AccuracyData => {
    let matches = 0;
    let totalMatches = 0;

    predictions.forEach(prediction => {
      const predictionNumbers = prediction.numbers.split(',').map(n => parseInt(n.trim()));
      pastResults.forEach(result => {
        const resultNumbers = result.numbers.split(',').map(n => parseInt(n.trim()));
        const matchingNumbers = predictionNumbers.filter(n => resultNumbers.includes(n));
        if (matchingNumbers.length >= 3) {
          matches++;
        }
        totalMatches++;
      });
    });

    return {
      accuracy: totalMatches > 0 ? (matches / totalMatches) * 100 : 0,
      matches,
      totalPredictions: predictions.length
    };
  };

  // Handle saving a new past result
  const handleSavePastResult = async (numbers: number[], bonusNumber: number): Promise<boolean> => {
    try {
      setLoading(true);

      // Add the new result to the local state
      const newResult = {
        id: pastResults.length > 0 ? Math.max(...pastResults.map((r: PastResult) => r.id)) + 1 : 1,
        numbers: numbers.join(','),
        bonus_number: bonusNumber,
        date: new Date().toISOString()
      };

      const updatedResults = [newResult, ...pastResults];
      setPastResults(updatedResults);

      // Update accuracy
      const newAccuracy = calculateAccuracy(updatedResults, predictions);
      setAccuracy(newAccuracy);

      // Detect patterns based on updated results
      if (updatedResults.length >= 3) {
        const newPatterns = detectPatterns(updatedResults);
        setPatterns(newPatterns);
      }

      // Try to save to backend if available
      if (backendAvailable) {
        try {
          await axios.post(`${API_URL}/store`, { numbers, bonusNumber });

          // Refresh data from backend
          const resultsResponse = await axios.get(`${API_URL}/past-results`);
          setPastResults(resultsResponse.data);

          const patternsResponse = await axios.get(`${API_URL}/patterns`);
          setPatterns(patternsResponse.data);
        } catch (err) {
          console.warn('Backend save failed, using local data only');
        }
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error saving past result:', err);
      setLoading(false);
      return false;
    }
  };

  // Simple pattern detection for front-end use
  const detectPatterns = (results: any[]) => {
    if (results.length < 3) return [];

    // Count frequency of each number
    const numberFrequency: {[key: number]: number} = {};

    // Check for number pairs that appear together frequently
    const pairFrequency: {[key: string]: number} = {};

    results.forEach(result => {
      const numbers = result.numbers.split(',').map((n: string) => parseInt(n.trim()));

      // Count individual numbers
      numbers.forEach((num: number) => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      });

      // Count pairs
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pairKey = `${numbers[i]},${numbers[j]}`;
          pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        }
      }
    });

    const patterns = [];

    // Find frequent pairs (appearing in more than 1/3 of results)
    const frequentPairs = Object.entries(pairFrequency)
      .filter(([_, count]) => count >= Math.ceil(results.length / 3))
      .sort((a, b) => b[1] - a[1]);

    frequentPairs.slice(0, 3).forEach(([pair, count]) => {
      const confidence = count / results.length;
      patterns.push({
        id: patterns.length + 1,
        pattern_description: `Numbers ${pair} appear together frequently`,
        confidence,
        date: new Date().toISOString()
      });
    });

    // Find hot numbers (appearing in more than 1/3 of results)
    const hotNumbers = Object.entries(numberFrequency)
      .filter(([_, count]) => count >= Math.ceil(results.length / 3))
      .map(([num]) => parseInt(num))
      .sort((a, b) => a - b);

    if (hotNumbers.length > 0) {
      patterns.push({
        id: patterns.length + 1,
        pattern_description: `Hot numbers: ${hotNumbers.join(', ')}`,
        confidence: 0.6,
        date: new Date().toISOString()
      });
    }

    return patterns;
  };

  // Generate prediction based on past results
  const generatePrediction = (pastResults: PastResult[], model: string): { numbers: number[]; bonusNumber: number; source: string; date: string; } => {
    // Default to random if not enough data
    if (pastResults.length < 3) {
      return {
        numbers: generateRandomNumbers(5, 1, 50),
        bonusNumber: Math.floor(Math.random() * 50) + 1,
        source: 'random (insufficient data)',
        date: new Date().toISOString()
      };
    }

    // Count frequency of each number
    const numberFrequency: {[key: number]: number} = {};
    const bonusFrequency: {[key: number]: number} = {};

    pastResults.forEach(result => {
      const numbers = result.numbers.split(',').map((n: string) => parseInt(n.trim()));
      numbers.forEach(num => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      });

      bonusFrequency[result.bonus_number] = (bonusFrequency[result.bonus_number] || 0) + 1;
    });

    if (model === 'random') {
      return {
        numbers: generateRandomNumbers(5, 1, 50),
        bonusNumber: Math.floor(Math.random() * 50) + 1,
        source: 'random',
        date: new Date().toISOString()
      };
    }

    if (model === 'ml') {
      // Simple frequency-based model
      const numberPairs = [];
      for (let i = 1; i <= 50; i++) {
        numberPairs.push([i, numberFrequency[i] || 0]);
      }

      // Sort by frequency (higher frequency first)
      numberPairs.sort((a, b) => b[1] - a[1]);

      // Take top 7 most frequent numbers
      const mostFrequent = numberPairs.slice(0, 5).map(pair => pair[0]);

      // For the bonus number, take most frequent
      const bonusPairs = [];
      for (let i = 1; i <= 50; i++) {
        bonusPairs.push([i, bonusFrequency[i] || 0]);
      }
      bonusPairs.sort((a, b) => b[1] - a[1]);
      const bonusNumber = bonusPairs[0] ? bonusPairs[0][0] : Math.floor(Math.random() * 50) + 1;

      return {
        numbers: mostFrequent.sort((a, b) => a - b),
        bonusNumber,
        source: 'machine_learning',
        date: new Date().toISOString()
      };
    }

    // Neural network model (more sophisticated)
    const recentResults = pastResults.slice(0, Math.min(10, pastResults.length));
    const olderResults = pastResults.slice(Math.min(10, pastResults.length));

    // Apply weights to numbers based on recency
    const weightedFrequency: {[key: number]: number} = {};
    const totalResults = recentResults.length;

    if (totalResults === 0) {
      return {
        numbers: generateRandomNumbers(5, 1, 50),
        bonusNumber: Math.floor(Math.random() * 50) + 1,
        source: 'neural_network (insufficient data)',
        date: new Date().toISOString()
      };
    }

    // More recent results get higher weight
    recentResults.forEach((result, index) => {
      // Ensure weight is never zero by adding a small base value
      const recencyWeight = 0.1 + (1 - (index / totalResults * 0.5));
      const numbers = result.numbers.split(',').map((n: string) => parseInt(n.trim()));

      // Validate numbers before processing
      const validNumbers = numbers.filter(num => !isNaN(num) && num >= 1 && num <= 50);
      validNumbers.forEach(num => {
        weightedFrequency[num] = (weightedFrequency[num] || 0) + recencyWeight;
      });
    });

    // Get numbers that appeared recently with validation
    const recentNumbers = new Set<number>();
    recentResults.forEach(result => {
      const numbers = result.numbers.split(',').map((n: string) => parseInt(n.trim()));
      numbers.filter(num => !isNaN(num) && num >= 1 && num <= 50).forEach(num => {
        recentNumbers.add(num);
      });
    });

    // Create pairs of [number, weight] with improved weighting
    const weightedPairs: [number, number][] = [];
    for (let i = 1; i <= 50; i++) {
      let weight = weightedFrequency[i] || 0;

      // Hot numbers get a balanced boost
      if (recentNumbers.has(i)) {
        weight *= 1.15; // Reduced multiplier for more balanced predictions
      }

      // Add normalized base frequency from older results
      const baseFrequency = (numberFrequency[i] || 0) / Math.max(1, pastResults.length);
      weight += baseFrequency * 0.35;

      weightedPairs.push([i, weight]);
    }

    // Sort by weight and ensure unique selection
    weightedPairs.sort((a, b) => b[1] - a[1]);
    const selectedNumbers = new Set<number>();

    // Select numbers based on weighted probability
    let index = 0;
    while (selectedNumbers.size < 5 && index < weightedPairs.length) {
      const [num, weight] = weightedPairs[index];
      if (!selectedNumbers.has(num)) {
        selectedNumbers.add(num);
      }
      index++;
    }

    // For bonus number, use weighted selection from remaining numbers
    const remainingPairs = weightedPairs.filter(([num]) => !selectedNumbers.has(num));
    const bonusNumber = remainingPairs.length > 0 ? remainingPairs[0][0] : Math.floor(Math.random() * 50) + 1;

    return {
      numbers: Array.from(selectedNumbers).sort((a, b) => a - b),
      bonusNumber,
      source: 'neural_network',
      date: new Date().toISOString()
    };
  };

  // Handle generating a new prediction
  const handleGeneratePrediction = async (model = 'neural'): Promise<{ numbers: number[]; bonusNumber: number; source: string; date: string; } | null> => {
    try {
      setLoading(true);

      if (backendAvailable) {
        try {
          const response = await axios.get(`${API_URL}/predict`, {
            params: { model }
          });

          // Refresh predictions
          const predictionsResponse = await axios.get(`${API_URL}/predictions`);
          setPredictions(predictionsResponse.data);

          setLoading(false);
          return response.data.prediction;
        } catch (err) {
          console.warn('Backend prediction failed, using local prediction');
          setBackendAvailable(false);
        }
      }

      // Generate prediction based on local data
      const prediction = generatePrediction(pastResults, model);

      // Add to predictions list
      const newPrediction = {
        id: predictions.length > 0 ? Math.max(...predictions.map((p: Prediction) => p.id)) + 1 : 1,
        numbers: prediction.numbers.join(','),
        bonus_number: prediction.bonusNumber,
        source: prediction.source,
        date: prediction.date
      };

      const updatedPredictions = [newPrediction, ...predictions];
      setPredictions(updatedPredictions);

      // Update accuracy with new prediction
      const newAccuracy = calculateAccuracy(pastResults, updatedPredictions);
      setAccuracy(newAccuracy);

      setLoading(false);
      return prediction;
    } catch (err) {
      console.error('Error generating prediction:', err);
      setLoading(false);
      return null;
    }
  };

  // Check for backend connection at startup
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        await axios.get(`${API_URL}/past-results`);
        setBackendAvailable(true);
      } catch (err) {
        console.warn('Backend server not available, using local storage only');
        setBackendAvailable(false);
      }
    };

    checkBackendConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pb-10" role="main">
      <header className="bg-blue-800 text-white p-6 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Lottery Prediction System</h1>
          <p className="text-blue-200 mt-2">Powered by Machine Learning & Neural Networks</p>
        </div>
      </header>

      {!backendAvailable && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 container mx-auto mt-4">
          <p className="font-bold">Note: Backend server is not available</p>
          <p>The application is running with local calculations only. Your data will not be persisted between sessions.</p>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {loading === true ? (
          <div className="text-center py-10">
            <p className="text-xl">Processing data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <p className="font-bold">Error!</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <PastResultsForm onSave={handleSavePastResult} />

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Past Lottery Results</h2>
                <p className="text-gray-600 mb-4">
                  Enter past lottery results above to improve prediction accuracy. The more results you enter, the better the predictions will be.
                </p>
                <PastResultsList results={pastResults} />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">How It Works</h2>
                <div className="prose prose-blue">
                  <p>This app uses the past lottery results you enter to identify patterns and calculate probabilities for future draws.</p>
                  <p>The neural network model analyzes:</p>
                  <ul>
                    <li>Frequency of each number</li>
                    <li>Recent trends and hot numbers</li>
                    <li>Number pairs that appear together</li>
                  </ul>
                  <p className="text-amber-600">Note: Lottery draws are random events. While our models analyze patterns, no prediction can guarantee winning numbers.</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <PredictionsSection onGenerate={handleGeneratePrediction} />

              {pastResults.length >= 3 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Prediction Accuracy & Pattern Analysis</h2>
                  <PredictionAccuracy accuracy={accuracy} patterns={patterns} />
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Lottery Assistant</h2>
                <ChatbotSection apiUrl={`${API_URL}/chat`} demoMode={!backendAvailable} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-blue-900 text-white p-6 mt-10">
        <div className="container mx-auto text-center">
          <p>Lottery Prediction System &copy; 2025</p>
          <p className="text-blue-300 text-sm mt-2">
            Disclaimer: This application is for educational purposes only. Lottery games are based on chance, and no prediction system can guarantee winnings.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
