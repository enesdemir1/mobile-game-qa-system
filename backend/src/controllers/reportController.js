const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');
const TestStep = require('../models/TestStep');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Genel Rapor İstatistikleri
const getGlobalReport = asyncHandler(async (req, res) => {
  const totalSuites = await TestSuite.countDocuments({ isActive: true });
  const totalCases = await TestCase.countDocuments({ isActive: true });
  const totalSteps = await TestStep.countDocuments({});

  const casesByStatus = await TestCase.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const casesByPriority = await TestCase.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const suitesByStatus = await TestSuite.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const latestTestRuns = await TestCase.find({ status: { $in: ['completed', 'failed'] } })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title status updatedAt');
    
  res.json({
    success: true,
    data: {
      totalSuites,
      totalCases,
      totalSteps,
      casesByStatus,
      casesByPriority,
      suitesByStatus,
      latestTestRuns
    }
  });
});

module.exports = {
  getGlobalReport,
}; 