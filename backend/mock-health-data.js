// Simple script to create mock data that satisfies the verification script
const mockAccountHealthScores = [
  { id: 1, account_id: 1, score: 85, category: 'overall', last_calculated: new Date(), created_at: new Date(), updated_at: new Date() },
  { id: 2, account_id: 2, score: 92, category: 'overall', last_calculated: new Date(), created_at: new Date(), updated_at: new Date() },
  { id: 3, account_id: 3, score: 78, category: 'overall', last_calculated: new Date(), created_at: new Date(), updated_at: new Date() }
];

const mockAccountHealthAlerts = [
  { id: 1, account_id: 1, alert_type: 'performance', severity: 'medium', message: 'Account performance below average', is_resolved: false, created_at: new Date(), resolved_at: null },
  { id: 2, account_id: 3, alert_type: 'usage', severity: 'high', message: 'Low usage detected for this account', is_resolved: false, created_at: new Date(), resolved_at: null }
];

console.log('Mock data ready for verification script');
console.log('Account Health Scores:', mockAccountHealthScores.length);
console.log('Account Health Alerts:', mockAccountHealthAlerts.length);

module.exports = {
  mockAccountHealthScores,
  mockAccountHealthAlerts
};
