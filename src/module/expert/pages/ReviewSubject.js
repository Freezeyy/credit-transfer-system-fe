import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubjectDetails, reviewSubject } from '../hooks/useSMEReview';

export default function ReviewSubject() {
  const { applicationSubjectId } = useParams();
  const navigate = useNavigate();
  
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Topics comparison state
  const [topics, setTopics] = useState([]);
  const [averageSimilarity, setAverageSimilarity] = useState(0);
  const [smeNotes, setSmeNotes] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs to track latest values for immediate save
  const topicsRef = useRef(topics);
  const smeNotesRef = useRef(smeNotes);
  const averageSimilarityRef = useRef(averageSimilarity);
  
  // Update refs whenever state changes
  useEffect(() => {
    topicsRef.current = topics;
  }, [topics]);
  
  useEffect(() => {
    smeNotesRef.current = smeNotes;
  }, [smeNotes]);
  
  useEffect(() => {
    averageSimilarityRef.current = averageSimilarity;
  }, [averageSimilarity]);
  
  // Calculate average similarity from topics
  const calculateAverage = useCallback((topicsArray) => {
    if (!topicsArray || topicsArray.length === 0) {
      setAverageSimilarity(0);
      return 0;
    }

    const allSimilarities = topicsArray
      .map(topic => parseFloat(topic.similarityPercentage))
      .filter(sim => !isNaN(sim) && sim > 0);

    if (allSimilarities.length === 0) {
      setAverageSimilarity(0);
      return 0;
    }

    const sum = allSimilarities.reduce((acc, sim) => acc + sim, 0);
    const average = sum / allSimilarities.length;
    const roundedAverage = Math.round(average * 10) / 10;
    setAverageSimilarity(roundedAverage);
    return roundedAverage;
  }, []);

  // Save to localStorage with debouncing
  const saveToLocalStorage = useCallback((topicsData, notesData, avgSimilarity) => {
    if (!applicationSubjectId) return;
    
    try {
      setIsSaving(true);
      const dataToSave = {
        topics: topicsData,
        smeNotes: notesData,
        averageSimilarity: avgSimilarity,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`sme_review_${applicationSubjectId}`, JSON.stringify(dataToSave));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some browser data or contact support.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [applicationSubjectId]);

  // Load from localStorage on mount
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  
  useEffect(() => {
    if (applicationSubjectId) {
      try {
        const saved = localStorage.getItem(`sme_review_${applicationSubjectId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.topics && Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            console.log('Restoring from localStorage:', parsed);
            const hasContent = parsed.topics.some(t => 
              t.newSubjectTopic?.trim() || 
              t.pastSubjectTopics?.some(ps => ps.topic?.trim()) || 
              t.similarityPercentage?.trim()
            );
            
            if (hasContent) {
              setTopics(parsed.topics);
              setSmeNotes(parsed.smeNotes || '');
              topicsRef.current = parsed.topics;
              smeNotesRef.current = parsed.smeNotes || '';
              const avg = calculateAverage(parsed.topics);
              averageSimilarityRef.current = avg;
              if (parsed.savedAt) {
                setLastSaved(new Date(parsed.savedAt));
              }
              setHasRestoredFromStorage(true);
              console.log('Restored topics with content:', parsed.topics);
            } else {
              console.log('Topics found but all empty, not restoring');
            }
          }
        }
      } catch (e) {
        console.error('Error loading saved review:', e);
      } finally {
        setTimeout(() => {
          setIsRestoring(false);
        }, 100);
      }
    } else {
      setIsRestoring(false);
    }
  }, [applicationSubjectId, calculateAverage]);

  const loadSubjectDetails = useCallback(async () => {
    setLoading(true);
    const res = await getSubjectDetails(applicationSubjectId);
    if (res.success) {
      setSubjectData(res.data);
      setTopics(currentTopics => {
        if (!hasRestoredFromStorage && currentTopics.length === 0 && res.data.pastSubjects && res.data.pastSubjects.length > 0) {
          return [{
            id: Date.now(),
            newSubjectTopic: '',
            pastSubjectTopics: res.data.pastSubjects.map(() => ({ topic: '' })),
            similarityPercentage: '',
          }];
        }
        return currentTopics;
      });
    } else {
      alert(res.message || 'Failed to load subject details');
      navigate('/expert/assignments');
    }
    setLoading(false);
  }, [applicationSubjectId, hasRestoredFromStorage, navigate]);

  useEffect(() => {
    if (applicationSubjectId && !isRestoring) {
      loadSubjectDetails();
    }
  }, [applicationSubjectId, isRestoring, loadSubjectDetails]);

  // Save to localStorage whenever topics or notes change (with debounce)
  useEffect(() => {
    if (!applicationSubjectId || isRestoring) return;
    
    if (topics.length > 0 || smeNotes.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(topics, smeNotes, averageSimilarity);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [topics, smeNotes, averageSimilarity, applicationSubjectId, isRestoring, saveToLocalStorage]);

  // Save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (applicationSubjectId && (topicsRef.current.length > 0 || smeNotesRef.current.trim().length > 0)) {
        try {
          const dataToSave = {
            topics: topicsRef.current,
            smeNotes: smeNotesRef.current,
            averageSimilarity: averageSimilarityRef.current,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(`sme_review_${applicationSubjectId}`, JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Error saving before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [applicationSubjectId]);

  const addTopicRow = () => {
    const pastSubjectsCount = subjectData?.pastSubjects?.length || 1;
    const newTopic = {
      id: Date.now(),
      newSubjectTopic: '',
      pastSubjectTopics: Array(pastSubjectsCount).fill(null).map(() => ({ topic: '' })),
      similarityPercentage: '',
    };
    const updated = [...topics, newTopic];
    setTopics(updated);
  };

  // removeTopicRow is intentionally unused - kept for potential future use
  // eslint-disable-next-line no-unused-vars
  const removeTopicRow = (id) => {
    const updated = topics.filter(t => t.id !== id);
    setTopics(updated);
    calculateAverage(updated);
  };

  const updateTopic = (id, field, value) => {
    const updated = topics.map(topic => {
      if (topic.id === id) {
        const updatedTopic = { ...topic, [field]: value };
        if (field === 'similarityPercentage') {
          calculateAverage(topics.map(t => t.id === id ? updatedTopic : t));
        }
        return updatedTopic;
      }
      return topic;
    });
    setTopics(updated);
  };

  const updatePastSubjectTopic = (topicId, pastSubjectIndex, value) => {
    const updated = topics.map(topic => {
      if (topic.id === topicId) {
        const updatedPastSubjects = [...topic.pastSubjectTopics];
        updatedPastSubjects[pastSubjectIndex] = { topic: value };
        return { ...topic, pastSubjectTopics: updatedPastSubjects };
      }
      return topic;
    });
    setTopics(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (topics.length === 0) {
      alert('Please add at least one topic comparison');
      return;
    }

    const invalidTopics = topics.some(topic => 
      !topic.similarityPercentage || 
      isNaN(parseFloat(topic.similarityPercentage)) ||
      parseFloat(topic.similarityPercentage) < 0 ||
      parseFloat(topic.similarityPercentage) > 100
    );

    if (invalidTopics) {
      alert('Please ensure all topics have valid similarity percentages (0-100)');
      return;
    }

    if (averageSimilarity === 0) {
      alert('Please calculate the average similarity percentage');
      return;
    }

    setSubmitting(true);

    const reviewData = {
      similarity_percentage: averageSimilarity,
      sme_review_notes: smeNotes,
      topics_comparison: topics.map(t => ({
        newSubjectTopic: t.newSubjectTopic,
        pastSubjectTopics: t.pastSubjectTopics.map(ps => ({ topic: ps.topic })),
        similarityPercentage: parseFloat(t.similarityPercentage),
      })),
    };

    const res = await reviewSubject(applicationSubjectId, reviewData);

    if (res.success) {
      try {
        localStorage.removeItem(`sme_review_${applicationSubjectId}`);
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      
      const pastSubjectsCount = subjectData?.pastSubjects?.length || 1;
      if (averageSimilarity >= 80) {
        alert(`All ${pastSubjectsCount} past subject(s) approved! Average similarity: ${averageSimilarity}%. Template3 entries have been created automatically.`);
      } else {
        alert(`All ${pastSubjectsCount} past subject(s) rejected. Average similarity: ${averageSimilarity}% (requires >= 80% for approval).`);
      }
      
      navigate('/expert/assignments');
    } else {
      alert(res.message || 'Failed to submit review');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subject details...</p>
          </div>
        </div>
    );
  }

  if (!subjectData) {
    return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Subject not found</p>
          </div>
        </div>
    );
  }

  const pastSubjects = subjectData.pastSubjects || [];
  const totalColumns = 4 + pastSubjects.length;

  return (
      <div className="max-w-[98%] mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate('/expert/assignments')}
              className="text-blue-600 hover:underline"
            >
              ← Back to Assignments
            </button>
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">TEMPLATE 1 - CREDIT TRANSFER SUBJECTS ANALYSIS</h1>
          <p className="text-gray-600 text-sm">Compare topics and calculate similarity percentage. Your progress is automatically saved.</p>
        </div>

        {/* Header Information */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1 text-sm">UniKL Programme</h3>
              <p className="text-sm text-gray-600">{subjectData.application?.program?.program_code || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-1 text-sm">Previous Programme & Institute</h3>
              <p className="text-sm text-gray-600">{subjectData.application?.prev_programme_name || 'N/A'} - {subjectData.application?.prev_campus_name || 'N/A'}</p>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Student:</strong> {subjectData.application?.student?.student_name} ({subjectData.application?.student?.student_email})
            </p>
          </div>
        </div>

        {/* Main Comparison Table */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Subjects Comparison</h2>
            <button
              onClick={addTopicRow}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Add Topic Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-300">
                  <th colSpan={2} className="border border-black px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase">
                    UniKL MIIT (BSE) SUBJECTS
                  </th>
                  <th colSpan={pastSubjects.length} className="border border-black px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase">
                    EQUIVALENCE SUBJECTS FROM PREVIOUS PROGRAMME
                  </th>
                  <th rowSpan={5} className="border border-black px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase align-middle w-[100px]">
                    % OF<br/>SIMILARITY
                  </th>
                  <th rowSpan={5} className="border border-black px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase align-middle w-[120px]">
                    REMARKS
                  </th>
                </tr>
                <tr className="bg-white">
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top w-[80px]">
                    SUBJECT
                  </td>
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                    {subjectData.newCourse?.course_name || 'N/A'}
                  </td>
                  {pastSubjects.map((ps) => (
                    <td key={`subject-${ps.pastSubject_id}`} className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                      {ps.pastSubject_name || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                    CODE
                  </td>
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                    {subjectData.newCourse?.course_code || 'N/A'}
                  </td>
                  {pastSubjects.map((ps) => (
                    <td key={`code-${ps.pastSubject_id}`} className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                      {ps.pastSubject_code || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                    CREDIT
                  </td>
                  <td className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                    {subjectData.newCourse?.course_credit || 'N/A'}
                  </td>
                  {pastSubjects.map((ps) => (
                    <td key={`credit-${ps.pastSubject_id}`} className="border border-black px-3 py-2 text-left text-xs font-bold text-red-600 uppercase align-top">
                      {ps.pastSubject_grade || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-100">
                  <td className="border border-black px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase w-[80px]">
                    NO.
                  </td>
                  <td className="border border-black px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase">
                    TOPICS
                  </td>
                  {pastSubjects.map((ps) => (
                    <td key={`topics-header-${ps.pastSubject_id}`} className="border border-black px-3 py-2 text-center text-xs font-bold text-gray-900 uppercase">
                      TOPICS
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topics.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="border border-black px-4 py-8 text-center text-gray-500 text-sm">
                      No topics added yet. Click "Add Topic Row" to start comparing topics.
                    </td>
                  </tr>
                ) : (
                  topics.map((topic, index) => (
                    <tr key={topic.id} className="hover:bg-gray-50">
                      <td className="border border-black px-3 py-2 text-center text-xs font-semibold">
                        {index + 1}
                      </td>
                      <td className="border border-black px-3 py-2">
                        <input
                          type="text"
                          value={topic.newSubjectTopic}
                          onChange={(e) => updateTopic(topic.id, 'newSubjectTopic', e.target.value)}
                          onBlur={() => {
                            if (applicationSubjectId && (topicsRef.current.length > 0 || smeNotesRef.current.trim().length > 0)) {
                              saveToLocalStorage(topicsRef.current, smeNotesRef.current, averageSimilarityRef.current);
                            }
                          }}
                          placeholder="Enter topic"
                          className="w-full border-none outline-none text-xs bg-transparent"
                        />
                      </td>
                      {pastSubjects.map((ps, psIdx) => (
                        <td key={ps.pastSubject_id} className="border border-black px-3 py-2">
                          <input
                            type="text"
                            value={topic.pastSubjectTopics[psIdx]?.topic || ''}
                            onChange={(e) => updatePastSubjectTopic(topic.id, psIdx, e.target.value)}
                            onBlur={() => {
                              if (applicationSubjectId && (topics.length > 0 || smeNotes.trim().length > 0)) {
                                saveToLocalStorage(topics, smeNotes, averageSimilarity);
                              }
                            }}
                            placeholder="Enter topic"
                            className="w-full border-none outline-none text-xs bg-transparent"
                          />
                        </td>
                      ))}
                      <td className="border border-black px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={topic.similarityPercentage || ''}
                          onChange={(e) => {
                            updateTopic(topic.id, 'similarityPercentage', e.target.value);
                            calculateAverage(topics.map(t => t.id === topic.id ? { ...t, similarityPercentage: e.target.value } : t));
                          }}
                          onBlur={() => {
                            if (applicationSubjectId && (topicsRef.current.length > 0 || smeNotesRef.current.trim().length > 0)) {
                              saveToLocalStorage(topicsRef.current, smeNotesRef.current, averageSimilarityRef.current);
                            }
                          }}
                          placeholder="%"
                          className="w-full border-none outline-none text-xs text-center text-red-600 font-bold bg-transparent"
                        />
                      </td>
                      <td className="border border-black px-3 py-2">
                        <input
                          type="text"
                          placeholder=""
                          className="w-full border-none outline-none text-xs bg-transparent"
                        />
                      </td>
                    </tr>
                  ))
                )}
                {topics.length > 0 && (
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={2 + pastSubjects.length} className="border border-black px-4 py-2 text-right text-xs">
                      AVERAGE SUBJECT CONTENT
                    </td>
                    <td className="border border-black px-3 py-2 text-center">
                      <span className="text-base font-bold text-red-600">
                        {averageSimilarity.toFixed(1)}%
                      </span>
                    </td>
                    <td className="border border-black px-3 py-2"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topics.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Average Subject Content Similarity</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">
                    {averageSimilarity.toFixed(1)}%
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-xs ${
                  averageSimilarity >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {averageSimilarity >= 80 ? (
                    <span className="font-semibold">✓ Eligible for Template3</span>
                  ) : (
                    <span className="font-semibold">⚠ Requires ≥80% for approval</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Notes */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Review Notes</h2>
          <textarea
            value={smeNotes}
            onChange={(e) => setSmeNotes(e.target.value)}
            onBlur={() => {
              if (applicationSubjectId && (topics.length > 0 || smeNotes.trim().length > 0)) {
                saveToLocalStorage(topics, smeNotes, averageSimilarity);
              }
            }}
            placeholder="Enter any additional notes or remarks..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-sm"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSubmit}
            disabled={submitting || topics.length === 0 || averageSimilarity === 0}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {submitting ? 'Submitting...' : `Submit Review (All ${pastSubjects.length} Past Subject${pastSubjects.length !== 1 ? 's' : ''})`}
          </button>
          <button
            onClick={() => navigate('/expert/assignments')}
            className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm"
          >
            Cancel
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <p className="text-xs text-blue-800">
            <strong>Auto-Save Enabled:</strong> Your progress is automatically saved to your browser's local storage every time you make changes. 
            If you accidentally refresh the page, all your entered topics and notes will be restored automatically. 
            When you submit, all {pastSubjects.length} past subject{pastSubjects.length !== 1 ? 's' : ''} will be reviewed together with the calculated average similarity percentage. 
            If the average similarity is ≥80%, all past subjects will be approved and Template3 entries will be created automatically for each. 
            Topics comparison data is not stored in the database - it's only used for your review process.
          </p>
        </div>
      </div>
  );
}