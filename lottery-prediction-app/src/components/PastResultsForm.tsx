import { useState } from 'react';

interface PastResultsFormProps {
  onSave: (numbers: number[], bonusNumber: number) => Promise<boolean>;
}

const PastResultsForm: React.FC<PastResultsFormProps> = ({ onSave }) => {
  const [numbersInput, setNumbersInput] = useState('');
  const [bonusNumber, setBonusNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateNumbers = (input: string): number[] | null => {
    const numbers = input.split(',')
      .map(n => n.trim())
      .filter(Boolean)
      .map(n => parseInt(n, 10));

    // Check if we have 7 numbers
    if (numbers.length !== 7) {
      setError('Please enter exactly 7 numbers, comma-separated');
      return null;
    }

    // Check if all are valid numbers between 1-49
    const isValid = numbers.every(n => !isNaN(n) && n >= 1 && n <= 49);
    if (!isValid) {
      setError('All numbers must be between 1 and 49');
      return null;
    }

    // Check for duplicates
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== numbers.length) {
      setError('There should be no duplicate numbers');
      return null;
    }

    return numbers;
  };

  const validateBonusNumber = (input: string): number | null => {
    const number = parseInt(input.trim(), 10);

    if (isNaN(number) || number < 1 || number > 49) {
      setError('Bonus number must be between 1 and 49');
      return null;
    }

    return number;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset messages
    setError('');
    setSuccess('');

    // Validate numbers
    const parsedNumbers = validateNumbers(numbersInput);
    if (!parsedNumbers) return;

    // Validate bonus number
    const parsedBonusNumber = validateBonusNumber(bonusNumber);
    if (parsedBonusNumber === null) return;

    // Submit the data
    setIsSubmitting(true);
    try {
      const result = await onSave(parsedNumbers, parsedBonusNumber);
      if (result) {
        setSuccess('Past lottery result saved successfully!');
        // Reset form
        setNumbersInput('');
        setBonusNumber('');
      } else {
        setError('Failed to save result. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Enter Past Lottery Results</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="numbers" className="block text-gray-700 mb-2">
            Enter 7 numbers, comma-separated
          </label>
          <input
            type="text"
            id="numbers"
            value={numbersInput}
            onChange={e => setNumbersInput(e.target.value)}
            placeholder="E.g., 7, 15, 23, 31, 37, 42, 49"
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
          <p className="text-gray-500 text-sm mt-1">Enter 7 unique numbers between 1-49</p>
        </div>

        <div className="mb-4">
          <label htmlFor="bonusNumber" className="block text-gray-700 mb-2">
            Enter bonus number
          </label>
          <input
            type="text"
            id="bonusNumber"
            value={bonusNumber}
            onChange={e => setBonusNumber(e.target.value)}
            placeholder="E.g., 25"
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
          <p className="text-gray-500 text-sm mt-1">Enter a number between 1-49</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <p>{success}</p>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Results'}
        </button>
      </form>
    </div>
  );
};

export default PastResultsForm;
