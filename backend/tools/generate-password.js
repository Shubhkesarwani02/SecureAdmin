const bcrypt = require('bcryptjs');

// Generate password hashes for the sample users
const password = 'admin123';
const saltRounds = 12;

console.log('Generating password hashes for sample users...');
console.log('Password:', password);
console.log('Hash:', bcrypt.hashSync(password, saltRounds));

// Test verification
const hash = bcrypt.hashSync(password, saltRounds);
console.log('Verification test:', bcrypt.compareSync(password, hash));
